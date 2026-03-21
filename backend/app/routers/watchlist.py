# app/routers/watchlist.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import WatchlistItem, Movie, Series
from ..schemas import WatchlistAdd, WatchlistItem as WatchlistItemSchema
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("", response_model=List[WatchlistItemSchema])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WatchlistItem)
        .options(
            joinedload(WatchlistItem.movie).joinedload(Movie.video_links),
            joinedload(WatchlistItem.series),
        )
        .filter(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.desc())
        .all()
    )


@router.post("", response_model=WatchlistItemSchema, status_code=201)
def add_to_watchlist(
    body: WatchlistAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.movie_id and not body.series_id:
        raise HTTPException(
            status_code=400, detail="Debes proporcionar movie_id o series_id"
        )

    existing = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.movie_id == body.movie_id,
            WatchlistItem.series_id == body.series_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ya está en tu lista")

    item = WatchlistItem(
        user_id=current_user.id, movie_id=body.movie_id, series_id=body.series_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def remove_from_watchlist(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.id == item_id, WatchlistItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=404, detail="Elemento no encontrado en tu lista"
        )
    db.delete(item)
    db.commit()
