# app/schemas.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


class TmdbCheckRequest(BaseModel):
    tmdb_ids: List[int]


# ─── AUTH ──────────────────────────────────────────────────────────────


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = ""
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    username: Optional[str]
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    created_at: datetime
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── VIDEO LINKS ────────────────────────────────────────────────────────


class VideoLinkCreate(BaseModel):
    movie_id: Optional[str] = None
    episode_id: Optional[str] = None
    stream_url: str
    quality: Optional[str] = "HD"
    language: Optional[str] = "LAT"
    title: Optional[str] = None


class VideoLinkUpdate(BaseModel):
    stream_url: Optional[str] = None
    quality: Optional[str] = None
    language: Optional[str] = None
    title: Optional[str] = None


class VideoLinkPublic(BaseModel):
    id: str
    stream_url: Optional[str] = None
    signed_url: Optional[str] = None  # Generado dinámicamente
    quality: Optional[str]
    language: Optional[str]
    title: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── MOVIES ─────────────────────────────────────────────────────────────


class MovieCreate(BaseModel):
    tmdb_id: Optional[int] = None
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    tagline: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    tmdb_rating: Optional[float] = None
    tmdb_vote_count: Optional[int] = None
    original_language: Optional[str] = None
    status: Optional[str] = "published"
    quality: Optional[str] = "HD"


class MoviePublic(MovieCreate):
    id: str
    created_at: datetime
    video_links: List[VideoLinkPublic] = []
    model_config = {"from_attributes": True}


class MovieList(BaseModel):
    id: str
    title: str
    overview: Optional[str]
    poster_path: Optional[str]
    backdrop_path: Optional[str]
    tmdb_rating: Optional[float]
    release_date: Optional[str]
    quality: Optional[str]
    status: Optional[str]
    tmdb_id: Optional[int]
    created_at: datetime
    video_links: List[VideoLinkPublic] = []
    model_config = {"from_attributes": True}


# ─── SERIES ─────────────────────────────────────────────────────────────


class SeriesCreate(BaseModel):
    tmdb_id: Optional[int] = None
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    tagline: Optional[str] = None
    first_air_date: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    tmdb_rating: Optional[float] = None
    tmdb_vote_count: Optional[int] = None
    original_language: Optional[str] = None
    status: Optional[str] = "published"
    content_type: Optional[str] = "series"
    total_seasons: Optional[int] = None
    total_episodes: Optional[int] = None


# ─── SEASONS ─────────────────────────────────────────────────────────────


class SeasonCreate(BaseModel):
    series_id: str
    season_number: int
    name: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    air_date: Optional[str] = None


class EpisodePublic(BaseModel):
    id: str
    episode_number: int
    name: Optional[str]
    overview: Optional[str]
    still_path: Optional[str]
    runtime: Optional[int]
    video_links: List[VideoLinkPublic] = []
    model_config = {"from_attributes": True}


class SeasonPublic(BaseModel):
    id: str
    season_number: int
    name: Optional[str]
    overview: Optional[str]
    poster_path: Optional[str]
    episodes: List[EpisodePublic] = []
    model_config = {"from_attributes": True}


class SeriesPublic(SeriesCreate):
    id: str
    created_at: datetime
    seasons: List[SeasonPublic] = []
    model_config = {"from_attributes": True}


class SeriesList(BaseModel):
    id: str
    title: str
    overview: Optional[str]
    poster_path: Optional[str]
    backdrop_path: Optional[str]
    tmdb_rating: Optional[float]
    first_air_date: Optional[str]
    status: Optional[str]
    content_type: Optional[str]
    tmdb_id: Optional[int]
    total_seasons: Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── EPISODES ─────────────────────────────────────────────────────────────


class EpisodeCreate(BaseModel):
    series_id: str
    season_id: str
    episode_number: int
    name: Optional[str] = None
    overview: Optional[str] = None
    still_path: Optional[str] = None
    air_date: Optional[str] = None
    runtime: Optional[int] = None


# ─── WATCHLIST ────────────────────────────────────────────────────────────


class WatchlistAdd(BaseModel):
    movie_id: Optional[str] = None
    series_id: Optional[str] = None


class WatchlistItem(BaseModel):
    id: str
    movie_id: Optional[str]
    series_id: Optional[str]
    created_at: datetime
    movie: Optional[MovieList] = None
    series: Optional[SeriesList] = None
    model_config = {"from_attributes": True}


# ─── ADMIN STATS ────────────────────────────────────────────────────────


class AdminStats(BaseModel):
    total_movies: int
    total_series: int
    total_episodes: int
    total_users: int
    pending_reports: int
