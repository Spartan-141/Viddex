# app/models.py
import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    BigInteger,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True)
    full_name = Column(String, default="")
    avatar_url = Column(String, default="")
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # 'user' | 'admin'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    watchlist = relationship(
        "WatchlistItem", back_populates="user", cascade="all, delete"
    )
    history = relationship("WatchHistory", back_populates="user", cascade="all, delete")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(String, primary_key=True, default=gen_uuid)
    tmdb_id = Column(Integer, unique=True)
    title = Column(String, nullable=False)
    original_title = Column(String)
    overview = Column(Text)
    tagline = Column(String)
    release_date = Column(String)  # Guardamos como string YYYY-MM-DD
    runtime = Column(Integer)
    poster_path = Column(String)
    backdrop_path = Column(String)
    tmdb_rating = Column(Float)
    tmdb_vote_count = Column(Integer)
    original_language = Column(String)
    status = Column(String, default="published")
    quality = Column(String, default="HD")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    video_links = relationship(
        "VideoLink", back_populates="movie", cascade="all, delete"
    )
    watchlist = relationship(
        "WatchlistItem", back_populates="movie", cascade="all, delete"
    )


class Series(Base):
    __tablename__ = "series"

    id = Column(String, primary_key=True, default=gen_uuid)
    tmdb_id = Column(Integer, unique=True)
    title = Column(String, nullable=False)
    original_title = Column(String)
    overview = Column(Text)
    tagline = Column(String)
    first_air_date = Column(String)
    poster_path = Column(String)
    backdrop_path = Column(String)
    tmdb_rating = Column(Float)
    tmdb_vote_count = Column(Integer)
    original_language = Column(String)
    status = Column(String, default="published")
    content_type = Column(String, default="series")  # 'series' | 'anime'
    total_seasons = Column(Integer)
    total_episodes = Column(Integer)
    vimeus_links_last_sync = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seasons = relationship(
        "Season",
        back_populates="series",
        cascade="all, delete",
        order_by="Season.season_number",
    )
    watchlist = relationship(
        "WatchlistItem", back_populates="series", cascade="all, delete"
    )


class Season(Base):
    __tablename__ = "seasons"

    id = Column(String, primary_key=True, default=gen_uuid)
    series_id = Column(
        String, ForeignKey("series.id", ondelete="CASCADE"), nullable=False
    )
    season_number = Column(Integer, nullable=False)
    name = Column(String)
    overview = Column(Text)
    poster_path = Column(String)
    air_date = Column(String)
    episode_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("series_id", "season_number"),)

    series = relationship("Series", back_populates="seasons")
    episodes = relationship(
        "Episode",
        back_populates="season",
        cascade="all, delete",
        order_by="Episode.episode_number",
    )


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(String, primary_key=True, default=gen_uuid)
    series_id = Column(
        String, ForeignKey("series.id", ondelete="CASCADE"), nullable=False
    )
    season_id = Column(
        String, ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False
    )
    episode_number = Column(Integer, nullable=False)
    name = Column(String)
    overview = Column(Text)
    still_path = Column(String)
    air_date = Column(String)
    runtime = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("season_id", "episode_number"),)

    season = relationship("Season", back_populates="episodes")
    video_links = relationship(
        "VideoLink", back_populates="episode", cascade="all, delete"
    )


class VideoLink(Base):
    __tablename__ = "video_links"

    id = Column(String, primary_key=True, default=gen_uuid)
    movie_id = Column(
        String, ForeignKey("movies.id", ondelete="CASCADE"), nullable=True
    )
    episode_id = Column(
        String, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True
    )

    # URL de fallback (opcional)
    stream_url = Column(Text, nullable=True)

    # Metadatos de Telegram para persistencia Netflix-like
    tg_chat_id = Column(BigInteger, nullable=True)
    tg_message_id = Column(Integer, nullable=True)
    tg_access_hash = Column(String, nullable=True)
    tg_file_size = Column(BigInteger, nullable=True)
    tg_mime_type = Column(String, nullable=True)
    tg_duration = Column(Integer, nullable=True)
    tg_width = Column(Integer, nullable=True)
    tg_height = Column(Integer, nullable=True)

    quality = Column(String, default="HD")
    language = Column(String, default="LAT")
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    movie = relationship("Movie", back_populates="video_links")
    episode = relationship("Episode", back_populates="video_links")


class WatchlistItem(Base):
    __tablename__ = "watchlist"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id = Column(
        String, ForeignKey("movies.id", ondelete="CASCADE"), nullable=True
    )
    series_id = Column(
        String, ForeignKey("series.id", ondelete="CASCADE"), nullable=True
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="watchlist")
    movie = relationship("Movie", back_populates="watchlist")
    series = relationship("Series", back_populates="watchlist")


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id = Column(
        String, ForeignKey("movies.id", ondelete="CASCADE"), nullable=True
    )
    episode_id = Column(
        String, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True
    )
    progress = Column(Integer, default=0)  # segundos
    last_watched = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="history")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    movie_id = Column(
        String, ForeignKey("movies.id", ondelete="CASCADE"), nullable=True
    )
    episode_id = Column(
        String, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True
    )
    issue_type = Column(String, nullable=False)  # 'link_broken', 'audio_issue', 'other'
    description = Column(Text)
    status = Column(String, default="pending")  # 'pending' | 'resolved'
    created_at = Column(DateTime, default=datetime.utcnow)
