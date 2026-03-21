import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import MovieCard from '@/components/ui/MovieCard'
import { Heart, Loader2, PlayCircle } from 'lucide-react'

export default function WatchlistPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchWatchlist()
    }
  }, [user])

  async function fetchWatchlist() {
    setLoading(true)
    try {
      const data = await api.watchlist.list()
      
      // Normalizar datos para MovieCard
      const normalized = data.map(item => {
        const content = item.movie || item.series
        return {
          ...content,
          watchlist_id: item.id
        }
      })

      setItems(normalized)
    } catch (err) {
      console.error("Error fetching watchlist:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-muted">Cargando tus favoritos...</p>
      </div>
    )
  }

  return (
    <div className="p-8 md:p-12 animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
            <Heart size={36} className="text-accent fill-accent" />
            Mi Lista
          </h1>
          <p className="text-muted font-medium">Contenido que has guardado para ver después</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
          <span className="text-2xl font-black text-white">{items.length}</span>
          <span className="ml-2 text-xs font-bold uppercase tracking-widest text-muted">Títulos</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
          <PlayCircle size={64} className="text-white/10 mb-6" />
          <h2 className="text-xl font-bold mb-2">Tu lista está vacía</h2>
          <p className="text-muted max-w-sm text-center mb-8">
            Explora el catálogo y añade películas o series a tu lista para tenerlas siempre a mano.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-white text-black font-black px-8 py-3 rounded-xl hover:scale-105 transition-transform"
          >
            Explorar Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
