import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { tmdbImage } from '@/lib/tmdb'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Star, X } from 'lucide-react'

const GENRES_MOVIE = [
  {id:28,name:'Acción'},{id:12,name:'Aventura'},{id:16,name:'Animación'},
  {id:35,name:'Comedia'},{id:80,name:'Crimen'},{id:99,name:'Documental'},
  {id:18,name:'Drama'},{id:10751,name:'Familia'},{id:14,name:'Fantasía'},
  {id:36,name:'Historia'},{id:27,name:'Terror'},{id:10402,name:'Música'},
  {id:9648,name:'Misterio'},{id:10749,name:'Romance'},{id:878,name:'Ciencia ficción'},
  {id:10770,name:'Película de TV'},{id:53,name:'Suspenso'},{id:10752,name:'Bélica'},{id:37,name:'Western'},
]
const GENRES_TV = [
  {id:10759,name:'Acción & Aventura'},{id:16,name:'Animación'},{id:35,name:'Comedia'},
  {id:80,name:'Crimen'},{id:99,name:'Documental'},{id:18,name:'Drama'},
  {id:10751,name:'Familia'},{id:10762,name:'Infantil'},{id:9648,name:'Misterio'},
  {id:10763,name:'Noticias'},{id:10764,name:'Reality'},{id:10765,name:'Sci-Fi & Fantasy'},
  {id:10766,name:'Telenovela'},{id:10767,name:'Talk Show'},{id:10768,name:'Política & Guerra'},
]

