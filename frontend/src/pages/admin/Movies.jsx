import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Plus, Search, Trash2, ExternalLink, RefreshCw, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import { tmdbImage } from '@/lib/tmdb'

// ─── Modal: Añadir Link ───────────────────────────────────────────────────────
function AddLinkModal({ movie, onClose, onSaved }) {
  const [form, setForm] = useState({ stream_url: '', quality: 'HD', language: 'LAT', title: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!form.stream_url) return
    setLoading(true)
    setError(null)
    try {
      await api.movies.addLink(movie.id, form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121218] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Añadir Link de Streaming</h2>
            <p className="text-xs text-accent font-bold">{movie.title}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>
        <div className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-accent uppercase tracking-widest">URL del Bot *</label>
            <div className="relative">
              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/50" size={16} />
              <input value={form.stream_url} onChange={e => setForm({ ...form, stream_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-accent text-sm"
                placeholder="http://localhost:8000/stream/..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Calidad</label>
              <select value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm appearance-none">
                {['4K', '1080p', 'HD', 'SD'].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Idioma</label>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm appearance-none">
                {['LAT', 'ESP', 'SUB', 'ENG'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Etiqueta (Opcional)</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
              placeholder='Ej: "Servidor 1", "CDN Rápido"...' />
          </div>
          {error && <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</div>}
        </div>
        <div className="p-8 bg-black/20 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-muted hover:text-white">Cancelar</button>
          <button disabled={!form.stream_url || loading} onClick={handleSave}
            className="bg-accent text-white px-8 py-3 rounded-xl font-black hover:bg-red-700 transition-all disabled:opacity-30">
            {loading ? 'Guardando...' : '+ Añadir Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila expandible con links ─────────────────────────────────────────────────
function MovieRow({ movie, onRefresh, onAddLink }) {
  const [expanded, setExpanded] = useState(false)
  const linkCount = movie.video_links?.length || 0

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-6 py-4"><div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5"><img src={tmdbImage(movie.poster_path, 'w92')} alt="" className="w-full h-full object-cover" /></div></td>
        <td className="px-6 py-4">
          <p className="text-sm font-bold truncate max-w-[200px]">{movie.title}</p>
          {movie.tmdb_id && <p className="text-[9px] text-accent/50 font-black uppercase mt-0.5">TMDB: {movie.tmdb_id}</p>}
        </td>
        <td className="px-6 py-4">
          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${movie.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            {movie.status === 'published' ? 'Publicado' : 'Borrador'}
          </span>
        </td>
        <td className="px-6 py-4">
          {linkCount > 0
            ? <span className="flex items-center gap-1.5 text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-1 rounded w-fit"><Link2 size={10} /> {linkCount} link{linkCount > 1 ? 's' : ''}</span>
            : <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-1 rounded">Sin video</span>
          }
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button onClick={e => { e.stopPropagation(); onAddLink(movie) }}
              className="p-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
              title="Añadir Link">
              <Plus size={14} /> Link
            </button>
            <button onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar película?')) onRefresh(movie.id) }}
              className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Eliminar">
              <Trash2 size={16} />
            </button>
            {linkCount > 0 && (
              <div className="p-2 text-muted/40">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Links expandidos */}
      {expanded && linkCount > 0 && (
        <tr className="bg-white/[0.015]">
          <td colSpan={5} className="px-8 pb-4 pt-2">
            <div className="space-y-2">
              {movie.video_links.map(link => (
                <div key={link.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-2xl px-5 py-3 group/link">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-[10px] font-black uppercase bg-accent/10 text-accent px-2 py-0.5 rounded shrink-0">{link.quality}</span>
                    <span className="text-[10px] font-black uppercase bg-white/5 text-white/50 px-2 py-0.5 rounded shrink-0">{link.language}</span>
                    <span className="text-xs font-bold text-white/70 truncate">{link.title || 'Sin etiqueta'}</span>
                    <span className="text-[10px] font-mono text-white/20 truncate hidden lg:block">{link.id}</span>
                  </div>
                  <button onClick={() => { if (confirm('¿Eliminar este link?')) { api.movies.deleteLink(movie.id, link.id).then(onRefresh) } }}
                    className="p-1.5 hover:bg-red-500/10 text-transparent group-hover/link:text-red-500/50 hover:text-red-500 rounded-lg transition-all shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => onAddLink(movie)} className="w-full border border-dashed border-white/10 hover:border-accent/50 rounded-2xl px-5 py-2.5 text-xs font-bold text-white/30 hover:text-accent transition-all flex items-center gap-2 justify-center">
                <Plus size={14} /> Añadir otro link para esta película
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AdminMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [saveError, setSaveError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [tmdbId, setTmdbId] = useState('')
  const [importing, setImporting] = useState(false)
  const [newMovie, setNewMovie] = useState(null)

  const [addLinkTarget, setAddLinkTarget] = useState(null)

  useEffect(() => { fetchMovies() }, [])

  async function fetchMovies() {
    setLoading(true)
    try { setMovies(await api.movies.list()) } catch { }
    setLoading(false)
  }

  async function handleTMDBLookup(e) {
    if (e) e.preventDefault()
    if (!tmdbId) return
    setImporting(true)
    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      const data = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=es-ES`).then(r => r.json())
      if (data.id) {
        setNewMovie({
          tmdb_id: data.id, title: data.title, original_title: data.original_title,
          overview: data.overview, tagline: data.tagline, release_date: data.release_date,
          runtime: data.runtime, poster_path: data.poster_path, backdrop_path: data.backdrop_path,
          tmdb_rating: data.vote_average, tmdb_vote_count: data.vote_count,
          original_language: data.original_language, status: 'published', quality: 'HD'
        })
      } else { alert('No se encontró en TMDB') }
    } catch { alert('Error al buscar en TMDB') }
    finally { setImporting(false) }
  }

  async function handleSave() {
    if (!newMovie) return
    setImporting(true); setSaveError(null)
    try {
      await api.movies.create(newMovie)
      setShowModal(false); setNewMovie(null); setTmdbId('')
      fetchMovies()
    } catch (err) { setSaveError(err.message) }
    finally { setImporting(false) }
  }

  async function handleDeleteMovie(movieId) {
    await api.movies.delete(movieId)
    fetchMovies()
  }

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Películas</h1>
          <p className="text-muted font-medium">Gestiona el catálogo de largometrajes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-accent hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-accent/20">
          <Plus size={20} /> Nueva Película
        </button>
      </div>

      {/* Modal Nueva Película */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121218] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-black">Añadir Película</h2>
              <button onClick={() => { setShowModal(false); setNewMovie(null) }} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Importar desde TMDB (ID)</label>
                <div className="flex gap-3">
                  <input type="number" placeholder="Ej: 603 (Matrix)" className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-accent" value={tmdbId} onChange={e => setTmdbId(e.target.value)} />
                  <button onClick={handleTMDBLookup} disabled={importing} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50">{importing ? 'Buscando...' : 'Cargar'}</button>
                </div>
              </div>
              {newMovie && (
                <div className="animate-scale-in p-6 bg-white/5 border border-white/10 rounded-2xl flex gap-6">
                  <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-black">
                    <img src={tmdbImage(newMovie.poster_path, 'w185')} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-xl">{newMovie.title}</h4>
                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">{newMovie.overview}</p>
                    <p className="text-[10px] text-muted/50">TMDB: {newMovie.tmdb_id} · {newMovie.release_date}</p>
                    <p className="text-[10px] text-accent/70 font-bold mt-2">✓ Guarda la película primero, luego añade links desde la tabla.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-black/20 border-t border-white/5 space-y-3">
              {saveError && <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {saveError}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowModal(false); setSaveError(null) }} className="px-6 py-3 rounded-xl font-bold text-muted hover:text-white">Cancelar</button>
                <button disabled={!newMovie || importing} onClick={handleSave} className="bg-accent text-white px-8 py-3 rounded-xl font-black hover:bg-red-700 transition-all disabled:opacity-30">{importing ? 'Guardando...' : 'Guardar Película'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Link */}
      {addLinkTarget && (
        <AddLinkModal movie={addLinkTarget} onClose={() => setAddLinkTarget(null)} onSaved={fetchMovies} />
      )}

      {/* Tabla */}
      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input type="text" placeholder="Filtrar por título..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:border-accent outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={fetchMovies} className="p-2.5 rounded-xl hover:bg-white/5 text-muted hover:text-white">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 text-[10px] font-black uppercase tracking-widest text-muted border-b border-white/5">
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Links</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMovies.map(movie => (
                <MovieRow key={movie.id} movie={movie} onRefresh={handleDeleteMovie} onAddLink={setAddLinkTarget} />
              ))}
              {filteredMovies.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-muted text-sm">No se encontraron películas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
