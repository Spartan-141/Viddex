from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Series, Season, Episode
from ..schemas import (
    SeriesCreate,
    SeriesPublic,
    SeriesList,
    TmdbCheckRequest,
)
from ..auth import require_admin
from ..utils.tmdb_sync import hydrate_series
from ..utils.vimeus_fetcher import sync_vimeus_links_for_series
from ..utils.security import get_signed_url

router = APIRouter(prefix="/series", tags=["Series"])


@router.get("", response_model=List[SeriesList])
def list_series(
    q: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None, description="'series' o 'anime'"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Series)
    if q:
        # Búsqueda insensible a acentos usando la función registrada en SQLite
        query = query.filter(func.unaccent(Series.title).ilike(func.unaccent(f"%{q}%")))
    if content_type:
        query = query.filter(Series.content_type == content_type)
    return query.order_by(Series.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/available", response_model=List[SeriesList])
def get_available_series(body: TmdbCheckRequest, db: Session = Depends(get_db)):
    """
    Con Lazy Hydration, asumimos que todas las series en BD importadas de Vimeus
    están disponibles. No filtramos por VideoLink porque se generan JIT.
    """
    series = (
        db.query(Series)
        .filter(Series.tmdb_id.in_(body.tmdb_ids))
        .all()
    )
    return series


@router.get("/recent", response_model=List[SeriesList])
def get_recent_series(limit: int = 15, db: Session = Depends(get_db)):
    """Devuelve las últimas series añadidas."""
    series = (
        db.query(Series)
        .order_by(Series.created_at.desc())
        .limit(limit)
        .all()
    )
    return series


@router.get("/classics", response_model=List[SeriesList])
def get_classic_series(limit: int = 15, db: Session = Depends(get_db)):
    """Devuelve las 'Joyas de la TV'."""
    series = (
        db.query(Series)
        .filter(Series.tmdb_rating >= 8.0)
        .filter(Series.tmdb_vote_count >= 1000)
        .order_by(Series.tmdb_rating.desc())
        .limit(limit)
        .all()
    )
    return series


@router.get("/{series_id}", response_model=SeriesPublic)
def get_series(
    series_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):

    s = (
        db.query(Series)
        .options(
            joinedload(Series.seasons)
            .joinedload(Season.episodes)
            .joinedload(Episode.video_links)
        )
        .filter(Series.id == series_id)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")

    # Lazy Hydration: Si falta la sinopsis
    if not s.overview:
        hydrate_series(s, db)

    # Sincronización JIT de links de Vimeus
    sync_threshold = timedelta(hours=6)

    # Lazy Hydration de Episodios directo desde Vimeus
    if s.tmdb_id:
        if s.vimeus_links_last_sync is None or not s.seasons:
            # PRIMERA VISITA: Construir estructura y enlaces síncronamente
            sync_vimeus_links_for_series(s.id, s.tmdb_id, s.content_type, db)
            db.expire(s)
            s = (
                db.query(Series)
                .options(
                    joinedload(Series.seasons)
                    .joinedload(Season.episodes)
                    .joinedload(Episode.video_links)
                )
                .filter(Series.id == series_id)
                .first()
            )
        elif (datetime.utcnow() - s.vimeus_links_last_sync) > sync_threshold:
            # VISITAS SIGUIENTES: Background sync
            background_tasks.add_task(
                sync_vimeus_links_for_series, s.id, s.tmdb_id, s.content_type, db
            )

    # Generar URLs firmadas dinámicamente para episodios de Telegram
    for season in s.seasons:
        for episode in season.episodes:
            for link in episode.video_links:
                if link.tg_chat_id:
                    link.signed_url = get_signed_url(link.id)

    return s


@router.post("", response_model=SeriesList, status_code=201)
def create_series(
    body: SeriesCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if body.tmdb_id and db.query(Series).filter(Series.tmdb_id == body.tmdb_id).first():
        raise HTTPException(
            status_code=409, detail="Esta serie ya existe (mismo TMDB ID)"
        )
    series = Series(**body.model_dump())
    db.add(series)
    db.commit()
    db.refresh(series)

    # Ya no sincronizamos desde TMDB, los enlaces se cargarán al vuelo cuando un usuario entre a la serie
    return series


@router.delete("/{series_id}", status_code=204)
def delete_series(
    series_id: str, db: Session = Depends(get_db), _=Depends(require_admin)
):
    s = db.query(Series).filter(Series.id == series_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    db.delete(s)
    db.commit()


@router.get("/missing-links", response_model=List[SeriesList])
def series_missing_links(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Devuelve series sin ningún VideoLink en sus episodios.
    Útil para identificar series que requieren subida manual a Telegram.
    """
    # Los modelos ya están importados a nivel de módulo

    # Series que tienen al menos un VideoLink en algún episodio
    series_with_links = (
        db.query(Series.id)
        .join(Se, Se.series_id == Series.id)
        .join(Episode, Episode.season_id == Se.id)
        .join(VL, VL.episode_id == Episode.id)
        .distinct()
        .subquery()
    )
    series = (
        db.query(Series)
        .filter(Series.id.notin_(series_with_links))
        .order_by(Series.title)
        .all()
    )
    return series
