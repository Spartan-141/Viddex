import asyncio
import re
from playwright.async_api import async_playwright


class CuevanaScraper:
    def __init__(self):
        self.base_url = "https://cuevana.gs"
        self.search_strategies = [
            # Strategy 1: Standard WP search
            lambda title, year: f"{self.base_url}/?s={title.replace(' ', '+')}+{year}" if year else f"{self.base_url}/?s={title.replace(' ', '+')}",
            # Strategy 2: Clean slug-style search
            lambda title, year: f"{self.base_url}/search/{title.replace(' ', '+')}",
            # Strategy 3: Just the slug with year
            lambda title, year: f"{self.base_url}/peliculas/{title.lower().replace(' ', '-')}-{year}/" if year else None,
        ]

    async def get_fallback_link(self, title: str, year: str = None):
        """
        Searches for a movie on Cuevana and returns the first working player link.
        Tries multiple search strategies to maximise match accuracy.
        
        Args:
            title: Movie title (e.g. "Matrix")
            year:  Release year (e.g. "1999") — improves match accuracy
        """
        print(f"[Scraper] === Starting Cuevana search: '{title}' ({year or 'no year'}) ===")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 720},
                # Pretend to be a real browser
                java_script_enabled=True,
                locale="es-MX",
            )
            page = await context.new_page()

            # --- Optimización: Bloqueo de Anuncios y Recursos Pesados ---
            async def block_ads(route):
                if any(x in route.request.url for x in ["google-analytics", "doubleclick", "ads", "pop", "banner", "tracking"]):
                    await route.abort()
                else:
                    await route.continue_()
            
            await page.route("**/*", block_ads)

            # ─── Intercept ALL network requests and grab player.php links ───
            extracted_links: list[str] = []

            async def handle_request(request):
                url = request.url
                if "player.php" in url and "server=" in url and url not in extracted_links:
                    extracted_links.append(url)
                    print(f"  [NET] Caught player link -> {url[:60]}...")

            page.on("request", handle_request)

            try:
                movie_page_url = await self._find_movie_page(page, title, year)

                if not movie_page_url:
                    print("[Scraper] [FAIL] Could not find a matching movie page.")
                    return None

                print(f"[Scraper] [OK] Movie page located: {movie_page_url}")

                # Navigate to the movie page if we aren't already there
                if page.url != movie_page_url:
                    await page.goto(movie_page_url, wait_until="domcontentloaded", timeout=20000)

                # ── Wait for the React component to hydrate ─────────────────
                await asyncio.sleep(5)

                # ── Try to click every server button we can find ─────────────
                await self._click_all_server_buttons(page)

                # ── Return the best captured link ────────────────────────────
                return self._pick_best_link(extracted_links)

            except Exception as e:
                print(f"[Scraper] [FAIL] Fatal error: {e}")
                try:
                    await page.screenshot(path="scraper_fatal_error.png")
                except Exception:
                    pass
                return None
            finally:
                await browser.close()

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    async def _find_movie_page(self, page, title: str, year: str):
        """
        Iterates through search strategies and returns the URL of the best match.
        """
        for idx, strategy in enumerate(self.search_strategies):
            url = strategy(title, year)
            if not url:
                continue

            print(f"[Scraper] Strategy {idx + 1}: {url}")
            try:
                resp = await page.goto(url, wait_until="domcontentloaded", timeout=15000)

                # Strategy 3 goes directly to the movie page — check if it loaded
                if idx == 2:
                    if resp and resp.status == 200:
                        return url
                    continue

                # For search strategies, look for result links
                # Cuevana wraps results in .TPost, .result-item, or generic article tags
                result = await page.query_selector(
                    ".TPost a, .result-item a, article a, .movies-list a"
                )

                if result:
                    href = await result.get_attribute("href")
                    print(f"  -> Found result link: {href}")
                    # Navigate to the result
                    await result.click()
                    await page.wait_for_load_state("domcontentloaded", timeout=15000)
                    return page.url
                else:
                    print(f"  -> No results found with this strategy.")

            except Exception as e:
                print(f"  -> Strategy {idx + 1} failed: {e}")
                continue

        return None

    async def _click_all_server_buttons(self, page):
        """
        Finds language/server selector buttons and clicks each one so that
        the network interceptor can capture the player.php URL for each server.
        """
        print("[Scraper] Looking for server/language buttons...")
        
        # 1. Scroll deeper to trigger lazy loading and reach the buttons
        await page.mouse.wheel(0, 1500)
        await asyncio.sleep(3)

        # 2. Wait for the server list container to be present
        try:
            await page.wait_for_selector(".OptionList, .aa-tgl, #top-ms-1", timeout=10000)
        except:
            print("[Scraper] [DEBUG] Warning: Server list container not found by selector.")

        # 3. Aggressive search with improved selectors
        selectors = [
            ".OptionList li", 
            ".aa-tgl", 
            "#top-ms-1", 
            ".opt-server",
            "li[data-lang]",
            "div[data-lang]",
            "li[data-server]",
            "a.load-player",
            "span:has-text('LATINO')",
            "div:has-text('LATINO')"
        ]
        
        candidates = []
        for selector in selectors:
            try:
                elements = await page.query_selector_all(selector)
                for el in elements:
                    txt = (await el.inner_text()).upper()
                    # Also check attributes as some buttons have no text
                    d_lang = await el.get_attribute("data-lang") or ""
                    d_srv = await el.get_attribute("data-server") or ""
                    
                    if any(kw in txt for kw in ["LATINO", "SUB", "ESPAÑOL", "IDIOMA", "SERVER"]) or d_lang or d_srv:
                        candidates.append(el)
            except:
                continue

        # 3. Fallback: search ALL divs if still nothing
        if not candidates:
            all_divs = await page.query_selector_all("div, li, span, button")
            for el in all_divs:
                try:
                    txt = (await el.inner_text()).upper()
                    if txt and len(txt) < 20 and any(kw in txt for kw in ["LATINO", "SUB", "ESP"]):
                        candidates.append(el)
                except:
                    continue

        print(f"[Scraper] Found {len(candidates)} potential server elements.")
        
        if not candidates:
            # Capturamos pantalla para ver qué está pasando
            await page.screenshot(path="debug_no_buttons.png")
            print("[Scraper] [DEBUG] Saved 'debug_no_buttons.png' to check DOM.")

        # Click the first few candidates to trigger the player.php requests
        for el in candidates[:5]:
            try:
                # Get text for logging before clicking
                txt = (await el.inner_text()).strip()
                print(f"  Clicking element: '{txt[:30]}'")
                
                # Use a more reliable click (force if necessary)
                await el.click(force=True, timeout=5000)
                await asyncio.sleep(3) # Wait for player to load
            except Exception as e:
                # print(f"  Could not click: {e}")
                continue

    def _pick_best_link(self, links: list[str]):
        """
        From the list of captured player.php links, pick the best one.
        Priority: vimeos > any other server.
        """
        if not links:
            print("[Scraper] [FAIL] No player links were captured.")
            return None

        vimeos = [l for l in links if "server=vimeos" in l]
        if vimeos:
            print(f"[Scraper] [OK] Returning vimeos link.")
            return vimeos[0]

        print(f"[Scraper] [OK] Returning first available link.")
        return links[0]


# Singleton instance
cuevana_scraper = CuevanaScraper()
