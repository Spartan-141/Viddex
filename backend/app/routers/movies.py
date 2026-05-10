# app/routers/movies.py
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Movie, VideoLink
from ..schemas import (
    MovieCreate,
    MoviePublic,
    MovieList,
    VideoLinkCreate,
    VideoLinkPublic,
    VideoLinkUpdate,
    TmdbCheckRequest,
)
from ..auth import require_admin
from ..utils.security import get_signed_url
from ..utils.tmdb_sync import hydrate_movie

router = APIRouter(prefix="/movies", tags=["Movies"])

# ─── Helpers ──────────────────────────────────────────────────────────────────

_UUID_RE = re.compile(
    r"/stream/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"
)


def _resolve_link(
    db: Session,
    stream_url: str,
    movie_id: str,
    quality: str,
    language: str,
    title: Optional[str],
) -> VideoLink:
    """
    Vincula un VideoLink a una película.
    - Si la URL es del Bridge (contiene /stream/UUID), busca el VideoLink del Bot
      y le asigna el movie_id (preservando los metadatos de Telegram).
    - Si no, crea un VideoLink nuevo con la URL como fallback.
    En ambos casos NO borra links existentes (soporte MULTI-LINK).
    """
    m = _UUID_RE.search(stream_url or "")
    if m:
        vid_id = m.group(1)
        bot_link = db.query(VideoLink).filter(VideoLink.id == vid_id).first()
        if bot_link:
            bot_link.movie_id = movie_id
            bot_link.quality = quality or bot_link.quality or "HD"
            bot_link.language = language or bot_link.language or "LAT"
            if title:
                bot_link.title = title
            db.commit()
            db.refresh(bot_link)
            return bot_link

    # Fallback: URL externa o link sin UUID de Bridge
    link = VideoLink(
        movie_id=movie_id,
        stream_url=stream_url,
        quality=quality or "HD",
        language=language or "LAT",
        title=title,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.get("", response_model=List[MovieList])
def list_movies(
    q: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Movie).options(joinedload(Movie.video_links))
    if q:
        # Búsqueda insensible a acentos usando la función registrada en SQLite
        query = query.filter(func.unaccent(Movie.title).ilike(func.unaccent(f"%{q}%")))
    movies = query.order_by(Movie.created_at.desc()).offset(skip).limit(limit).all()
    for movie in movies:
        for link in movie.video_links:
            if link.tg_chat_id:
                link.signed_url = get_signed_url(link.id)
    return movies


@router.post("/available", response_model=List[MovieList])
def get_available_movies(body: TmdbCheckRequest, db: Session = Depends(get_db)):
    """Devuelve solo las películas que existan en BD y tengan al menos un VideoLink."""
    movies_with_links = (
        db.query(Movie.id).join(VideoLink, VideoLink.movie_id == Movie.id).subquery()
    )
    movies = (
        db.query(Movie)
        .options(joinedload(Movie.video_links))
        .filter(Movie.tmdb_id.in_(body.tmdb_ids))
        .filter(Movie.id.in_(movies_with_links))
        .all()
    )
    for movie in movies:
        for link in movie.video_links:
            if link.tg_chat_id:
                link.signed_url = get_signed_url(link.id)
    return movies


@router.get("/recent", response_model=List[MovieList])
def get_recent_movies(limit: int = 15, db: Session = Depends(get_db)):
    """Devuelve las últimas películas añadidas, ordenadas por la fecha de creación de su link."""
    from sqlalchemy import func

    sub = (
        db.query(VideoLink.movie_id, func.max(VideoLink.created_at).label("max_date"))
        .group_by(VideoLink.movie_id)
        .subquery()
    )
    movies = (
        db.query(Movie)
        .options(joinedload(Movie.video_links))
        .join(sub, Movie.id == sub.c.movie_id)
        .order_by(sub.c.max_date.desc())
        .limit(limit)
        .all()
    )
    for movie in movies:
        for link in movie.video_links:
            if link.tg_chat_id:
                link.signed_url = get_signed_url(link.id)
    return movies


@router.get("/classics", response_model=List[MovieList])
def get_classic_movies(limit: int = 15, db: Session = Depends(get_db)):
    """Devuelve las 'Joyas del Cine' (rating > 8.0, votos > 5000), que tengan link."""
    movies_with_links = (
        db.query(Movie.id).join(VideoLink, VideoLink.movie_id == Movie.id).subquery()
    )
    movies = (
        db.query(Movie)
        .options(joinedload(Movie.video_links))
        .filter(Movie.id.in_(movies_with_links))
        .filter(Movie.tmdb_rating >= 8.0)
        .filter(Movie.tmdb_vote_count >= 5000)
        .order_by(Movie.tmdb_rating.desc())
        .limit(limit)
        .all()
    )
    for movie in movies:
        for link in movie.video_links:
            if link.tg_chat_id:
                link.signed_url = get_signed_url(link.id)
    return movies


@router.get("/{movie_id}", response_model=MoviePublic)
def get_movie(movie_id: str, db: Session = Depends(get_db)):
    movie = (
        db.query(Movie)
        .options(joinedload(Movie.video_links))
        .filter(Movie.id == movie_id)
        .first()
    )
    if not movie:
        raise HTTPException(status_code=404, detail="Película no encontrada")
        
    # Lazy Hydration: Si falta la sinopsis (que viene nula por defecto del Fast Sync)
    if not movie.overview:
        hydrate_movie(movie, db)
        
    for link in movie.video_links:
        if link.tg_chat_id:
            link.signed_url = get_signed_url(link.id)
    return movie


@router.post("", response_model=MoviePublic, status_code=201)
def create_movie(
    body: MovieCreate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    if body.tmdb_id and db.query(Movie).filter(Movie.tmdb_id == body.tmdb_id).first():
        raise HTTPException(
            status_code=409, detail="Esta película ya existe (mismo TMDB ID)"
        )
    movie = Movie(**body.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@router.delete("/{movie_id}", status_code=204)
def delete_movie(
    movie_id: str, db: Session = Depends(get_db), _=Depends(require_admin)
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    db.delete(movie)
    db.commit()


@router.post("/{movie_id}/links", response_model=VideoLinkPublic, status_code=201)
def add_movie_link(
    movie_id: str,
    body: VideoLinkCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Añade un link de streaming a la película.
    Permite múltiples links por película (diferentes calidades/servidores).
    Si la URL es del Bot, vincula el VideoLink existente (con metadatos Telegram).
    """
    if not db.query(Movie).filter(Movie.id == movie_id).first():
        raise HTTPException(status_code=404, detail="Película no encontrada")
    link = _resolve_link(
        db, body.stream_url, movie_id, body.quality, body.language, body.title
    )
    if link.tg_chat_id:
        link.signed_url = get_signed_url(link.id)
    return link


@router.patch("/{movie_id}/links/{link_id}", response_model=VideoLinkPublic)
def update_movie_link(
    movie_id: str,
    link_id: str,
    body: VideoLinkUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Actualiza un link existente.
    Si se proporciona una nueva stream_url del Bot, reemplaza el VideoLink
    (borra el actual y vincula el nuevo con metadatos Telegram).
    """
    current = (
        db.query(VideoLink)
        .filter(VideoLink.id == link_id, VideoLink.movie_id == movie_id)
        .first()
    )
    if not current:
        raise HTTPException(status_code=404, detail="Enlace no encontrado")

    if body.stream_url and body.stream_url != current.stream_url:
        # Reemplazar con el nuevo VideoLink del Bot: borrar el actual, vincular el nuevo
        db.delete(current)
        db.flush()
        link = _resolve_link(
            db, body.stream_url, movie_id, body.quality, body.language, body.title
        )
    else:
        # Solo actualizar metadatos (quality, language, title)
        update_data = body.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(current, key, value)
        db.commit()
        db.refresh(current)
        link = current

    if link.tg_chat_id:
        link.signed_url = get_signed_url(link.id)
    return link


@router.delete("/{movie_id}/links/{link_id}", status_code=204)
def delete_movie_link(
    movie_id: str, link_id: str, db: Session = Depends(get_db), _=Depends(require_admin)
):
    link = (
        db.query(VideoLink)
        .filter(VideoLink.id == link_id, VideoLink.movie_id == movie_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Enlace no encontrado")
    db.delete(link)
    db.commit()


@router.get("/missing-links", response_model=List[MovieList])
def movies_missing_links(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Devuelve películas que no tienen VideoLink — están en la BD pero sin embed de Vimeus ni enlace de Telegram.
    Útil para saber qué películas hay que subir a Telegram manualmente.
    """
    movies_with_links = (
        db.query(Movie.id).join(VideoLink, VideoLink.movie_id == Movie.id).subquery()
    )
    movies = (
        db.query(Movie)
        .filter(Movie.id.notin_(movies_with_links))
        .order_by(Movie.title)
        .all()
    )
    return movies