const ALPHABET = ['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
const PAGE_SIZE = 36

export default function CatalogPage({ contentType = 'pelicula', emoji = '🎬', label = 'Películas' }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [selectedLetter, setSelectedLetter] = useState(null)
  const [sortBy, setSortBy] = useState('recent') // recent | alpha | rating | year
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const topRef = useRef(null)

  const isMovie = contentType === 'pelicula'
  const isSeries = contentType === 'series'
  const GENRES = isMovie ? GENRES_MOVIE : GENRES_TV

  // Load all items from local DB
  useEffect(() => {
    setLoading(true)
    const loader = isMovie
      ? api.movies.list({ limit: 500 })
      : api.series.list({ content_type: contentType, limit: 500 })

    loader.then(data => {
      const list = Array.isArray(data) ? data : (data?.items || data?.results || [])
      setItems(list)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [contentType])

  // Apply filters + sort
  useEffect(() => {
    let result = [...items]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m => (m.title || m.name || '').toLowerCase().includes(q))
    }

    // Alphabet
    if (selectedLetter) {
      if (selectedLetter === '#') {
        result = result.filter(m => !/^[a-z]/i.test((m.title || m.name || '')))
      } else {
        result = result.filter(m => (m.title || m.name || '').toUpperCase().startsWith(selectedLetter))
      }
    }

    // Genre (by genre name in genres array or genres_ids)
    if (selectedGenre) {
      result = result.filter(m => {
        const g = m.genres || m.genre_ids || []
        if (typeof g[0] === 'object') return g.some(x => x.id === selectedGenre || x.name === selectedGenre)
        return g.includes(selectedGenre)
      })
    }

    // Sort
    if (sortBy === 'recent') result.sort((a,b) => (b.created_at||b.year||0) > (a.created_at||a.year||0) ? 1 : -1)
    else if (sortBy === 'alpha') result.sort((a,b) => (a.title||a.name||'').localeCompare(b.title||b.name||''))
    else if (sortBy === 'rating') result.sort((a,b) => (b.tmdb_rating||b.vote_average||0) - (a.tmdb_rating||a.vote_average||0))
    else if (sortBy === 'year') result.sort((a,b) => (b.year||0) - (a.year||0))

    setFiltered(result)
    setPage(1)
  }, [items, search, selectedGenre, selectedLetter, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const goPage = useCallback((p) => {
    setPage(p)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const clearFilters = () => {
    setSearch('')
    setSelectedGenre(null)
    setSelectedLetter(null)
    setSortBy('recent')
  }

  const hasActiveFilters = search || selectedGenre || selectedLetter || sortBy !== 'recent'

  return (
    <div style={{ minHeight:'100vh', color:'white', background:'#07090f' }} ref={topRef}>

      {/* ── HEADER ── */}
      <div style={{ background:'linear-gradient(to bottom, rgba(37,99,235,0.12) 0%, transparent 100%)', padding:'40px 28px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:36, fontWeight:900, letterSpacing:'-1px', margin:0 }}>{emoji} {label}</h1>
              <p style={{ color:'rgba(255,255,255,0.4)', marginTop:6, fontSize:14 }}>
                {loading ? 'Cargando...' : `${filtered.length} ${label.toLowerCase()} disponibles`}
              </p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{
              display:'flex', alignItems:'center', gap:8,
              background: showFilters ? '#2563eb' : 'rgba(255,255,255,0.07)',
              border:'1px solid', borderColor: showFilters ? '#2563eb' : 'rgba(255,255,255,0.12)',
              color:'white', padding:'10px 18px', borderRadius:12,
              fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s',
            }}>
              <SlidersHorizontal size={16}/>
              Filtros {hasActiveFilters && <span style={{ background:'white', color:'#2563eb', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900 }}>!</span>}
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position:'relative', maxWidth:520 }}>
            <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', pointerEvents:'none' }}/>
            <input
              type="text"
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width:'100%', background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:12,
                color:'white', padding:'12px 16px 12px 42px', fontSize:14, outline:'none',
                transition:'border 0.2s', boxSizing:'border-box',
              }}
              onFocus={e => e.target.style.borderColor='rgba(37,99,235,0.6)'}
              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
            />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer' }}><X size={14}/></button>}
          </div>
        </div>
      </div>

      {/* ── FILTER PANEL ── */}
      {showFilters && (
        <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'20px 28px' }}>
          <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

            {/* Sort Row */}
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', minWidth:60 }}>Ordenar</span>
              {[['recent','Más Recientes'],['year','Por Año'],['rating','Mejor Valorados'],['alpha','A → Z']].map(([val,lbl]) => (
                <button key={val} onClick={() => setSortBy(val)} style={{
                  padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
                  background: sortBy===val ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  border:'1px solid', borderColor: sortBy===val ? '#2563eb' : 'rgba(255,255,255,0.1)',
                  color: sortBy===val ? 'white' : 'rgba(255,255,255,0.5)',
                  transition:'all 0.18s',
                }}>{lbl}</button>
              ))}
            </div>

            {/* Alphabet Row */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', minWidth:60 }}>Letra</span>
              {ALPHABET.map(l => (
                <button key={l} onClick={() => setSelectedLetter(selectedLetter===l ? null : l)} style={{
                  width:32, height:32, borderRadius:7, fontSize:12, fontWeight:800, cursor:'pointer',
                  background: selectedLetter===l ? '#2563eb' : 'rgba(255,255,255,0.05)',
                  border:'1px solid', borderColor: selectedLetter===l ? '#2563eb' : 'rgba(255,255,255,0.08)',
                  color: selectedLetter===l ? 'white' : 'rgba(255,255,255,0.4)',
                  transition:'all 0.15s',
                }}>{l}</button>
              ))}
            </div>

            {/* Genre Row */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', minWidth:60, paddingTop:8 }}>Género</span>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {GENRES.map(g => (
                  <button key={g.id} onClick={() => setSelectedGenre(selectedGenre===g.id ? null : g.id)} style={{
                    padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
                    background: selectedGenre===g.id ? '#2563eb' : 'rgba(255,255,255,0.05)',
                    border:'1px solid', borderColor: selectedGenre===g.id ? '#2563eb' : 'rgba(255,255,255,0.08)',
                    color: selectedGenre===g.id ? 'white' : 'rgba(255,255,255,0.45)',
                    transition:'all 0.15s',
                  }}>{g.name}</button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <X size={13}/> Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── GRID ── */}
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 28px 60px' }}>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:18 }}>
            {Array.from({length:18}).map((_,i) => (
              <div key={i} style={{ borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.04)', animation:'skeleton-pulse 1.5s ease-in-out infinite', animationDelay:`${i*0.05}s` }}>
                <div style={{ aspectRatio:'2/3', background:'rgba(255,255,255,0.06)' }}/>
                <div style={{ padding:'10px 12px' }}>
                  <div style={{ height:12, background:'rgba(255,255,255,0.08)', borderRadius:4, marginBottom:6 }}/>
                  <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:4, width:'60%' }}/>
                </div>
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontSize:48, marginBottom:16 }}>🔍</p>
            <p style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Sin resultados</p>
            <p style={{ color:'rgba(255,255,255,0.4)' }}>Intenta con otros filtros</p>
            <button onClick={clearFilters} style={{ marginTop:16, background:'#2563eb', color:'white', border:'none', padding:'10px 24px', borderRadius:10, fontWeight:700, cursor:'pointer' }}>Limpiar filtros</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:18 }}>
            {pageItems.map((item, idx) => (
              <CatalogCard
                key={item.id}
                item={item}
                type={contentType}
                idx={idx}
                onClick={() => navigate(`/ver/${contentType}/${item.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && !loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:48, flexWrap:'wrap' }}>
            <button onClick={() => goPage(Math.max(1,page-1))} disabled={page===1} style={{
              display:'flex', alignItems:'center', gap:4,
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              color: page===1 ? 'rgba(255,255,255,0.2)' : 'white',
              padding:'8px 16px', borderRadius:9, fontWeight:700, cursor:page===1?'not-allowed':'pointer', fontSize:13,
            }}>
              <ChevronLeft size={15}/> Anterior
            </button>

            {/* Page numbers */}
            {Array.from({length:totalPages}, (_,i)=>i+1).filter(p => {
              if (totalPages <= 7) return true
              return p === 1 || p === totalPages || Math.abs(p - page) <= 2
            }).reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i-1] > 1) acc.push('...')
              acc.push(p)
              return acc
            }, []).map((p, i) => (
              p === '...' ? (
                <span key={`dots-${i}`} style={{ color:'rgba(255,255,255,0.3)', padding:'0 4px' }}>…</span>
              ) : (
                <button key={p} onClick={() => goPage(p)} style={{
                  width:36, height:36, borderRadius:9, fontSize:13, fontWeight:800, cursor:'pointer',
                  background: p===page ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  border:'1px solid', borderColor: p===page ? '#2563eb' : 'rgba(255,255,255,0.1)',
                  color: p===page ? 'white' : 'rgba(255,255,255,0.6)',
                  boxShadow: p===page ? '0 0 14px rgba(37,99,235,0.4)' : 'none',
                  transition:'all 0.15s',
                }}>{p}</button>
              )
            ))}

            <button onClick={() => goPage(Math.min(totalPages,page+1))} disabled={page===totalPages} style={{
              display:'flex', alignItems:'center', gap:4,
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              color: page===totalPages ? 'rgba(255,255,255,0.2)' : 'white',
              padding:'8px 16px', borderRadius:9, fontWeight:700, cursor:page===totalPages?'not-allowed':'pointer', fontSize:13,
            }}>
              Siguiente <ChevronRight size={15}/>
            </button>
          </div>
        )}

        {/* Page info */}
        {totalPages > 1 && !loading && (
          <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:'rgba(255,255,255,0.25)' }}>
            Página {page} de {totalPages} · {filtered.length} resultados
          </p>
        )}
      </div>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes card-in {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .catalog-card { animation: card-in 0.35s ease both; }
        .catalog-card:hover .catalog-poster { transform: scale(1.05); }
        .catalog-card:hover .catalog-overlay { opacity: 1; }
        .catalog-card:hover .catalog-info { background: rgba(37,99,235,0.08); }
        @media (max-width: 640px) {
          .catalog-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 12px !important; }
        }
      `}</style>
    </div>
  )
}

// ── CARD COMPONENT ──
function CatalogCard({ item, type, idx, onClick }) {
  const poster = item.poster_path ? tmdbImage(item.poster_path, 'w342') : null
  const title = item.title || item.name || 'Sin título'
  const year = item.year || item.release_date?.slice(0,4) || item.first_air_date?.slice(0,4) || ''
  const rating = item.tmdb_rating || item.vote_average

  return (
    <div
      className="catalog-card"
      onClick={onClick}
      style={{
        cursor:'pointer', borderRadius:12, overflow:'hidden',
        background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
        transition:'border-color 0.2s, box-shadow 0.2s',
        animationDelay:`${(idx % 36) * 0.03}s`,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(37,99,235,0.4)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Poster */}
      <div style={{ aspectRatio:'2/3', overflow:'hidden', position:'relative', background:'rgba(255,255,255,0.04)' }}>
        {poster
          ? <img className="catalog-poster" src={poster} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.4s ease' }} loading="lazy"/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🎬</div>
        }
        {/* Year badge */}
        {year && (
          <span style={{
            position:'absolute', bottom:8, left:8,
            background:'rgba(37,99,235,0.9)', color:'white',
            fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:6,
            backdropFilter:'blur(6px)',
          }}>{year}</span>
        )}
        {/* Rating badge */}
        {rating > 0 && (
          <span style={{
            position:'absolute', top:8, right:8,
            background:'rgba(0,0,0,0.75)', color:'#f59e0b',
            fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:6,
            backdropFilter:'blur(6px)', display:'flex', alignItems:'center', gap:3,
          }}>
            <Star size={9} fill="#f59e0b"/> {Number(rating).toFixed(1)}
          </span>
        )}
        {/* Hover overlay */}
        <div className="catalog-overlay" style={{ position:'absolute', inset:0, background:'rgba(37,99,235,0.15)', opacity:0, transition:'opacity 0.25s' }}/>
      </div>

      {/* Info */}
      <div className="catalog-info" style={{ padding:'10px 10px 12px', transition:'background 0.2s' }}>
        <p style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', margin:0, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {title}
        </p>
        {year && <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:'4px 0 0', fontWeight:600 }}>{year}</p>}
      </div>
    </div>
  )
}
