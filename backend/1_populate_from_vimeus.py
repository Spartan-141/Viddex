#!/usr/bin/env python3
"""
1_populate_from_vimeus.py — Importa el catálogo completo de Vimeus a VIDDEX.

FLUJO:
  1. Consulta /api/listing/movies de Vimeus (paginado).
  2. Enriquece cada item con datos TMDB en es-MX.
  3. Inserta Movie + VideoLink (stream_url = embed de Vimeus).
  4. Repite para series, animes y sus episodios.

PREREQUISITOS:
  - Las variables TMDB_API_KEY, VIMEUS_API_KEY y VIMEUS_VIEW_KEY en .env
  - python -m pip install requests python-dotenv (ya en requirements.txt)

EJECUTAR:
  cd /home/Spartan/Desktop/viddex/backend
  python 1_populate_from_vimeus.py

OPCIONES:
  --movies-only   Importar solo películas
  --series-only   Importar solo series
  --animes-only   Importar solo animes
"""
import sys
import os
import time
import logging
import argparse
import requests

# Setup path
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal
from app.models import Movie, Series, Season, Episode, VideoLink
from app.utils.tmdb_sync import sync_series_episodes_from_tmdb
import uuid

# ─── Configuración ──────────────────────────────────────────────────────────

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
VIMEUS_API_KEY = os.getenv("VIMEUS_API_KEY", "")
VIMEUS_VIEW_KEY = os.getenv("VIMEUS_VIEW_KEY", "")
TMDB_BASE = "https://api.themoviedb.org/3"
VIMEUS_BASE = "https://vimeus.com"

