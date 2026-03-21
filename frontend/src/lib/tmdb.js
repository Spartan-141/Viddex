const TMDB_BASE = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3'
const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY  || ''
const IMG_BASE  = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p'

/**
 * Construye una URL de imagen de TMDB.
 * @param {string} path  - Ruta relativa (ej: /abc123.jpg)
 * @param {'w200'|'w300'|'w500'|'w780'|'original'} size
 */
export const tmdbImage = (path, size = 'w500') => {
  if (!path) return '/placeholder-poster.jpg'
  return `${IMG_BASE}/${size}${path}`
}

/**
 * Fetch genérico a la API de TMDB con error handling.
 */
async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', TMDB_KEY)
  url.searchParams.set('language', 'es-MX')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${res.statusText}`)
  return res.json()
}

/** Busca en TMDB por query y tipo */
export const tmdbSearch = (query, type = 'multi') =>
  tmdbFetch('/search/' + type, { query })

/** Detalles de una película por ID */
export const tmdbMovieDetails = (id) =>
  tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,images' })

/** Detalles de una serie por ID */
export const tmdbTVDetails = (id) =>
  tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,aggregate_credits' })

/** Descubrir contenido por parámetros */
export const tmdbDiscover = (type = 'movie', params = {}) =>
  tmdbFetch(`/discover/${type}`, { 
    include_adult: false, 
    sort_by: 'popularity.desc',
    ...params 
  })

/** Lista de géneros */
export const tmdbGenres = async (type = 'movie') => {
  const data = await tmdbFetch(`/genre/${type}/list`)
  return data.genres // [{id, name}, ...]
}

/** Tendencias del día */
export const tmdbTrending = (type = 'all', window = 'week') =>
  tmdbFetch(`/trending/${type}/${window}`)
