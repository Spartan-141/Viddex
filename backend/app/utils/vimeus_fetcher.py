from sqlalchemy.orm import Session
from datetime import datetime
import os
import time
import requests
import uuid
from ..models import Series, Season, Episode, VideoLink

VIMEUS_API_KEY = os.getenv("VIMEUS_API_KEY", "")
VIMEUS_VIEW_KEY = os.getenv("VIMEUS_VIEW_KEY", "")


def gen_uuid():
    return str(uuid.uuid4())


def vimeus_embed_episode(
    tmdb_id: int, season: int, episode: int, content_type: str = "series"
) -> str:
    kind = "anime" if content_type == "anime" else "serie"
    return f"https://vimeus.com/e/{kind}?tmdb={tmdb_id}&se={season}&ep={episode}&view_key={VIMEUS_VIEW_KEY}"


def vimeus_get(endpoint: str, params: dict = None):
    headers = {"X-API-Key": VIMEUS_API_KEY, "Accept": "application/json"}
    url = f"https://vimeus.com{endpoint}"
    try:
        r = requests.get(url, headers=headers, params=params, timeout=15)
        if r.ok:
            return r.json().get("data")
    except Exception as e:
        print(f"Error fetching from Vimeus: {e}")
    return None


def sync_vimeus_links_for_series(
    series_id: str, tmdb_id: int, series_type: str, db: Session
):
    """
    Busca en Vimeus los episodios disponibles para una serie y
    empareja/crea los VideoLinks de stream_url para cada episodio local coincidente.
    """
    if not tmdb_id or not VIMEUS_API_KEY:
        return

    print(f"[JIT SYNC] Buscando links de Vimeus para Serie: {series_id}")

    page = 1
    all_vimeus_eps = {}

    # Extraer todos los episodios disponibles en Vimeus
    while True:
        data = vimeus_get("/api/listing/episodes", {"tmdb_id": tmdb_id, "page": page})
        if not data:
            break

        eps = data.get("result", [])
        total_pages = data.get("pages", 1)

        if not eps:
            break

        for ep in eps:
            try:
                s_num = int(ep.get("season") or 0)
                e_num = int(ep.get("episode") or 0)
                all_vimeus_eps[(s_num, e_num)] = ep
            except (ValueError, TypeError):
                continue

        if page >= total_pages:
            break
        page += 1
        time.sleep(0.3)

    if not all_vimeus_eps:
        print(f"[JIT SYNC] No se encontraron links en Vimeus para tmdb_id={tmdb_id}")
        return

    # Mapear los links que vengan a episodios locales
    db_seasons = db.query(Season).filter(Season.series_id == series_id).all()
    links_added = 0

    for season in db_seasons:
        db_episodes = db.query(Episode).filter(Episode.season_id == season.id).all()
        for ep in db_episodes:
            if (season.season_number, ep.episode_number) in all_vimeus_eps:

                # Checkear que no tenga ya un enlace embebido de vimeus
                has_link = (
                    db.query(VideoLink)
                    .filter(
                        VideoLink.episode_id == ep.id,
                        VideoLink.stream_url.like("%vimeus.com%"),
                    )
                    .first()
                )

                if not has_link:
                    embed_url = vimeus_embed_episode(
                        tmdb_id, season.season_number, ep.episode_number, series_type
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
                    links_added += 1

    # Actualizar fecha de ultima sincronización en la Serie
    series = db.query(Series).filter(Series.id == series_id).first()
    if series:
        # Se asume que hemos añadido el campo al modelo
        if hasattr(series, "vimeus_links_last_sync"):
            series.vimeus_links_last_sync = datetime.utcnow()

    db.commit()
    print(f"[JIT SYNC] Proceso completado. +{links_added} links nuevos agregados.")
