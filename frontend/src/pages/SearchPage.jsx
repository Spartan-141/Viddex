import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import ContentCarousel from '@/components/ui/ContentCarousel'
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
      // Buscar SOLO en la BD local (películas + series)
      const [dbMovies, dbSeries] = await Promise.all([
        api.movies.list({ q: query, limit: 100 }),
        api.series.list({ q: query, limit: 100 })
      ])

      const moviesFormatted = (dbMovies || []).map(m => ({ ...m, media_type: 'movie' }))
      const seriesFormatted = (dbSeries || []).map(s => ({ ...s, media_type: s.content_type || 'tv' }))

      // Combinar, películas primero, ya sin TMDB externo
      setResults([...moviesFormatted, ...seriesFormatted])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ padding: '32px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>🔍 Buscar</h1>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 600, marginBottom: 40 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 16px',
        }}>
          <Search size={20} color="var(--text-muted)" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar películas, series, actores..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 15,
            }}
            autoFocus
          />
        </div>
        <button type="submit" style={{
          background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: 'var(--radius)',
          padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {loading && <Loader2 size={18} className="animate-spin" />}
          Buscar
        </button>
      </form>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent)' }} />
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Buscando en VIDDEX...</p>
        </div>
      ) : results.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
          gap: '24px 16px' 
        }}>
          {results.map(item => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : qFromUrl && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Search size={64} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 18 }}>No encontramos resultados para "{qFromUrl}"</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Intenta con palabras clave más generales.</p>
        </div>
      )}
      
      {!qFromUrl && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Search size={64} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 18 }}>Ingresa un término para buscar contenido</p>
        </div>
      )}
    </div>
  )
}
