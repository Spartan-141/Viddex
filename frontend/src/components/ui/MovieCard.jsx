import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Plus, Check, Star, MoreVertical } from 'lucide-react'
import { tmdbImage } from '@/lib/tmdb'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

/**
 * MovieCard — Tarjeta de película/serie premium (estilo referencia)
 * Layout: [Poster con badges] + [Info debajo]
 */
export default function MovieCard({ item, type = 'movie' }) {
  const [hovered, setHovered]             = useState(false)
  const [inWatchlist, setInWatchlist]     = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const { user } = useAuth()

  if (!item) return null

  // ── Normalización de campos ──────────────────────────────
  const id          = item.id
  const title       = item.title || item.name || item.original_title || item.original_name || ''
  const origTitle   = item.original_title || item.original_name || ''
  const posterPath  = item.poster_path
  const rating      = parseFloat(item.tmdb_rating || item.vote_average || 0).toFixed(1)
  const date        = item.release_date || item.first_air_date || ''
  const year        = date ? new Date(date).getFullYear() : ''
  const lang        = (item.original_language || '').toUpperCase()
  const quality     = item.quality || 'HD'
  const contentType = item.content_type || (item.media_type === 'tv' ? 'series' : 'movie') || type

  const isBackendItem = isNaN(id) && String(id).length > 10
  const watchPath     = contentType === 'movie'
    ? `/ver/pelicula/${id}`
    : `/ver/episodio/${item.first_episode_id || id}`
  const poster        = tmdbImage(posterPath, 'w342')

  // ── Watchlist ────────────────────────────────────────────
  useEffect(() => {
    if (user && isBackendItem) checkWatchlist()
  }, [user, id])

  async function checkWatchlist() {
    try {
      const list  = await api.watchlist.list()
      const found = list.find(w =>
        contentType === 'movie' ? w.movie_id === id : w.series_id === id
      )
      setInWatchlist(!!found)
    } catch {}
  }

  async function toggleWatchlist(e) {
    e.preventDefault(); e.stopPropagation()
    if (!user) return
    setWatchlistLoading(true)
    try {
      if (inWatchlist) {
        const list  = await api.watchlist.list()
        const found = list.find(w =>
          contentType === 'movie' ? w.movie_id === id : w.series_id === id
        )
        if (found) { await api.watchlist.remove(found.id); setInWatchlist(false) }
      } else {
        await api.watchlist.add({ [contentType === 'movie' ? 'movie_id' : 'series_id']: id })
        setInWatchlist(true)
      }
    } catch {}
    finally { setWatchlistLoading(false) }
  }

  // ── Rating color ─────────────────────────────────────────
  const ratingNum  = parseFloat(rating)
  const ratingColor = ratingNum >= 7 ? '#4ade80' : ratingNum >= 5 ? '#fbbf24' : '#f87171'

  return (
    <div className="mc-root">
      {/* ── Poster + Badges ── */}
      <Link
        to={watchPath}
        className={`mc-poster-wrap ${hovered ? 'mc-hovered' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        tabIndex={0}
      >
        {/* Poster image */}
        <img
          src={poster}
          alt={title}
          className="mc-img"
          loading="lazy"
        />

        {/* Hover overlay con play */}
        <div className={`mc-hover-overlay ${hovered ? 'mc-overlay-visible' : ''}`}>
          <div className="mc-play-btn">
            <Play size={22} fill="white" color="white" />
          </div>
        </div>

        {/* Badge: Quality (top-left) */}
        <div className="mc-badge mc-badge-quality">{quality}</div>

        {/* Badge: Language (top-right) */}
        {lang && lang !== 'ES' && (
          <div className="mc-badge mc-badge-lang">{lang === 'EN' ? 'ENG' : lang}</div>
        )}

        {/* Bottom info bar (rating + year) */}
        <div className="mc-bottom-bar">
          <div className="mc-rating" style={{ color: ratingColor }}>
            <Star size={10} fill={ratingColor} color={ratingColor} />
            <span className="mc-rating-label">TMDB</span>
            <span className="mc-rating-value">{rating}</span>
          </div>
          {year && <span className="mc-year">{year}</span>}
        </div>

        {/* Watchlist button (top-right corner, solo backend items) */}
        {isBackendItem && (
          <button
            className={`mc-wl-btn ${inWatchlist ? 'mc-wl-active' : ''}`}
            onClick={toggleWatchlist}
            disabled={watchlistLoading}
            aria-label={inWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'}
          >
            {watchlistLoading
              ? <div className="mc-spinner" />
              : inWatchlist ? <Check size={13} /> : <Plus size={13} />
            }
          </button>
        )}
      </Link>

      {/* ── Info debajo del poster ── */}
      <div className="mc-info">
        <div className="mc-info-left">
          <p className="mc-title">{title}{year ? ` (${year})` : ''}</p>
          {origTitle && origTitle !== title && (
            <p className="mc-orig-title">{origTitle}</p>
          )}
        </div>
        <button className="mc-more-btn" aria-label="Más opciones">
          <MoreVertical size={14} />
        </button>
      </div>

      <style>{`
        .mc-root {
          display: flex;
          flex-direction: column;
          width: 100%;
          flex-shrink: 0;
        }

        /* ── POSTER ── */
        .mc-poster-wrap {
          display: block;
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 10px;
          overflow: hidden;
          background: #111827;
          text-decoration: none;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.35s ease;
          will-change: transform;
        }
        .mc-hovered {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 20px 40px rgba(0,0,0,0.65), 0 0 0 2px rgba(37,99,235,0.35);
          z-index: 10;
        }
        .mc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: filter 0.3s ease;
        }
        .mc-hovered .mc-img {
          filter: brightness(0.55);
        }

        /* Hover play overlay */
        .mc-hover-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .mc-overlay-visible {
          opacity: 1;
          pointer-events: auto;
        }
        .mc-play-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(37,99,235,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37,99,235,0.55);
          backdrop-filter: blur(6px);
          transition: transform 0.2s ease;
        }
        .mc-hovered .mc-play-btn {
          transform: scale(1.08);
        }

        /* ── BADGES ── */
        .mc-badge {
          position: absolute;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 3px 6px;
          border-radius: 5px;
          text-transform: uppercase;
          line-height: 1;
        }
        .mc-badge-quality {
          top: 8px;
          left: 8px;
          background: rgba(255,255,255,0.92);
          color: #0d1117;
        }
        .mc-badge-lang {
          top: 8px;
          right: 8px;
          background: rgba(37,99,235,0.85);
          color: #fff;
          backdrop-filter: blur(4px);
        }

        /* ── BOTTOM BAR ── */
        .mc-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%);
          padding: 20px 9px 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mc-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 700;
        }
        .mc-rating-label {
          color: rgba(255,255,255,0.55);
          font-size: 9.5px;
          font-weight: 600;
          margin-left: 1px;
        }
        .mc-rating-value {
          font-weight: 800;
          font-size: 11px;
        }
        .mc-year {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
        }

        /* ── WATCHLIST BUTTON ── */
        .mc-wl-btn {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          border: 1.5px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(6px);
          opacity: 0;
          transform: scale(0.8);
        }
        .mc-hovered .mc-wl-btn {
          opacity: 1;
          transform: scale(1);
        }
        .mc-wl-active {
          background: #22c55e !important;
          border-color: #22c55e !important;
          color: white !important;
        }
        .mc-spinner {
          width: 10px;
          height: 10px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: mc-spin 0.7s linear infinite;
        }
        @keyframes mc-spin {
          to { transform: rotate(360deg); }
        }

        /* ── INFO DEBAJO ── */
        .mc-info {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 8px 2px 4px;
          gap: 4px;
        }
        .mc-info-left {
          flex: 1;
          min-width: 0;
        }
        .mc-title {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.92);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
          margin: 0;
        }
        .mc-orig-title {
          font-size: 10.5px;
          font-weight: 400;
          color: rgba(255,255,255,0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 2px 0 0;
          line-height: 1.2;
        }
        .mc-more-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          border-radius: 4px;
          transition: color 0.2s;
        }
        .mc-more-btn:hover {
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.07);
        }
      `}</style>
    </div>
  )
}
