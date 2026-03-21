import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Unlink, Film, Tv, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { tmdbImage } from '@/lib/tmdb'

export default function MissingLinks() {
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [tab, setTab] = useState('movies')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [mv, sr] = await Promise.all([
        api.request('/movies/missing-links'),
        api.request('/series/missing-links'),
      ])
      setMovies(mv || [])
      setSeries(sr || [])
    } catch (e) {
      console.error('Error fetching missing links:', e)
    } finally {
      setLoading(false)
    }
  }

  function copyId(id, tmdbId) {
    navigator.clipboard.writeText(String(tmdbId || id))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const items = tab === 'movies' ? movies : series
  const totalMissing = movies.length + series.length

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <span className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><LinkSlash size={24} /></span>
            Links Faltantes
          </h1>
          <p className="text-white/50 font-medium">
            Contenido sin enlace de Vimeus ni de Telegram — sube estos a Telegram para completar el catálogo.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Film size={22} /></div>
          <div>
            <p className="text-3xl font-black">{movies.length}</p>
            <p className="text-white/40 text-sm font-bold">Películas sin link</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><Tv size={22} /></div>
          <div>
            <p className="text-3xl font-black">{series.length}</p>
            <p className="text-white/40 text-sm font-bold">Series sin episodios</p>
          </div>
        </div>
      </div>

      {/* Alerta si no hay faltantes */}
      {!loading && totalMissing === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex items-center gap-4">
          <Check size={24} className="text-green-500" />
          <div>
            <p className="font-black text-green-400">¡Todo el catálogo tiene enlaces!</p>
            <p className="text-white/50 text-sm">No hay contenido sin link de Vimeus o Telegram.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {totalMissing > 0 && (
        <div className="flex gap-2">
          {[
            { key: 'movies', label: `Películas (${movies.length})`, icon: Film },
            { key: 'series', label: `Series (${series.length})`, icon: Tv },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === key ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de contenido sin links */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-white/3 hover:bg-white/6 border border-white/5 rounded-2xl p-3 transition-colors group"
            >
              {/* Poster */}
              <img
                src={tmdbImage(item.poster_path, 'w92')}
                alt={item.title}
                className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.title}</p>
                <p className="text-white/40 text-xs">
                  TMDB ID: <span className="text-white/70 font-mono">{item.tmdb_id || '—'}</span>
                  {(item.release_date || item.first_air_date) &&
                    <> · {(item.release_date || item.first_air_date)?.slice(0, 4)}</>
                  }
                  {item.tmdb_rating > 0 &&
                    <> · ⭐ {item.tmdb_rating?.toFixed(1)}</>
                  }
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Copiar TMDB ID */}
                <button
                  onClick={() => copyId(item.id, item.tmdb_id)}
                  className="p-2 bg-white/5 hover:bg-accent/20 hover:text-accent rounded-lg text-white/40 transition-all text-xs font-bold flex items-center gap-1.5"
                  title="Copiar TMDB ID para buscar en Telegram"
                >
                  {copied === item.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  <span className="hidden sm:block">TMDB ID</span>
                </button>

                {/* Ver en TMDB */}
                {item.tmdb_id && (
                  <a
                    href={`https://www.themoviedb.org/${tab === 'movies' ? 'movie' : 'tv'}/${item.tmdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-white/40 transition-all"
                    title="Ver en TMDB"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}

                {/* Ir a editar */}
                <Link
                  to={tab === 'movies' ? `/admin/peliculas` : `/admin/series`}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all text-xs font-bold"
                  title="Ir a editar en el panel"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}

          {items.length === 0 && !loading && (
            <div className="text-center py-12 text-white/30 font-bold">
              ✅ No hay {tab === 'movies' ? 'películas' : 'series'} con links faltantes en esta categoría.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
