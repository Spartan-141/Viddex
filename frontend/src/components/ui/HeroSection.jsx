import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play, Star, ChevronRight, TrendingUp } from 'lucide-react'
import { tmdbImage } from '@/lib/tmdb'

/* ─────────────────────────────────────────────
   GENRE MAP (TMDB IDs → Español)
───────────────────────────────────────────── */
const GENRE_MAP = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
  10770: 'Película de TV', 53: 'Suspense', 10752: 'Bélica',
  37: 'Western', 10759: 'Acción y Aventura', 10762: 'Infantil',
  10763: 'Noticias', 10764: 'Reality', 10765: 'Ciencia Ficción',
  10766: 'Soap', 10767: 'Talk', 10768: 'Política',
}

/* ─────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────── */
export default function HeroSection({ items = [], type = 'movie' }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [entering, setEntering] = useState(true)

  const validItems = Array.isArray(items) && items.length > 0 ? items : []

  const goTo = useCallback((idx) => {
    setEntering(false)
    setTimeout(() => {
      setActiveIdx(idx)
      setEntering(true)
    }, 280)
  }, [])

  useEffect(() => {
    if (validItems.length <= 1) return
    const id = setInterval(() => {
      goTo((prev) => (prev + 1) % validItems.length)
    }, 9000)
    return () => clearInterval(id)
  }, [validItems.length, goTo])

  if (validItems.length === 0) return <HeroSkeleton />

  const item      = validItems[activeIdx]
  const title     = item.title || item.name || item.original_title || 'Sin título'
  const year      = (item.release_date || item.first_air_date || '').slice(0, 4)
  const rating    = parseFloat(item.tmdb_rating || item.vote_average || 0).toFixed(1)
  const backdrop  = tmdbImage(item.backdrop_path, 'original')
  const overview  = item.overview || 'Un viaje épico a través de las fronteras de la realidad y el tiempo.'
  const genres    = (item.genre_ids || []).slice(0, 4).map(id => GENRE_MAP[id]).filter(Boolean)
  const contentType = item.content_type || (item.media_type === 'tv' ? 'series' : 'movie') || type
  const watchUrl  = contentType === 'movie'
    ? `/ver/pelicula/${item.id}`
    : `/ver/episodio/${item.first_episode_id || item.id}`

  /* Grid de miniaturas: los 9 elementos siguientes al activo */
  const gridItems = []
  for (let i = 1; i <= 9; i++) {
    gridItems.push(validItems[(activeIdx + i) % validItems.length])
  }

  return (
    <section className="hero-root">
      {/* ── Fondo con backdrop ── */}
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${backdrop})` }}
        key={activeIdx}
      />
      {/* Gradientes */}
      <div className="hero-grad-left" />
      <div className="hero-grad-bottom" />
      <div className="hero-overlay" />

      {/* ── Contenido ── */}
      <div className="hero-inner">

        {/* ── LEFT: Info + botones ── */}
        <div className={`hero-left ${entering ? 'hero-enter' : 'hero-exit'}`}>

          {/* Badge tendencias */}
          <div className="hero-badge">
            <TrendingUp size={12} />
            <span>Tendencia #{activeIdx + 1}</span>
          </div>

          {/* Título */}
          <h1 className="hero-title">
            {title}
            {year && <span className="hero-year"> ({year})</span>}
          </h1>

          {/* Descripción */}
          <p className="hero-overview">{overview}</p>

          {/* Géneros + Rating */}
          <div className="hero-meta">
            <div className="hero-genres">
              {genres.length > 0
                ? genres.map((g, i) => (
                    <span key={i} className="hero-genre-item">
                      {i > 0 && <span className="hero-genre-dot" />}
                      {g}
                    </span>
                  ))
                : ['Drama', 'Acción', 'Suspense'].map((g, i) => (
                    <span key={i} className="hero-genre-item">
                      {i > 0 && <span className="hero-genre-dot" />}
                      {g}
                    </span>
                  ))}
            </div>
            <div className="hero-rating-badge">
              <span className="hero-rating-label">TMDB</span>
              <Star size={11} fill="#fbbf24" color="#fbbf24" />
              <span className="hero-rating-value">{rating}</span>
            </div>
          </div>

          {/* Botones CTA */}
          <div className="hero-cta">
            <Link to={watchUrl} className="hero-btn-primary">
              <Play size={17} fill="white" />
              Ver ahora
            </Link>
            <Link to={`/peliculas`} className="hero-btn-secondary">
              Ver más
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Indicadores */}
          {validItems.length > 1 && (
            <div className="hero-dots">
              {validItems.slice(0, 10).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`hero-dot ${i === activeIdx ? 'hero-dot-active' : ''}`}
                  aria-label={`Ir al ítem ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Cuadrícula 3×3 ── */}
        <div className="hero-right">
          <div className="hero-grid">
            {gridItems.slice(0, 9).map((thumb, idx) => (
              <ThumbCard
                key={`${thumb?.id}-${idx}`}
                item={thumb}
                isFirst={idx === 0}
                onClick={() => {
                  const realIdx = validItems.findIndex(v => v.id === thumb?.id)
                  if (realIdx !== -1) goTo(realIdx)
                }}
              />
            ))}
          </div>
        </div>

      </div>

      {/* ── Barra de progreso ── */}
      <div className="hero-progress-track">
        <div className="hero-progress-bar" key={`prog-${activeIdx}`} />
      </div>

      <style>{`
        /* ── ROOT ── */
        .hero-root {
          position: relative;
          width: 100%;
          min-height: 88vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        /* ── BACKGROUND ── */
        .hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center 20%;
          z-index: 0;
          animation: hero-bg-fade 0.6s ease;
        }
        @keyframes hero-bg-fade {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── GRADIENTS ── */
        .hero-grad-left {
          position: absolute; inset: 0;
          background: linear-gradient(
            to right,
            #090d1a 0%,
            rgba(9,13,26,0.92) 30%,
            rgba(9,13,26,0.65) 55%,
            rgba(9,13,26,0.15) 80%,
            transparent 100%
          );
          z-index: 1;
        }
        .hero-grad-bottom {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            #090d1a 0%,
            rgba(9,13,26,0.7) 20%,
            transparent 50%
          );
          z-index: 1;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: rgba(9,13,26,0.12);
          z-index: 1;
        }

        /* ── INNER LAYOUT ── */
        .hero-inner {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1700px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 80px 5% 60px;
          gap: 40px;
        }

        /* ── LEFT ── */
        .hero-left {
          flex: 0 0 auto;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .hero-enter {
          animation: hero-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .hero-exit {
          animation: hero-exit 0.28s ease forwards;
        }
        @keyframes hero-enter {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-exit {
          to { opacity: 0; transform: translateY(-10px); }
        }

        /* Badge */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(37,99,235,0.18);
          border: 1px solid rgba(37,99,235,0.4);
          color: #93c5fd;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          width: fit-content;
          backdrop-filter: blur(8px);
        }

        /* Title */
        .hero-title {
          font-size: clamp(2rem, 4vw, 3.6rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -1.5px;
          color: #ffffff;
          text-shadow: 0 4px 30px rgba(0,0,0,0.7);
        }
        .hero-year {
          color: rgba(255,255,255,0.4);
          font-weight: 700;
          font-size: 0.55em;
          letter-spacing: 0;
        }

        /* Overview */
        .hero-overview {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255,255,255,0.72);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);
        }

        /* Meta (genres + rating) */
        .hero-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
        }
        .hero-genres {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
        }
        .hero-genre-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hero-genre-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          display: inline-block;
        }
        .hero-rating-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          padding: 5px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 800;
          color: #ffffff;
          flex-shrink: 0;
        }
        .hero-rating-label {
          color: rgba(255,255,255,0.55);
          font-weight: 600;
          margin-right: 2px;
        }
        .hero-rating-value { color: #fbbf24; }

        /* CTA */
        .hero-cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #2563eb;
          color: #ffffff;
          text-decoration: none;
          padding: 13px 26px;
          border-radius: 11px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.3px;
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 6px 24px rgba(37,99,235,0.45);
        }
        .hero-btn-primary:hover {
          background: #1d4ed8;
          box-shadow: 0 8px 30px rgba(37,99,235,0.6);
          transform: translateY(-2px);
        }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          padding: 13px 22px;
          border-radius: 11px;
          font-size: 15px;
          font-weight: 700;
          backdrop-filter: blur(10px);
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .hero-btn-secondary:hover {
          background: rgba(255,255,255,0.13);
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }

        /* Dots */
        .hero-dots {
          display: flex;
          gap: 7px;
          align-items: center;
        }
        .hero-dot {
          height: 4px;
          width: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }
        .hero-dot-active {
          background: #2563eb;
          width: 36px;
          box-shadow: 0 0 8px rgba(37,99,235,0.6);
        }

        /* ── RIGHT GRID ── */
        .hero-right {
          flex: 0 0 auto;
          width: min(48%, 640px);
        }
        .hero-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 8px;
          border-radius: 16px;
          overflow: hidden;
        }

        /* ── PROGRESS BAR ── */
        .hero-progress-track {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: rgba(255,255,255,0.08);
          z-index: 20;
        }
        .hero-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          animation: hero-progress 9s linear forwards;
          box-shadow: 0 0 8px rgba(37,99,235,0.6);
        }
        @keyframes hero-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ── MOBILE ── */
        @media (max-width: 1024px) {
          .hero-right { width: min(44%, 560px); }
          .hero-left { max-width: 440px; }
        }
        @media (max-width: 768px) {
          .hero-root { min-height: 92vh; }
          .hero-inner {
            flex-direction: column;
            justify-content: flex-end;
            padding: 30px 5% 50px;
            align-items: flex-start;
          }
          .hero-right { display: none; }
          .hero-left { max-width: 100%; }
          .hero-title { font-size: 2rem; }
        }
      `}</style>
    </section>
  )
}

