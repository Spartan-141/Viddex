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
    Busca en Vimeus los episodios disponibles para una serie.
    Genera las Temporadas y Episodios localmente basándose 100% en lo que Vimeus
    tiene disponible, omitiendo TMDB.
    """
    if not tmdb_id or not VIMEUS_API_KEY:
        return

    print(f"[JIT SYNC] Construyendo estructura desde Vimeus para Serie: {series_id}")

    page = 1
    links_added = 0

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
                
                # Buscar o crear Temporada
                season = db.query(Season).filter(Season.series_id == series_id, Season.season_number == s_num).first()
                if not season:
                    season = Season(
                        id=gen_uuid(),
                        series_id=series_id,
                        season_number=s_num,
                        name=f"Temporada {s_num}",
                        episode_count=0
                    )
                    db.add(season)
                    db.flush()

                # Buscar o crear Episodio
                episode = db.query(Episode).filter(Episode.season_id == season.id, Episode.episode_number == e_num).first()
                if not episode:
                    episode = Episode(
                        id=gen_uuid(),
                        series_id=series_id,
                        season_id=season.id,
                        episode_number=e_num,
                        name=ep.get("show_title") or f"Episodio {e_num}",
                    )
                    db.add(episode)
                    db.flush()
                    
                    # Actualizar contador de episodios en la temporada
                    season.episode_count += 1

                # Buscar o crear VideoLink
                has_link = db.query(VideoLink).filter(VideoLink.episode_id == episode.id, VideoLink.stream_url.like("%vimeus.com%")).first()
                if not has_link:
                    embed_url = vimeus_embed_episode(tmdb_id, s_num, e_num, series_type)
                    link = VideoLink(
                        id=gen_uuid(),
                        episode_id=episode.id,
                        stream_url=embed_url,
                        quality=ep.get("quality", "FHD"),
                        language="LAT",
                        title=f"T{s_num}E{e_num} - Vimeus",
                    )
                    db.add(link)
                    links_added += 1

            except Exception as e:
                print(f"Error procesando episodio Vimeus: {e}")
                continue

        if page >= total_pages:
            break
        page += 1
        time.sleep(0.1)

    # Actualizar fecha de ultima sincronización en la Serie
    series = db.query(Series).filter(Series.id == series_id).first()
    if series:
        if hasattr(series, "vimeus_links_last_sync"):
            series.vimeus_links_last_sync = datetime.utcnow()

    db.commit()
    print(f"[JIT SYNC] Proceso completado. Estructura construida y {links_added} links agregados.")
