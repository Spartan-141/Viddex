import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { tmdbImage } from '@/lib/tmdb'

export default function AdminSeries() {
  const navigate = useNavigate()
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [saveError, setSaveError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [tmdbId, setTmdbId] = useState('')
  const [importing, setImporting] = useState(false)
  const [newSeries, setNewSeries] = useState(null)

  useEffect(() => { fetchSeries() }, [])

  async function fetchSeries() {
    setLoading(true)
    try {
      const data = await api.series.list()
      setSeries(data)
    } catch (err) {
      console.error('Error cargando series:', err)
    }
    setLoading(false)
  }

  async function handleTMDBLookup(e) {
    if (e) e.preventDefault()
    if (!tmdbId) return
    setImporting(true)
    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      const response = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=es-ES`)
      const data = await response.json()
      if (data.id) {
        setNewSeries({
          tmdb_id: data.id,
          title: data.name,
          original_title: data.original_name,
          overview: data.overview,
          tagline: data.tagline,
          first_air_date: data.first_air_date,
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          tmdb_rating: data.vote_average,
          tmdb_vote_count: data.vote_count,
          total_seasons: data.number_of_seasons,
          total_episodes: data.number_of_episodes,
          original_language: data.original_language,
          content_type: 'series',
          status: 'published'
        })
      } else { alert('No se encontró en TMDB') }
    } catch (err) {
      alert('Error al buscar en TMDB')
    } finally { setImporting(false) }
  }

  async function handleSave() {
    if (!newSeries) return
    setImporting(true)
    setSaveError(null)
    try {
      await api.series.create(newSeries)
      setShowModal(false)
      setNewSeries(null)
      setTmdbId('')
      fetchSeries()
    } catch (err) {
      setSaveError(err.message)
    } finally { setImporting(false) }
  }

  const filtered = series.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Series & Animes</h1>
          <p className="text-muted font-medium">Gestiona series de TV y contenido animado.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20">
          <Plus size={20} /> Nueva Serie
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121218] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-black text-purple-400">Añadir Serie o Anime</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Importar desde TMDB TV (ID)</label>
                <div className="flex gap-3">
                  <input type="number" placeholder="Ej: 1396 (Breaking Bad)" className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-600" value={tmdbId} onChange={e => setTmdbId(e.target.value)} />
                  <button onClick={handleTMDBLookup} disabled={importing} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">{importing ? 'Buscando...' : 'Cargar'}</button>
                </div>
              </div>
              {newSeries && (
                <div className="animate-scale-in p-6 bg-white/5 border border-white/10 rounded-2xl flex gap-6">
                  <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-black">
                    <img src={tmdbImage(newSeries.poster_path, 'w185')} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-black text-xl">{newSeries.title}</h4>
                      <select value={newSeries.content_type} onChange={e => setNewSeries({...newSeries, content_type: e.target.value})} className="bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase px-2 py-1 rounded border border-purple-600/30 outline-none">
                        <option value="series">Series</option>
                        <option value="anime">Anime</option>
                      </select>
                    </div>
                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">{newSeries.overview}</p>
                    <div className="flex gap-4 pt-2">
                      <div className="text-[10px] font-black uppercase"><span className="text-muted">TMDB:</span> {newSeries.tmdb_id}</div>
                      <div className="text-[10px] font-black uppercase text-purple-400"><span className="text-muted">Temporadas:</span> {newSeries.total_seasons}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-black/20 border-t border-white/5 space-y-3">
              {saveError && <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {saveError}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowModal(false); setSaveError(null) }} className="px-6 py-3 rounded-xl font-bold text-muted hover:text-white">Cancelar</button>
                <button disabled={!newSeries || importing} onClick={handleSave} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black hover:bg-purple-700 transition-all disabled:opacity-30">{importing ? 'Guardando...' : 'Guardar Serie'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input type="text" placeholder="Filtrar..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:border-purple-600 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={fetchSeries} className="p-2.5 rounded-xl hover:bg-white/5 text-muted hover:text-white">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 text-[10px] font-black uppercase tracking-widest text-muted border-b border-white/5">
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Temporadas</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4"><div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5"><img src={tmdbImage(s.poster_path, 'w92')} alt="" className="w-full h-full object-cover" /></div></td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold truncate max-w-[200px]">{s.title}</p>
                    <p className="text-[10px] text-muted font-mono bg-white/5 px-1.5 py-0.5 rounded select-all">{s.id}</p>
                    {s.tmdb_id && <p className="text-[9px] text-purple-400 font-black uppercase mt-1">TMDB: {s.tmdb_id}</p>}
                  </td>
                  <td className="px-6 py-4"><span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${s.content_type === 'anime' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>{s.content_type}</span></td>
                  <td className="px-6 py-4"><span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${s.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{s.status === 'published' ? 'Publicado' : 'Borrador'}</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{s.total_seasons || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/admin/series/${s.id}`)} className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 text-xs font-bold flex items-center gap-1"><Plus size={14} /> Gestionar</button>
                      <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.series.delete(s.id); fetchSeries() } }} className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && <tr><td colSpan="6" className="px-6 py-20 text-center text-muted text-sm">No hay series registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
