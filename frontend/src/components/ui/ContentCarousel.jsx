import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'

const SIDE_PAD = 36  // px de margen en ambos bordes del scroll

export default function ContentCarousel({ title, items = [], type = 'movie', loading = false }) {
  const scrollRef = useRef(null)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' })
    setTimeout(updateScrollState, 400)
  }

  const emojiMatch = title.match(/^\p{Emoji}/u)
  const emoji      = emojiMatch ? emojiMatch[0] : '🎬'
  const cleanTitle = title.replace(/^\p{Emoji}\s*/u, '').toUpperCase()

  return (
    <section style={{ marginBottom: 48 }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${SIDE_PAD}px`, marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34,
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>
          </div>
          <h2 style={{
            fontSize: 15, fontWeight: 900, letterSpacing: 1,
            color: '#e2e8f0', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{cleanTitle}</h2>
          <div style={{
            flex: 1, height: 1, minWidth: 20,
            background: 'linear-gradient(to right, rgba(37,99,235,0.35), transparent)',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 12 }}>
          <NavBtn active={canScrollLeft}  onClick={() => scroll(-1)} label="Anterior"  Icon={ChevronLeft}  />
          <NavBtn active={canScrollRight} onClick={() => scroll(1)}  label="Siguiente" Icon={ChevronRight} />
        </div>
      </div>

      {/*
        SCROLL CONTAINER
        ────────────────
        - paddingLeft / paddingRight: separación de bordes
        - paddingTop: espacio para el scale-up del hover (no se recorta)
        - paddingBottom: espacio para sombra inferior de las tarjetas
        - SIN fades/sombras laterales (usuario solicitó quitarlos)
      */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 13,
          overflowX: 'auto',
          paddingLeft:   SIDE_PAD,
          paddingRight:  SIDE_PAD,
          paddingTop:    20,    // espacio para hover scale
          paddingBottom: 14,
          scrollSnapType: 'x mandatory',
          boxSizing: 'border-box',
        }}
      >
        {loading
          ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
          : items.map(item => (
              <div key={item.id} style={{
                flexShrink: 0,
                width: 'var(--card-width)',
                scrollSnapAlign: 'start',
              }}>
                <MovieCard item={item} type={type} />
              </div>
            ))
        }
      </div>
    </section>
  )
}

function NavBtn({ active, onClick, label, Icon }) {
  return (
    <button
      onClick={active ? onClick : undefined}
      disabled={!active}
      aria-label={label}
      style={{
        width: 32, height: 32,
        borderRadius: 8,
        border: `1px solid ${active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
        background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: active ? 'pointer' : 'not-allowed',
        opacity: active ? 1 : 0.35,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        if (!active) return
        e.currentTarget.style.background = 'rgba(37,99,235,0.18)'
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.45)'
        e.currentTarget.style.color = '#93c5fd'
      }}
      onMouseLeave={e => {
        if (!active) return
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
      }}
    >
      <Icon size={18} />
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="shimmer" style={{
      flexShrink: 0,
      width: 'var(--card-width)',
      scrollSnapAlign: 'start',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ aspectRatio: '2/3', borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ height: 11, borderRadius: 5, background: 'rgba(255,255,255,0.04)', width: '80%' }} />
      <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.03)', width: '55%' }} />
    </div>
  )
}