/* ─────────────────────────────────────────────
   THUMBNAIL CARD
───────────────────────────────────────────── */
function ThumbCard({ item, isFirst, onClick }) {
  if (!item) return <div className="thumb-empty" />
  const title   = item.title || item.name || ''
  const thumb   = tmdbImage(item.backdrop_path || item.poster_path, 'w500')

  return (
    <>
      <div
        className={`thumb-card ${isFirst ? 'thumb-active' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        aria-label={`Ver ${title}`}
      >
        <img src={thumb} alt={title} className="thumb-img" loading="lazy" />
        <div className="thumb-overlay" />
        <div className="thumb-info">
          <p className="thumb-title">{title}</p>
        </div>
        {isFirst && <div className="thumb-playing-ring" />}
      </div>

      <style>{`
        .thumb-card {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          background: #111827;
        }
        .thumb-card:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          z-index: 5;
        }
        .thumb-active {
          outline: 2.5px solid #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.35), 0 8px 24px rgba(0,0,0,0.5);
        }
        .thumb-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: filter 0.3s ease;
        }
        .thumb-card:hover .thumb-img { filter: brightness(0.7); }
        .thumb-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%);
        }
        .thumb-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 6px 8px;
        }
        .thumb-title {
          font-size: 10.5px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }
        .thumb-playing-ring {
          position: absolute;
          top: 7px; right: 7px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.4);
          animation: pulse-ring 1.8s ease infinite;
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 2px rgba(37,99,235,0.4); }
          50%       { box-shadow: 0 0 0 5px rgba(37,99,235,0.15); }
        }
        .thumb-empty {
          aspect-ratio: 16/9;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
        }
      `}</style>
    </>
  )
}

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
function HeroSkeleton() {
  return (
    <div style={{
      width: '100%', minHeight: '88vh',
      background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
      display: 'flex', alignItems: 'center',
      padding: '0 5%',
    }}>
      <div style={{ maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ height: 28, width: 130, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }} className="shimmer" />
        <div style={{ height: 68, width: '90%', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }} className="shimmer" />
        <div style={{ height: 72, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} className="shimmer" />
        <div style={{ height: 20, width: '60%', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} className="shimmer" />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ height: 50, width: 150, background: 'rgba(37,99,235,0.2)', borderRadius: 11 }} className="shimmer" />
          <div style={{ height: 50, width: 120, background: 'rgba(255,255,255,0.04)', borderRadius: 11 }} className="shimmer" />
        </div>
      </div>
    </div>
  )
}
