-- =============================================================
--  VIDDEX — Vistas Útiles para el Frontend
--  Ejecutar DESPUÉS de schema.sql e indexes.sql
-- =============================================================

-- =============================================================
-- VISTA: movies_with_genres
--    Película con sus géneros como array de textos
-- =============================================================
CREATE OR REPLACE VIEW public.movies_with_genres AS
SELECT
  m.*,
  COALESCE(
    array_agg(g.name ORDER BY g.name) FILTER (WHERE g.id IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS genres
FROM public.movies m
LEFT JOIN public.movie_genres mg ON mg.movie_id = m.id
LEFT JOIN public.genres g ON g.id = mg.genre_id
WHERE m.status = 'published'
GROUP BY m.id;

-- =============================================================
-- VISTA: series_with_genres
-- =============================================================
CREATE OR REPLACE VIEW public.series_with_genres AS
SELECT
  s.*,
  COALESCE(
    array_agg(g.name ORDER BY g.name) FILTER (WHERE g.id IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS genres
FROM public.series s
LEFT JOIN public.series_genres sg ON sg.series_id = s.id
LEFT JOIN public.genres g ON g.id = sg.genre_id
WHERE s.status = 'published'
GROUP BY s.id;

-- =============================================================
-- VISTA: episodes_with_links
--    Episodio con todos sus video_links disponibles
-- =============================================================
CREATE OR REPLACE VIEW public.episodes_with_links AS
SELECT
  e.*,
  s.season_number,
  sr.title AS series_title,
  COALESCE(
    json_agg(
      json_build_object(
        'id',        vl.id,
        'language',  vl.language,
        'quality',   vl.quality,
        'stream_url', vl.stream_url
      ) ORDER BY vl.quality DESC, vl.language
    ) FILTER (WHERE vl.id IS NOT NULL AND vl.is_active = TRUE),
    '[]'::json
  ) AS video_links
FROM public.episodes e
JOIN public.seasons s ON s.id = e.season_id
JOIN public.series sr ON sr.id = e.series_id
LEFT JOIN public.video_links vl ON vl.episode_id = e.id
GROUP BY e.id, s.season_number, sr.title;

-- =============================================================
-- VISTA: movies_with_links
--    Película con todos sus video_links disponibles
-- =============================================================
CREATE OR REPLACE VIEW public.movies_with_links AS
SELECT
  m.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id',        vl.id,
        'language',  vl.language,
        'quality',   vl.quality,
        'stream_url', vl.stream_url
      ) ORDER BY vl.quality DESC, vl.language
    ) FILTER (WHERE vl.id IS NOT NULL AND vl.is_active = TRUE),
    '[]'::json
  ) AS video_links,
  COALESCE(
    array_agg(g.name ORDER BY g.name) FILTER (WHERE g.id IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS genres
FROM public.movies m
LEFT JOIN public.video_links vl ON vl.movie_id = m.id
LEFT JOIN public.movie_genres mg ON mg.movie_id = m.id
LEFT JOIN public.genres g ON g.id = mg.genre_id
WHERE m.status = 'published'
GROUP BY m.id;

-- =============================================================
-- VISTA: admin_reports_view
--    Panel de administrador: reportes con contexto completo
-- =============================================================
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT
  r.id,
  r.reason,
  r.description,
  r.status,
  r.created_at,
  r.resolved_at,
  p.username    AS reporter_username,
  vl.stream_url AS reported_url,
  vl.language   AS link_language,
  vl.quality    AS link_quality,
  m.title       AS movie_title,
  e.name        AS episode_name,
  s.season_number,
  sr.title      AS series_title
FROM public.reports r
LEFT JOIN public.profiles p ON p.id = r.user_id
LEFT JOIN public.video_links vl ON vl.id = r.video_link_id
LEFT JOIN public.movies m ON m.id = vl.movie_id
LEFT JOIN public.episodes e ON e.id = vl.episode_id
LEFT JOIN public.seasons s ON s.id = e.season_id
LEFT JOIN public.series sr ON sr.id = e.series_id;

-- =============================================================
-- VISTA: catalog_summary
--    Resumen del catálogo para el dashboard del admin
-- =============================================================
CREATE OR REPLACE VIEW public.catalog_summary AS
SELECT
  (SELECT COUNT(*) FROM public.movies WHERE status = 'published')  AS published_movies,
  (SELECT COUNT(*) FROM public.movies WHERE status = 'draft')       AS draft_movies,
  (SELECT COUNT(*) FROM public.series WHERE status = 'published')   AS published_series,
  (SELECT COUNT(*) FROM public.series WHERE content_type = 'anime' AND status = 'published') AS published_animes,
  (SELECT COUNT(*) FROM public.episodes)                             AS total_episodes,
  (SELECT COUNT(*) FROM public.video_links WHERE is_active = TRUE)  AS active_links,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'pending')    AS pending_reports,
  (SELECT COUNT(*) FROM public.profiles)                            AS total_users;
