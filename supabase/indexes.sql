-- =============================================================
--  VIDDEX — Índices para Optimización de Consultas
-- =============================================================

-- Búsqueda de texto en películas (título)
CREATE INDEX idx_movies_title_trgm ON public.movies USING gin (title gin_trgm_ops);
CREATE INDEX idx_movies_status      ON public.movies (status);
CREATE INDEX idx_movies_release     ON public.movies (release_date DESC);
CREATE INDEX idx_movies_featured    ON public.movies (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_movies_tmdb        ON public.movies (tmdb_id);
CREATE INDEX idx_movies_collection  ON public.movies (collection_id);

-- Búsqueda de texto en series
CREATE INDEX idx_series_title_trgm  ON public.series USING gin (title gin_trgm_ops);
CREATE INDEX idx_series_status      ON public.series (status);
CREATE INDEX idx_series_type        ON public.series (content_type);
CREATE INDEX idx_series_featured    ON public.series (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_series_tmdb        ON public.series (tmdb_id);

-- Temporadas
CREATE INDEX idx_seasons_series     ON public.seasons (series_id);

-- Episodios
CREATE INDEX idx_episodes_season    ON public.episodes (season_id);
CREATE INDEX idx_episodes_series    ON public.episodes (series_id);

-- Video links
CREATE INDEX idx_video_links_movie   ON public.video_links (movie_id) WHERE movie_id IS NOT NULL;
CREATE INDEX idx_video_links_episode ON public.video_links (episode_id) WHERE episode_id IS NOT NULL;
CREATE INDEX idx_video_links_active  ON public.video_links (is_active) WHERE is_active = TRUE;

-- Actores
CREATE INDEX idx_actors_name_trgm   ON public.actors USING gin (name gin_trgm_ops);
CREATE INDEX idx_actors_tmdb        ON public.actors (tmdb_id);

-- Relaciones N:M
CREATE INDEX idx_movie_genres_genre  ON public.movie_genres (genre_id);
CREATE INDEX idx_series_genres_genre ON public.series_genres (genre_id);
CREATE INDEX idx_movie_actors_actor  ON public.movie_actors (actor_id);
CREATE INDEX idx_series_actors_actor ON public.series_actors (actor_id);

-- Watchlist
CREATE INDEX idx_watchlist_user     ON public.watchlist (user_id);

-- Historial
CREATE INDEX idx_watch_history_user ON public.watch_history (user_id);
CREATE INDEX idx_watch_history_movie ON public.watch_history (movie_id) WHERE movie_id IS NOT NULL;

-- Reportes
CREATE INDEX idx_reports_status     ON public.reports (status);
CREATE INDEX idx_reports_link       ON public.reports (video_link_id);
