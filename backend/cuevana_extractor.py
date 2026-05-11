import asyncio
import json
import random
from playwright.async_api import async_playwright

async def extract_cuevana_links(target_url):
    print(f"Initializing stealth extraction for: {target_url}")
    async with async_playwright() as p:
        # Use a specific user agent and viewport
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()

        # Intercept requests to find player.php or other servers
        extracted_urls = []
        
        async def handle_request(request):
            if "player.php" in request.url or "embed" in request.url:
                if request.url not in [u['url'] for u in extracted_urls]:
                    extracted_urls.append({"url": request.url, "method": request.method})
                    print(f"  [DEBUG] Intercepted link: {request.url[:100]}...")

        page.on("request", handle_request)

        try:
            # Go to movie page
            await page.goto(target_url, wait_until="networkidle")
            await asyncio.sleep(random.uniform(2, 4))
            
            # Simulate human behavior: slight scroll
            await page.mouse.wheel(0, 500)
            await asyncio.sleep(random.uniform(1, 2))
            
            # Find all buttons that look like servers
            # Cuevana uses buttons with text like "LATINO", "SUB", etc.
            buttons = await page.query_selector_all("div")
            target_buttons = []
            for btn in buttons:
                text = await btn.inner_text()
                if text and ("LATINO" in text.upper() or "SUB" in text.upper()) and "HD" in text.upper():
                    target_buttons.append(btn)
            
            print(f"Found {len(target_buttons)} potential server buttons.")

            for i, btn in enumerate(target_buttons[:3]): # Test first 3
                print(f"Clicking server button {i+1}...")
                # Move mouse to button first
                box = await btn.bounding_box()
                if box:
                    await page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
                    await asyncio.sleep(random.uniform(0.5, 1))
                    await btn.click()
                    await asyncio.sleep(random.uniform(3, 5)) # Wait for player to load

        except Exception as e:
            print(f"Extraction error: {e}")
            await page.screenshot(path="cuevana_final_error.png")

        await browser.close()
        return extracted_urls

if __name__ == "__main__":
    # Using the movie from the previous screenshot
    url = "https://cuevana.gs/peliculas/hoppers-operacion-castor-2026"
    results = asyncio.run(extract_cuevana_links(url))
    print("\n--- EXTRACTED NETWORK LINKS ---")
    print(json.dumps(results, indent=2))
