import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'

/**
 * ContentCarousel — Carrusel horizontal de tarjetas de contenido
 */
export default function ContentCarousel({ title, items = [], type = 'movie', loading = false }) {
  const scrollRef = useRef(null)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' })
    setTimeout(updateScrollState, 400)
  }

  return (
    <section className="cc-section">
      {/* ── Header ── */}
      <div className="cc-header">
        <div className="cc-title-wrap">
          <span className="cc-title-accent" />
          <h2 className="cc-title">{title}</h2>
        </div>
        <div className="cc-nav-btns">
          <NavBtn onClick={() => scroll(-1)} disabled={!canScrollLeft} aria-label="Anterior">
            <ChevronLeft size={18} />
          </NavBtn>
          <NavBtn onClick={() => scroll(1)} disabled={!canScrollRight} aria-label="Siguiente">
            <ChevronRight size={18} />
          </NavBtn>
        </div>
      </div>

      {/* ── Scroll container ── */}
      <div className="cc-track-wrap">
        {/* Left fade */}
        <div className="cc-fade cc-fade-left" style={{ opacity: canScrollLeft ? 1 : 0 }} />
        {/* Right fade */}
        <div className="cc-fade cc-fade-right" style={{ opacity: canScrollRight ? 1 : 0 }} />

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="cc-track hide-scrollbar"
        >
          {loading
            ? Array.from({ length: 9 }, (_, i) => <CardSkeleton key={i} />)
            : items.map(item => (
                <div key={item.id} className="cc-card-wrap">
                  <MovieCard item={item} type={type} />
                </div>
              ))
          }
        </div>
      </div>

      <style>{`
        .cc-section {
          margin-bottom: 44px;
        }
        .cc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          margin-bottom: 14px;
        }
        .cc-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cc-title-accent {
          width: 4px;
          height: 22px;
          background: linear-gradient(180deg, #2563eb, #60a5fa);
          border-radius: 999px;
          flex-shrink: 0;
        }
        .cc-title {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.4px;
        }
        .cc-nav-btns {
          display: flex;
          gap: 6px;
        }
        .cc-track-wrap {
          position: relative;
        }
        .cc-fade {
          position: absolute;
          top: 0; bottom: 0;
          width: 60px;
          z-index: 2;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .cc-fade-left {
          left: 0;
          background: linear-gradient(to right, var(--bg-primary), transparent);
        }
        .cc-fade-right {
          right: 0;
          background: linear-gradient(to left, var(--bg-primary), transparent);
        }
        .cc-track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 6px 28px 18px;
          scroll-snap-type: x mandatory;
        }
        .cc-card-wrap {
          scroll-snap-align: start;
          width: var(--card-width);
          flex-shrink: 0;
        }
      `}</style>
    </section>
  )
}

function NavBtn({ children, onClick, disabled, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cc-nav-btn ${disabled ? '' : 'cc-nav-btn-active'}`}
      {...props}
    >
      {children}
      <style>{`
        .cc-nav-btn {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px;
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.4;
          transition: all 0.2s ease;
        }
        .cc-nav-btn-active {
          color: var(--text-secondary);
          cursor: pointer;
          opacity: 1;
        }
        .cc-nav-btn-active:hover {
          background: rgba(37,99,235,0.15);
          border-color: rgba(37,99,235,0.4);
          color: #93c5fd;
        }
      `}</style>
    </button>
  )
}

function CardSkeleton() {
  return (
    <div className="shimmer" style={{
      flexShrink: 0,
      width: 'var(--card-width)',
      aspectRatio: '2/3',
      borderRadius: 'var(--radius)',
      background: 'var(--bg-card)',
    }} />
  )
}
