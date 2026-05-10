from sqlalchemy.orm import Session
import os
import requests
import uuid
from typing import Optional
from ..models import Series, Season, Episode

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"


def gen_uuid():
    return str(uuid.uuid4())


def tmdb_get(endpoint: str, params: dict = None) -> Optional[dict]:
    """Helper para hacer requests a TMDB."""
    base_params = {"api_key": TMDB_API_KEY, "language": "es-MX"}
    if params:
        base_params.update(params)
    try:
        r = requests.get(f"{TMDB_BASE_URL}{endpoint}", params=base_params, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"Error llamando a TMDB {endpoint}: {e}")
    return None

def hydrate_movie(movie, db: Session):
    if not movie.tmdb_id: return
    data = tmdb_get(f"/movie/{movie.tmdb_id}")
    if not data: return
    
    movie.overview = data.get("overview") or ""
    movie.tagline = data.get("tagline") or ""
    movie.release_date = data.get("release_date") or ""
    movie.runtime = data.get("runtime") or None
    movie.tmdb_rating = data.get("vote_average") or 0.0
    movie.tmdb_vote_count = data.get("vote_count") or 0
    movie.original_language = data.get("original_language") or ""
    # Si vimeus no trajo poster, lo tomamos
    if not movie.poster_path: movie.poster_path = data.get("poster_path") or ""
    if not movie.backdrop_path: movie.backdrop_path = data.get("backdrop_path") or ""
    
    db.commit()
    db.refresh(movie)

def hydrate_series(series, db: Session):
    if not series.tmdb_id: return
    data = tmdb_get(f"/tv/{series.tmdb_id}")
    if not data: return
    
    series.overview = data.get("overview") or ""
    series.tagline = data.get("tagline") or ""
    series.first_air_date = data.get("first_air_date") or ""
    series.tmdb_rating = data.get("vote_average") or 0.0
    series.tmdb_vote_count = data.get("vote_count") or 0
    series.original_language = data.get("original_language") or ""
    
    if not series.total_seasons: series.total_seasons = data.get("number_of_seasons") or 0
    if not series.total_episodes: series.total_episodes = data.get("number_of_episodes") or 0
    if not series.poster_path: series.poster_path = data.get("poster_path") or ""
    if not series.backdrop_path: series.backdrop_path = data.get("backdrop_path") or ""
    
    db.commit()
    db.refresh(series)


def sync_series_episodes_from_tmdb(series_id: str, tmdb_id: int, db: Session):
    """
    Se comunica con TMDB, descarga la data principal de la serie para saber cuántas
    temporadas tiene, y luego itera por cada temporada descargando y consolidando
    todos los episodios en la base de datos local.
    """
    if not tmdb_id:
        return

    print(f"Sincronizando Serie {series_id} (TMDB: {tmdb_id})...")

    # Obtener el total de temporadas
    tmdb_show = tmdb_get(f"/tv/{tmdb_id}")
    if not tmdb_show:
        print(f"Serie {tmdb_id} no encontrada en TMDB.")
        return

    total_seasons = tmdb_show.get("number_of_seasons", 0)
    seasons_data = tmdb_show.get("seasons", [])

    # Procesar temporada por temporada (ignorar Specials: season_number=0 a menos que sea necesario)
    for s_data in seasons_data:
        season_num = s_data.get("season_number")
        if season_num is None or season_num == 0:
            continue

        # Comprobar si la temporada ya existe localmente
        season = (
            db.query(Season)
            .filter(Season.series_id == series_id, Season.season_number == season_num)
            .first()
        )

        # Consultar la temporada en vivo para sacar episodios detallados
        season_details = tmdb_get(f"/tv/{tmdb_id}/season/{season_num}")
        if not season_details:
            continue

        if not season:
            season = Season(
                id=gen_uuid(),
                series_id=series_id,
                season_number=season_num,
                name=season_details.get("name") or f"Temporada {season_num}",
                overview=season_details.get("overview") or "",
                poster_path=season_details.get("poster_path") or "",
                air_date=season_details.get("air_date") or "",
                episode_count=len(season_details.get("episodes", [])),
            )
            db.add(season)
            db.flush()  # Guardar temporal para obtener ID foránea

        # Refrescar y agregar episodios
        episodes_list = season_details.get("episodes", [])
        for ep_data in episodes_list:
            ep_num = ep_data.get("episode_number")
            existing_ep = (
                db.query(Episode)
                .filter(
                    Episode.season_id == season.id, Episode.episode_number == ep_num
                )
                .first()
            )

            if not existing_ep:
                episode = Episode(
                    id=gen_uuid(),
                    series_id=series_id,
                    season_id=season.id,
                    episode_number=ep_num,
                    name=ep_data.get("name") or f"Episodio {ep_num}",
                    overview=ep_data.get("overview") or "",
                    still_path=ep_data.get("still_path") or "",
                    air_date=ep_data.get("air_date") or "",
                    runtime=ep_data.get("runtime") or None,
                )
                db.add(episode)

    # Confirmar cambios a la BD
    db.commit()
    print(
        f"Sincronización completa para TMDB {tmdb_id}. Temporadas procesadas: {total_seasons}"
    )
