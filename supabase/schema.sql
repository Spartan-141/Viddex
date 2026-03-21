-- =============================================================
-- VIDDEX — ESQUEMA DE BASE DE DATOS (v2.0)
-- =============================================================

-- 1. TABLA: profiles (Perfiles de usuario)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user', -- 'user' o 'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: movies (Catálogo de películas)
CREATE TABLE public.movies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id           INTEGER UNIQUE,
  title             TEXT NOT NULL,
  original_title    TEXT,
  overview          TEXT,
  tagline           TEXT,
  release_date      DATE,
  runtime           INTEGER,
  poster_path       TEXT,
  backdrop_path     TEXT,
  tmdb_rating       NUMERIC(3,1),
  tmdb_vote_count   INTEGER,
  original_language TEXT,
  status            TEXT DEFAULT 'published', -- 'published', 'draft'
  quality           TEXT DEFAULT 'HD',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: series (Catálogo de series y animes)
CREATE TABLE public.series (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id           INTEGER UNIQUE,
  title             TEXT NOT NULL,
  original_title    TEXT,
  overview          TEXT,
  tagline           TEXT,
  first_air_date    DATE,
  poster_path       TEXT,
  backdrop_path     TEXT,
  tmdb_rating       NUMERIC(3,1),
  tmdb_vote_count   INTEGER,
  original_language TEXT,
  status            TEXT DEFAULT 'published',
  content_type      TEXT DEFAULT 'series', -- 'series', 'anime'
  total_seasons     INTEGER,
  total_episodes    INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: seasons (Temporadas de una serie)
CREATE TABLE public.seasons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id       UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_number   INTEGER NOT NULL,
  name            TEXT,
  overview        TEXT,
  poster_path     TEXT,
  air_date        DATE,
  episode_count   INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (series_id, season_number)
);

-- 5. TABLA: episodes (Episodios de una temporada)
CREATE TABLE public.episodes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id       UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_number  INTEGER NOT NULL,
  name            TEXT,
  overview        TEXT,
  still_path      TEXT,
  air_date        DATE,
  runtime         INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (season_id, episode_number)
);

-- 6. TABLA: video_links (Enlaces de reproducción)
CREATE TABLE public.video_links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id    UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  episode_id  UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  stream_url  TEXT NOT NULL,
  quality     TEXT DEFAULT 'HD',
  language    TEXT DEFAULT 'LAT', -- 'LAT', 'ESP', 'SUB', 'ENG'
  title       TEXT, -- Opcional: etiqueta del servidor
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Asegurar que el link pertenezca a una película O a un episodio, no ambos ni ninguno
  CONSTRAINT link_target CHECK (
    (movie_id IS NOT NULL AND episode_id IS NULL) OR
    (movie_id IS NULL AND episode_id IS NOT NULL)
  )
);

-- 7. TABLA: watchlist (Mis favoritos)
CREATE TABLE public.watchlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id    UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  series_id   UUID REFERENCES public.series(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id, series_id),
  CONSTRAINT watchlist_target CHECK (
    (movie_id IS NOT NULL AND series_id IS NULL) OR
    (movie_id IS NULL AND series_id IS NOT NULL)
  )
);

-- 8. TABLA: watch_history (Historial de reproducción)
CREATE TABLE public.watch_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id        UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  episode_id      UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  progress        INTEGER DEFAULT 0, --segundos
  last_watched    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT history_target CHECK (
    (movie_id IS NOT NULL AND episode_id IS NULL) OR
    (movie_id IS NULL AND episode_id IS NOT NULL)
  )
);

-- 9. TABLA: reports (Reportes de errores)
CREATE TABLE public.reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  movie_id      UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  episode_id    UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  issue_type    TEXT NOT NULL, -- 'link_broken', 'audio_issue', 'other'
  description   TEXT,
  status        TEXT DEFAULT 'pending', -- 'pending', 'resolved'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
