import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Loader2, Database, Globe } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { tmdbSearch } from '@/lib/tmdb'
import { api } from '@/lib/api'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const qFromUrl = searchParams.get('q') || ''
  
  const [q, setQ] = useState(qFromUrl)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (qFromUrl) {
      setQ(qFromUrl)
      performSearch(qFromUrl)
    }
  }, [qFromUrl])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
  }

  const performSearch = async (query) => {
    setLoading(true)
    try {
      // 1. Buscar en BD Local
      const [dbMovies, dbSeries] = await Promise.all([
        api.movies.list({ q: query, limit: 20 }),
        api.series.list({ q: query, limit: 20 })
      ])

      const localResults = [
        ...(dbMovies || []).map(m => ({ ...m, media_type: 'movie', is_local: true })),
        ...(dbSeries || []).map(s => ({ ...s, media_type: s.content_type || 'tv', is_local: true }))
      ]

      // 2. Buscar en TMDB (Externo)
      const tmdbData = await tmdbSearch(query)
      const externalResults = (tmdbData.results || [])
        .filter(t => t.media_type === 'movie' || t.media_type === 'tv')
        .map(t => {
          // Si ya existe en local, marcamos el de local como prioritario
          const exists = localResults.find(l => l.tmdb_id === t.id)
          if (exists) return null 
          return { ...t, is_local: false, tmdb_id: t.id }
        })
        .filter(Boolean)

      // Combinar: Locales primero (nuestros links), luego TMDB (para importar)
      setResults([...localResults, ...externalResults])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ padding: '32px' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>🔍 Explorar Catálogo</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Busca en tu biblioteca local y en toda la red global de TMDB.</p>
      </header>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 700, marginBottom: 48 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '14px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }} className="search-input-wrap">
          <Search size={20} color="#6366f1" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Escribe el nombre de una película o serie..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 16, fontWeight: 500,
            }}
            autoFocus
          />
        </div>
        <button type="submit" style={{
          background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: '16px',
          padding: '0 32px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
        }}>
          BUSCAR
        </button>
      </form>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent)' }} />
          <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontWeight: 600 }}>Sincronizando con VIDDEX y TMDB...</p>
        </div>
      ) : results.length > 0 ? (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '32px 20px' 
          }}>
            {results.map(item => (
              <div key={item.id || item.tmdb_id} style={{ position: 'relative' }}>
                <MovieCard item={item} />
                
                {/* Badge indicador de origen */}
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 15,
                  padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900,
                  background: item.is_local ? 'rgba(34,197,94,0.9)' : 'rgba(37,99,235,0.9)',
                  color: 'white', display: 'flex', alignItems: 'center', gap: 4,
                  backdropFilter: 'blur(4px)', pointerEvents: 'none'
                }}>
                  {item.is_local ? <Database size={10}/> : <Globe size={10}/>}
                  {item.is_local ? 'EN LIBRERÍA' : 'DISPONIBLE'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : qFromUrl && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          <Search size={80} style={{ margin: '0 auto 24px', display: 'block', opacity: 0.1 }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Sin resultados exactos</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>No encontramos "{qFromUrl}" en ninguna de nuestras fuentes.</p>
        </div>
      )}
      
      {!qFromUrl && !loading && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.2)' }}>
          <Globe size={100} style={{ margin: '0 auto 24px', display: 'block', opacity: 0.05 }} />
          <p style={{ fontSize: 18, fontWeight: 600 }}>Busca cualquier contenido del mundo</p>
          <p style={{ fontSize: 14 }}>El sistema buscará en tu servidor y en la base de datos global de TMDB.</p>
        </div>
      )}

      <style>{`
        .search-input-wrap:focus-within {
          border-color: var(--accent) !important;
          background: rgba(37,99,235,0.05) !important;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1) !important;
        }
      `}</style>
    </div>
  )
}
