import os
import time
import logging
import requests
import uuid

from ..database import SessionLocal
from ..models import Movie, Series, VideoLink

log = logging.getLogger(__name__)

VIMEUS_API_KEY = os.getenv("VIMEUS_API_KEY", "")
VIMEUS_VIEW_KEY = os.getenv("VIMEUS_VIEW_KEY", "")
VIMEUS_BASE = "https://vimeus.com"

RATE_LIMIT_DELAY = 0.1
MAX_PAGES = 999 

def gen_uuid():
    return str(uuid.uuid4())

def vimeus_get(endpoint: str, params: dict = None):
    headers = {"X-API-Key": VIMEUS_API_KEY, "Accept": "application/json"}
    url = f"{VIMEUS_BASE}{endpoint}"
    try:
        r = requests.get(url, headers=headers, params=params, timeout=15)
        if not r.ok:
            log.error(f"Vimeus HTTP {r.status_code} en {endpoint}")
            return None
        data = r.json()
        if data.get("error"):
            log.error(f"Vimeus API error en {endpoint}: {data.get('message')}")
            return None
        return data.get("data")
    except Exception as e:
        log.error(f"Error conexión Vimeus ({endpoint}): {e}")
        return None

def vimeus_embed_movie(tmdb_id: int) -> str:
    return f"https://vimeus.com/e/movie?tmdb={tmdb_id}&view_key={VIMEUS_VIEW_KEY}"


def import_movies(db):
    log.info("🎬 IMPORTANDO PELÍCULAS (FAST SYNC AUTO)")
    stats = {"inserted": 0, "skipped": 0, "failed": 0}
    page = 1

    while page <= MAX_PAGES:
        data = vimeus_get("/api/listing/movies", {"page": page})
        if not data: break
        
        movies_list = data.get("result", [])
        total_pages = data.get("pages", 1)
        if not movies_list: break

        for item in movies_list:
            tmdb_id = item.get("tmdb_id")
            if not tmdb_id: continue

            if db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first():
                stats["skipped"] += 1
                continue

            title = item.get("title", "Sin título")
            
            try:
                movie = Movie(
                    id=gen_uuid(),
                    tmdb_id=tmdb_id,
                    title=title,
                    original_title=title,
                    poster_path=item.get("poster", ""),
                    backdrop_path=item.get("backdrop", "")
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
            except Exception as e:
                db.rollback()
                stats["failed"] += 1

        if page >= total_pages: break
        page += 1
        time.sleep(RATE_LIMIT_DELAY)

    log.info(f"📊 Películas AutoSync: ✅ {stats['inserted']} | ⏭ {stats['skipped']} | ❌ {stats['failed']}")

def import_shows(db, endpoint: str, content_type: str):
    type_label = "SERIES" if content_type == "series" else "ANIMES"
    log.info(f"📺 IMPORTANDO {type_label} (FAST SYNC AUTO)")
    stats = {"inserted": 0, "skipped": 0, "failed": 0}
    page = 1

    while page <= MAX_PAGES:
        data = vimeus_get(endpoint, {"page": page})
        if not data: break

        items = data.get("result", [])
        total_pages = data.get("pages", 1)
        if not items: break

        for item in items:
            tmdb_id = item.get("tmdb_id")
            if not tmdb_id: continue

            if db.query(Series).filter(Series.tmdb_id == tmdb_id).first():
                stats["skipped"] += 1
                continue

            title = item.get("title", "Sin título")

            try:
                series = Series(
                    id=gen_uuid(),
                    tmdb_id=tmdb_id,
                    title=title,
                    original_title=title,
                    poster_path=item.get("poster", ""),
                    backdrop_path=item.get("backdrop", ""),
                    content_type=content_type,
                    total_seasons=item.get("total_seasons", 0),
                    total_episodes=item.get("total_episodes", 0),
                )
                db.add(series)
                db.commit()
                stats["inserted"] += 1
            except Exception as e:
                db.rollback()
                stats["failed"] += 1

        if page >= total_pages: break
        page += 1
        time.sleep(RATE_LIMIT_DELAY)

    log.info(f"📊 {type_label} AutoSync: ✅ {stats['inserted']} | ⏭ {stats['skipped']} | ❌ {stats['failed']}")

def run_all_syncs():
    """Ejecuta la sincronización completa para el Scheduler"""
    if not VIMEUS_API_KEY:
        log.warning("No hay VIMEUS_API_KEY, omitiendo AutoSync.")
        return

    db = SessionLocal()
    try:
        import_movies(db)
        import_shows(db, "/api/listing/series", "series")
        import_shows(db, "/api/listing/animes", "anime")
    except Exception as e:
        log.error(f"Error en AutoSync: {e}")
    finally:
        db.close()
