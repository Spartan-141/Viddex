# app/routers/seasons.py
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Season, Episode, Series
from ..schemas import (
    SeasonCreate,
    SeasonPublic,
    EpisodeCreate,
    EpisodePublic,
    VideoLinkCreate,
    VideoLinkPublic,
    VideoLinkUpdate,
)
from ..models import VideoLink
from ..auth import require_admin

router = APIRouter(tags=["Seasons & Episodes"])

_UUID_RE = re.compile(
    r"/stream/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"
)


def _resolve_link_episode(
    db: Session,
    stream_url: str,
    episode_id: str,
    quality: str,
    language: str,
    title: Optional[str],
) -> VideoLink:
    """Mismo patrón que movies: vincula el VideoLink del Bot al episodio sin borrar otros links."""
    m = _UUID_RE.search(stream_url or "")
    if m:
        vid_id = m.group(1)
        bot_link = db.query(VideoLink).filter(VideoLink.id == vid_id).first()
        if bot_link:
            bot_link.episode_id = episode_id
            bot_link.quality = quality or bot_link.quality or "HD"
            bot_link.language = language or bot_link.language or "LAT"
            if title:
                bot_link.title = title
            db.commit()
            db.refresh(bot_link)
            return bot_link

    link = VideoLink(
        episode_id=episode_id,
        stream_url=stream_url,
        quality=quality or "HD",
        language=language or "LAT",
        title=title,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


# ─── SEASONS ───────────────────────────────────


@router.get("/series/{series_id}/seasons", response_model=List[SeasonPublic])
def list_seasons(series_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Season)
        .options(joinedload(Season.episodes).joinedload(Episode.video_links))
        .filter(Season.series_id == series_id)
        .order_by(Season.season_number)
        .all()
    )


@router.post("/seasons", response_model=SeasonPublic, status_code=201)
def create_season(
    body: SeasonCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if not db.query(Series).filter(Series.id == body.series_id).first():
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    existing = (
        db.query(Season)
        .filter(
            Season.series_id == body.series_id,
            Season.season_number == body.season_number,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail=f"La Temporada {body.season_number} ya existe"
        )

    name = body.name or f"Temporada {body.season_number}"
    season = Season(**{**body.model_dump(), "name": name})
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


@router.delete("/seasons/{season_id}", status_code=204)
def delete_season(
    season_id: str, db: Session = Depends(get_db), _=Depends(require_admin)
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Temporada no encontrada")
    db.delete(season)
    db.commit()


# ─── EPISODES ───────────────────────────────────


@router.post("/episodes", response_model=EpisodePublic, status_code=201)
def create_episode(
    body: EpisodeCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    existing = (
        db.query(Episode)
        .filter(
            Episode.season_id == body.season_id,
            Episode.episode_number == body.episode_number,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"El Episodio {body.episode_number} ya existe en esta temporada",
        )

    name = body.name or f"Episodio {body.episode_number}"
    episode = Episode(**{**body.model_dump(), "name": name})
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode


@router.delete("/episodes/{episode_id}", status_code=204)
def delete_episode(
    episode_id: str, db: Session = Depends(get_db), _=Depends(require_admin)
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episodio no encontrado")
    db.delete(ep)
    db.commit()


@router.post(
    "/episodes/{episode_id}/links", response_model=VideoLinkPublic, status_code=201
)
def add_episode_link(
    episode_id: str,
    body: VideoLinkCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episodio no encontrado")
    link = _resolve_link_episode(
        db, body.stream_url, episode_id, body.quality, body.language, body.title
    )
    return link


@router.patch("/links/{link_id}", response_model=VideoLinkPublic)
def update_link(
    link_id: str,
    body: VideoLinkUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    current = db.query(VideoLink).filter(VideoLink.id == link_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Enlace no encontrado")

    if body.stream_url and body.stream_url != current.stream_url:
        ep_id = current.episode_id
        db.delete(current)
        db.flush()
        link = _resolve_link_episode(
            db, body.stream_url, ep_id, body.quality, body.language, body.title
        )
    else:
        update_data = body.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(current, key, value)
        db.commit()
        db.refresh(current)
        link = current

    return link


@router.delete("/links/{link_id}", status_code=204)
def delete_link(link_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    link = db.query(VideoLink).filter(VideoLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Enlace no encontrado")
    db.delete(link)
    db.commit()