RATE_LIMIT_DELAY = 0.3  # Segundos entre llamadas a APIs
MAX_PAGES = 999  # Máximo de páginas a paginar (ajustable)

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("vimeus_import.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

# ─── Helpers ────────────────────────────────────────────────────────────────


def gen_uuid():
    return str(uuid.uuid4())


def vimeus_get(endpoint: str, params: dict = None):
    """Llamada autenticada a la API de Vimeus."""
    headers = {"X-API-Key": VIMEUS_API_KEY, "Accept": "application/json"}
    url = f"{VIMEUS_BASE}{endpoint}"
    try:
        r = requests.get(url, headers=headers, params=params, timeout=15)
        if not r.ok:
            log.error(f"Vimeus HTTP {r.status_code} en {endpoint}: {r.text[:300]}")
            return None
        data = r.json()
        if data.get("error"):
            log.error(f"Vimeus API error en {endpoint}: {data.get('message')}")
            return None
        return data.get("data")
    except requests.exceptions.ConnectionError as e:
        log.error(f"Sin conexión a Vimeus ({endpoint}): {e}")
        return None
    except Exception as e:
        log.error(f"Vimeus error inesperado en {endpoint}: {type(e).__name__}: {e}")
        return None


def tmdb_get(endpoint: str, params: dict = None):
    """Llamada a la API de TMDB."""
    base_params = {"api_key": TMDB_API_KEY, "language": "es-MX"}
    if params:
        base_params.update(params)
    url = f"{TMDB_BASE}{endpoint}"
    try:
        r = requests.get(url, params=base_params, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log.warning(f"TMDB error {endpoint}: {e}")
        return None


def vimeus_embed_movie(tmdb_id: int) -> str:
    return f"https://vimeus.com/e/movie?tmdb={tmdb_id}&view_key={VIMEUS_VIEW_KEY}"


def vimeus_embed_serie(tmdb_id: int) -> str:
    return f"https://vimeus.com/e/serie?tmdb={tmdb_id}&view_key={VIMEUS_VIEW_KEY}"


def vimeus_embed_anime(tmdb_id: int) -> str:
    return f"https://vimeus.com/e/anime?tmdb={tmdb_id}&view_key={VIMEUS_VIEW_KEY}"


def vimeus_embed_episode(
    tmdb_id: int, season: int, episode: int, content_type: str = "series"
) -> str:
    kind = "anime" if content_type == "anime" else "serie"
    return f"https://vimeus.com/e/{kind}?tmdb={tmdb_id}&se={season}&ep={episode}&view_key={VIMEUS_VIEW_KEY}"


# ─── Validaciones básicas ────────────────────────────────────────────────────


def check_env():
    errors = []
    if not TMDB_API_KEY:
        errors.append("TMDB_API_KEY no definida en .env")
    if not VIMEUS_API_KEY or VIMEUS_API_KEY.startswith("PON_AQUI"):
        errors.append("VIMEUS_API_KEY no definida en .env")
    if not VIMEUS_VIEW_KEY:
        errors.append("VIMEUS_VIEW_KEY no definida en .env")
    if errors:
        for e in errors:
            log.error(f"❌ {e}")
        sys.exit(1)


# ─── Importar Películas ──────────────────────────────────────────────────────


def import_movies(db):
    log.info("═" * 60)
    log.info("🎬  IMPORTANDO PELÍCULAS")
    log.info("═" * 60)

    stats = {"inserted": 0, "skipped": 0, "failed": 0}
    page = 1

    while page <= MAX_PAGES:
        data = vimeus_get("/api/listing/movies", {"page": page})
        if not data:
            log.warning(f"  ⚠️  Vimeus no devolvió datos en página {page} (movies)")
            break

        movies_list = data.get("result", [])  # La API real usa 'result'
        total_pages = data.get("pages", 1)  # La API real usa 'pages'
        if not movies_list:
            break

        log.info(f"📄 Página {page}/{total_pages} — {len(movies_list)} películas")

        for vimeus_movie in movies_list:
            tmdb_id = vimeus_movie.get("tmdb_id")
            if not tmdb_id:
                stats["failed"] += 1
                continue

            # ¿Ya existe?
            if db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first():
                log.debug(f"  ⏭  SKIP: Movie tmdb_id={tmdb_id} ya existe")
                stats["skipped"] += 1
                time.sleep(RATE_LIMIT_DELAY)
                continue

            # Enriquecer con TMDB
            tmdb_data = tmdb_get(f"/movie/{tmdb_id}")
            time.sleep(RATE_LIMIT_DELAY)

            title = (tmdb_data.get("title") if tmdb_data else None) or vimeus_movie.get(
                "title", "Sin título"
            )
            overview = (tmdb_data.get("overview") if tmdb_data else None) or ""
            poster_path = (
                tmdb_data.get("poster_path") if tmdb_data else None
            ) or vimeus_movie.get("poster", "")
            backdrop_path = (
                tmdb_data.get("backdrop_path") if tmdb_data else None
            ) or vimeus_movie.get("backdrop", "")
            release_date = (tmdb_data.get("release_date") if tmdb_data else None) or ""
            tmdb_rating = (tmdb_data.get("vote_average") if tmdb_data else None) or 0.0
            tmdb_vote_count = (tmdb_data.get("vote_count") if tmdb_data else None) or 0
            original_title = (
                tmdb_data.get("original_title") if tmdb_data else None
            ) or title
            original_language = (
                tmdb_data.get("original_language") if tmdb_data else None
            ) or ""
            runtime = (tmdb_data.get("runtime") if tmdb_data else None) or None
            tagline = (tmdb_data.get("tagline") if tmdb_data else None) or ""

            try:
                movie = Movie(
                    id=gen_uuid(),
                    tmdb_id=tmdb_id,
                    title=title,
                    original_title=original_title,
                    overview=overview,
                    tagline=tagline,
                    release_date=release_date,
                    runtime=runtime,
                    poster_path=poster_path,
                    backdrop_path=backdrop_path,
                    tmdb_rating=tmdb_rating,
                    tmdb_vote_count=tmdb_vote_count,
                    original_language=original_language,
                )
                db.add(movie)
                db.flush()

                link = VideoLink(
                    id=gen_uuid(),
                    movie_id=movie.id,
                    stream_url=vimeus_embed_movie(tmdb_id),
                    quality="FHD",
                    language="LAT",
                    title="Vimeus HD",
                )
                db.add(link)
                db.commit()
                stats["inserted"] += 1
                log.info(f"  ✅ {title} (tmdb={tmdb_id})")

            except Exception as e:
                db.rollback()
                stats["failed"] += 1
                log.error(f"  ❌ Error insertando tmdb_id={tmdb_id}: {e}")

        if page >= total_pages:
            break
        page += 1
        time.sleep(RATE_LIMIT_DELAY)

    log.info(
        f"\n📊 Películas: ✅ {stats['inserted']} nuevas | ⏭ {stats['skipped']} existentes | ❌ {stats['failed']} errores\n"
    )
    return stats


# ─── Importar Series / Animes ────────────────────────────────────────────────


def import_series_bulk(db, vimeus_endpoint: str, content_type: str):
    """Importa series o animes (sin episodios, solo el show principal)."""
    log.info("═" * 60)
    type_label = "SERIES" if content_type == "series" else "ANIMES"
    log.info(f"📺  IMPORTANDO {type_label}")
    log.info("═" * 60)

    stats = {"inserted": 0, "skipped": 0, "failed": 0}
    page = 1

    while page <= MAX_PAGES:
        data = vimeus_get(vimeus_endpoint, {"page": page})
        if not data:
            log.warning(f"  ⚠️  Vimeus sin datos en página {page} ({content_type})")
            break

        items = data.get("result", [])  # La API real usa 'result'
        total_pages = data.get("pages", 1)  # La API real usa 'pages'
        if not items:
            break

        log.info(f"📄 Página {page}/{total_pages} — {len(items)} {content_type}")

        for item in items:
            tmdb_id = item.get("tmdb_id")
            if not tmdb_id:
                stats["failed"] += 1
                continue

            if db.query(Series).filter(Series.tmdb_id == tmdb_id).first():
                log.debug(f"  ⏭  SKIP: Series tmdb_id={tmdb_id} ya existe")
                stats["skipped"] += 1
                time.sleep(RATE_LIMIT_DELAY)
                continue

            tmdb_data = tmdb_get(f"/tv/{tmdb_id}")
            time.sleep(RATE_LIMIT_DELAY)

            title = (tmdb_data.get("name") if tmdb_data else None) or item.get(
                "title", "Sin título"
            )
            overview = (tmdb_data.get("overview") if tmdb_data else None) or ""
            poster_path = (
                tmdb_data.get("poster_path") if tmdb_data else None
            ) or item.get("poster", "")
            backdrop_path = (
                tmdb_data.get("backdrop_path") if tmdb_data else None
            ) or item.get("backdrop", "")
            first_air_date = (
                tmdb_data.get("first_air_date") if tmdb_data else None
            ) or ""
            tmdb_rating = (tmdb_data.get("vote_average") if tmdb_data else None) or 0.0
            tmdb_vote_count = (tmdb_data.get("vote_count") if tmdb_data else None) or 0
            original_title = (
                tmdb_data.get("original_name") if tmdb_data else None
            ) or title
            original_language = (
                tmdb_data.get("original_language") if tmdb_data else None
            ) or ""
            total_seasons = (
                item.get("total_seasons")
                or (tmdb_data.get("number_of_seasons") if tmdb_data else None)
                or 0
            )
            total_eps = (
                item.get("total_episodes")
                or (tmdb_data.get("number_of_episodes") if tmdb_data else None)
                or 0
            )

            try:
                series = Series(
                    id=gen_uuid(),
                    tmdb_id=tmdb_id,
                    title=title,
                    original_title=original_title,
                    overview=overview,
                    first_air_date=first_air_date,
                    poster_path=poster_path,
                    backdrop_path=backdrop_path,
                    tmdb_rating=tmdb_rating,
                    tmdb_vote_count=tmdb_vote_count,
                    original_language=original_language,
                    content_type=content_type,
                    total_seasons=total_seasons,
                    total_episodes=total_eps,
                )
                db.add(series)
                db.commit()
                stats["inserted"] += 1
                log.info(f"  ✅ {title} (tmdb={tmdb_id})")
            except Exception as e:
                db.rollback()
                stats["failed"] += 1
                log.error(f"  ❌ Error insertando series tmdb_id={tmdb_id}: {e}")

        if page >= total_pages:
            break
        page += 1
        time.sleep(RATE_LIMIT_DELAY)

    log.info(
        f"\n📊 {type_label}: ✅ {stats['inserted']} nuevas | ⏭ {stats['skipped']} existentes | ❌ {stats['failed']} errores\n"
    )
    return stats


def import_episodes(db):
    """Importa los episodios de todas las series/animes comprobando la estructura completa de TMDB primero."""
    log.info("═" * 60)
    log.info("🎞️  SINC. EPISODIOS (TMDB + VIMEUS LINKS)")
    log.info("═" * 60)

    all_series = db.query(Series).all()
    log.info(f"   Total series a procesar: {len(all_series)}")

    total_links = 0

    for series in all_series:
        tmdb_id = series.tmdb_id
        if not tmdb_id:
            continue

        log.info(f"\n  📺 {series.title} (tmdb={tmdb_id})")

        # 1. Sincronizar estructura completa desde TMDB primero (Creará Seasons y Episodes locales)
        try:
            sync_series_episodes_from_tmdb(series.id, tmdb_id, db)
        except Exception as e:
            log.error(f"Error sincronizando TMDB para {series.title}: {e}")
            continue

        # 2. Obtener lista de episodios DISPONIBLES en Vimeus para generar los links
        page = 1
        all_vimeus_eps: dict[tuple, dict] = {}  # (season, episode) -> data

        while True:
            data = vimeus_get(
                "/api/listing/episodes", {"tmdb_id": tmdb_id, "page": page}
            )
            if not data:
                log.warning(
                    f"    ⚠️  Vimeus no devolvió datos para episodios de tmdb={tmdb_id}"
                )
                break
            eps = data.get("result", [])
            total_pages = data.get("pages", 1)
            log.debug(f"    Página {page} de episodios: {len(eps)} items")
            if not eps:
                break
            for ep in eps:
                try:
                    s_num = int(ep.get("season") or 0)
                    e_num = int(ep.get("episode") or 0)
                    # Aceptar temporada o episodio >= 0 (algunas APIs usan 0 para especiales)
                    all_vimeus_eps[(s_num, e_num)] = ep
                except (ValueError, TypeError):
                    continue
            if page >= total_pages:
                break
            page += 1
            time.sleep(RATE_LIMIT_DELAY)

        if not all_vimeus_eps:
            log.info(f"    ⏭  Sin enlaces en Vimeus para esta serie")
            continue

        log.info(f"    Enlaces disponibles en Vimeus: {len(all_vimeus_eps)}")

        # 3. Emparejar episodios locales cruzándoles el embed link
        db_seasons = db.query(Season).filter(Season.series_id == series.id).all()
        for season in db_seasons:
            db_episodes = db.query(Episode).filter(Episode.season_id == season.id).all()
            for ep in db_episodes:
                # Comprobar si Vimeus tiene este episodio
                if (season.season_number, ep.episode_number) in all_vimeus_eps:
                    # Comprobar si ya tiene un VideoLink de Vimeus
                    has_link = (
                        db.query(VideoLink)
                        .filter(
                            VideoLink.episode_id == ep.id,
                            VideoLink.stream_url.like("%vimeus.com%"),
                        )
                        .first()
                    )

                    if not has_link:
                        try:
                            embed_url = vimeus_embed_episode(
                                tmdb_id,
                                season.season_number,
                                ep.episode_number,
                                series.content_type,
                            )
                            link = VideoLink(
                                id=gen_uuid(),
                                episode_id=ep.id,
                                stream_url=embed_url,
                                quality="FHD",
                                language="LAT",
                                title=f"T{season.season_number}E{ep.episode_number} - Vimeus",
                            )
                            db.add(link)
                            total_links += 1
                            log.info(
                                f"    🔗 Link Vimeus añadido: T{season.season_number:02d}E{ep.episode_number:02d}"
                            )
                        except Exception as e:
                            log.error(f"Error generando link para {ep.name}: {e}")

        db.commit()

    log.info(f"\n📊 Total links de Vimeus importados: {total_links}\n")


# ─── Main ─────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="Importar catálogo Vimeus a VIDDEX")
    parser.add_argument("--movies-only", action="store_true")
    parser.add_argument("--series-only", action="store_true")
    parser.add_argument("--animes-only", action="store_true")
    parser.add_argument(
        "--no-episodes", action="store_true", help="Importar shows pero no episodios"
    )
    args = parser.parse_args()

    check_env()

    db = SessionLocal()
    import_all = not (args.movies_only or args.series_only or args.animes_only)

    try:
        if import_all or args.movies_only:
            import_movies(db)

        if import_all or args.series_only:
            import_series_bulk(db, "/api/listing/series", "series")
            if not args.no_episodes:
                import_episodes(db)

        if import_all or args.animes_only:
            import_series_bulk(db, "/api/listing/animes", "anime")
            if not args.no_episodes:
                import_episodes(db)

    finally:
        db.close()

    log.info(
        "🏁  Importación completada. Revisa vimeus_import.log para el detalle completo."
    )


if __name__ == "__main__":
    main()
