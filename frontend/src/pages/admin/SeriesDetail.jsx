import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { ChevronLeft, Plus, Trash2, Link as LinkIcon, Tv, Film, ExternalLink } from 'lucide-react'

// ─── Modal Añadir Link Episodio ───────────────────────────────────────────────
function AddEpLinkModal({ episode, onClose, onSaved }) {
  const [form, setForm] = useState({ stream_url: '', quality: 'HD', language: 'LAT', title: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!form.stream_url) return
    setLoading(true); setError(null)
    try {
      await api.episodes.addLink(episode.id, form)
      onSaved(); onClose()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121218] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Añadir Link</h2>
            <p className="text-xs text-purple-400 font-bold">Cap. {episode.episode_number} — {episode.name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>
        <div className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">URL del Bot *</label>
            <div className="relative">
              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/50" size={16} />
              <input value={form.stream_url} onChange={e => setForm({ ...form, stream_url: e.target.value })}
                className="w-full bg-purple-600/5 border border-purple-600/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-purple-600 text-sm"
                placeholder="http://localhost:8000/stream/..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Calidad</label>
              <select value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600 text-sm appearance-none">
                {['4K', '1080p', 'HD', 'SD'].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">Idioma</label>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600 text-sm appearance-none">
                {['LAT', 'ESP', 'SUB', 'ENG'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Etiqueta (Opcional)</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600 text-sm"
              placeholder='Ej: "Servidor 1", "Alta Calidad"...' />
          </div>
          {error && <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">⚠️ {error}</div>}
        </div>
        <div className="p-8 bg-black/20 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-muted hover:text-white">Cancelar</button>
          <button disabled={!form.stream_url || loading} onClick={handleSave}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black hover:bg-purple-700 transition-all disabled:opacity-30">
            {loading ? 'Guardando...' : '+ Añadir Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de Episodio ──────────────────────────────────────────────────────
function EpisodeCard({ ep, onDelete, onAddLink, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const linkCount = ep.video_links?.length || 0

  return (
    <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all">
      {/* Cabecera del episodio */}
      <div className="p-5 flex items-center justify-between group cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-purple-600/10 text-purple-400 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
            {ep.episode_number}
          </div>
          <div>
            <h4 className="font-bold">{ep.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {linkCount > 0
                ? <span className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                    <LinkIcon size={9} /> {linkCount} link{linkCount > 1 ? 's' : ''}
                  </span>
                : <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Sin Video</span>
              }
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={e => { e.stopPropagation(); onAddLink(ep) }}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-xs font-bold flex items-center gap-1">
            <Plus size={12} /> Link
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(ep.id) }}
            className="p-2 hover:bg-red-500/10 text-muted hover:text-red-500 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Lista expandida de links */}
      {expanded && linkCount > 0 && (
        <div className="border-t border-white/5 px-5 pb-4 pt-3 space-y-2">
          {ep.video_links.map(link => (
            <div key={link.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-4 py-2.5 group/link">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[9px] font-black uppercase bg-purple-600/10 text-purple-400 px-2 py-0.5 rounded shrink-0">{link.quality}</span>
                <span className="text-[9px] font-black uppercase bg-white/5 text-white/40 px-2 py-0.5 rounded shrink-0">{link.language}</span>
                <span className="text-xs text-white/60 truncate">{link.title || 'Sin etiqueta'}</span>
              </div>
              <button onClick={() => { if (confirm('¿Eliminar este link?')) { api.episodes.deleteLink(link.id).then(onRefresh) } }}
                className="p-1 hover:bg-red-500/10 text-transparent group-hover/link:text-red-500/40 hover:text-red-500 rounded-lg transition-all shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={() => onAddLink(ep)} className="w-full border border-dashed border-white/10 hover:border-purple-600/50 rounded-xl px-4 py-2 text-xs font-bold text-white/30 hover:text-purple-400 transition-all flex items-center gap-2 justify-center">
            <Plus size={12} /> Otro link para este capítulo
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function SeriesDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [series, setSeries] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [newSeason, setNewSeason] = useState({ season_number: '', name: '' })
  const [newEpisode, setNewEpisode] = useState({ episode_number: '', name: '', overview: '' })

  const [addLinkEpisode, setAddLinkEpisode] = useState(null)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    setLoading(true)
    try {
      const data = await api.series.get(id)
      setSeries(data)
      setSeasons(data.seasons || [])
      if (data.seasons?.length > 0) setSelectedSeason(prev => prev ? data.seasons.find(s => s.id === prev.id) || data.seasons[0] : data.seasons[0])
    } catch (err) { console.error('Error:', err) }
    setLoading(false)
  }

  async function handleCreateSeason() {
    setActionLoading(true)
    try {
      await api.seasons.create({ series_id: id, season_number: parseInt(newSeason.season_number), name: newSeason.name || `Temporada ${newSeason.season_number}` })
      setShowSeasonModal(false); setNewSeason({ season_number: '', name: '' }); fetchData()
    } catch (err) { alert(err.message) }
    setActionLoading(false)
  }

  async function handleCreateEpisode() {
    setActionLoading(true)
    try {
      await api.episodes.create({ series_id: id, season_id: selectedSeason.id, episode_number: parseInt(newEpisode.episode_number), name: newEpisode.name || `Episodio ${newEpisode.episode_number}`, overview: newEpisode.overview })
      setShowEpisodeModal(false); setNewEpisode({ episode_number: '', name: '', overview: '' }); fetchData()
    } catch (err) { alert(err.message) }
    setActionLoading(false)
  }

  async function handleDeleteEpisode(epId) {
    if (!confirm('¿Eliminar este episodio?')) return
    await api.episodes.delete(epId)
    fetchData()
  }

  const selectedEpisodes = selectedSeason ? (seasons.find(s => s.id === selectedSeason.id)?.episodes || []) : []

  if (loading) return <div className="p-8 text-center text-muted">Cargando...</div>

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/series')} className="p-2 hover:bg-white/5 rounded-xl text-muted">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black">{series?.title}</h1>
          <p className="text-muted text-sm">Gestión de Temporadas y Capítulos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Temporadas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Temporadas</h3>
            <button onClick={() => setShowSeasonModal(true)} className="p-1.5 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30"><Plus size={16} /></button>
          </div>
          <div className="space-y-2">
            {seasons.map(s => (
              <button key={s.id} onClick={() => setSelectedSeason(s)} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${selectedSeason?.id === s.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'}`}>
                T{s.season_number}: {s.name}
              </button>
            ))}
            {seasons.length === 0 && <p className="text-xs text-muted/50 text-center py-4">No hay temporadas.</p>}
          </div>
        </div>

        {/* Episodios */}
        <div className="lg:col-span-9 space-y-6">
          {selectedSeason ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{selectedSeason.name}</h2>
                  <p className="text-muted text-xs">Pulsa sobre un capítulo para ver y gestionar sus links</p>
                </div>
                <button onClick={() => setShowEpisodeModal(true)} className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-2">
                  <Plus size={18} /> Nuevo Capítulo
                </button>
              </div>
              <div className="grid gap-3">
                {selectedEpisodes.map(ep => (
                  <EpisodeCard key={ep.id} ep={ep} onDelete={handleDeleteEpisode} onAddLink={setAddLinkEpisode} onRefresh={fetchData} />
                ))}
                {selectedEpisodes.length === 0 && (
                  <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
                    <Tv size={40} className="mx-auto text-muted/20 mb-4" />
                    <p className="text-muted font-medium">No hay capítulos en esta temporada.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Film size={40} className="mx-auto text-muted/20 mb-4" />
              <p className="text-muted">Selecciona una temporada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Añadir Link Episodio */}
      {addLinkEpisode && (
        <AddEpLinkModal episode={addLinkEpisode} onClose={() => setAddLinkEpisode(null)} onSaved={fetchData} />
      )}

      {/* Modal Nueva Temporada */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121218] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black">Nueva Temporada</h2>
              <button onClick={() => setShowSeasonModal(false)} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Número</label>
                <input type="number" value={newSeason.season_number} onChange={e => setNewSeason({ ...newSeason, season_number: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600" placeholder="1" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Nombre (Opcional)</label>
                <input value={newSeason.name} onChange={e => setNewSeason({ ...newSeason, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600" placeholder="Temporada 1" />
              </div>
            </div>
            <div className="p-8 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowSeasonModal(false)} className="px-6 py-3 text-muted hover:text-white">Cancelar</button>
              <button onClick={handleCreateSeason} disabled={!newSeason.season_number || actionLoading} className="bg-purple-600 px-8 py-3 rounded-xl font-black hover:bg-purple-700 disabled:opacity-30">{actionLoading ? 'Creando...' : 'Crear Temporada'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Capítulo */}
      {showEpisodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121218] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black">Nuevo Capítulo</h2>
              <button onClick={() => setShowEpisodeModal(false)} className="text-muted hover:text-white">✕</button>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Nº</label>
                  <input type="number" value={newEpisode.episode_number} onChange={e => setNewEpisode({ ...newEpisode, episode_number: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600" />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Título</label>
                  <input value={newEpisode.name} onChange={e => setNewEpisode({ ...newEpisode, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-600" placeholder="El inicio de todo" />
                </div>
              </div>
              <p className="text-xs text-muted/60 italic">Guarda el capítulo aquí y añade los links de reproducción después desde la tarjeta del capítulo.</p>
            </div>
            <div className="p-8 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowEpisodeModal(false)} className="px-6 py-3 text-muted hover:text-white">Cancelar</button>
              <button onClick={handleCreateEpisode} disabled={!newEpisode.episode_number || actionLoading} className="bg-purple-600 px-8 py-3 rounded-xl font-black hover:bg-purple-700 disabled:opacity-30">{actionLoading ? 'Guardando...' : 'Guardar Capítulo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
