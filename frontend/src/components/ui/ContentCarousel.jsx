import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'

/**
 * ContentCarousel — Carrusel horizontal de tarjetas de contenido
 */
export default function ContentCarousel({ title, items = [], type = 'movie', loading = false }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
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
    // Scroll 80% of the visible container
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
    setTimeout(updateScrollState, 350)
  }

  return (
    <section style={{ marginBottom: 40 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        marginBottom: 16,
      }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {title}
        </h2>

        <div style={{ display: 'flex', gap: 6 }}>
          <NavBtn
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll izquierda"
          >
            <ChevronLeft size={18} />
          </NavBtn>
          <NavBtn
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="Scroll derecha"
          >
            <ChevronRight size={18} />
          </NavBtn>
        </div>
      </div>

      {/* Scroll container */}
      <div style={{ position: 'relative' }}>
        {/* Left fade */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 48,
          background: 'linear-gradient(to right, var(--bg-primary), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: canScrollLeft ? 1 : 0,
          transition: 'opacity 0.2s',
        }} />

        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 48,
          background: 'linear-gradient(to left, var(--bg-primary), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: canScrollRight ? 1 : 0,
          transition: 'opacity 0.2s',
        }} />

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            padding: '8px 32px 16px',
            scrollSnapType: 'x mandatory',
          }}
        >
          {loading
            ? Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)
            : items.map(item => (
                <div key={item.id} style={{ scrollSnapAlign: 'start', width: 'var(--card-width)', flexShrink: 0 }}>
                  <MovieCard item={item} type={type} />
                </div>
              ))
          }
        </div>
      </div>
    </section>
  )
}

function NavBtn({ children, onClick, disabled, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34, height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all var(--transition)',
      }}
      className={disabled ? '' : 'carousel-nav-btn'}
      {...props}
    >
      {children}
      <style>{`
        .carousel-nav-btn:hover {
          background: var(--accent-muted) !important;
          border-color: var(--accent) !important;
          color: var(--accent) !important;
        }
      `}</style>
    </button>
  )
}

function CardSkeleton() {
  return (
    <div style={{
      flexShrink: 0,
      width: 'var(--card-width)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }} className="shimmer">
      <div style={{ aspectRatio: '2/3' }} />
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ height: 12, borderRadius: 4, marginBottom: 8, background: 'var(--bg-elevated)' }} />
        <div style={{ height: 12, borderRadius: 4, width: '60%', background: 'var(--bg-elevated)' }} />
      </div>
    </div>
  )
}
