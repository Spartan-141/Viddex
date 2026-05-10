import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, AlertTriangle, Loader2, ChevronDown,
  Server, Download, Share2, Play, Star, Users, List, X, ChevronRight
} from 'lucide-react'
import { api } from '@/lib/api'
import { tmdbImage, tmdbMovieDetails, tmdbTVDetails } from '@/lib/tmdb'
import VideoPlayer from '@/components/ui/VideoPlayer'

const GENRE_COLORS = ['#e90914', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0ea5e9']

function RatingBadge({ label, score, color = 'white' }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-sm`}
      style={{ borderColor: `${color}33`, background: `${color}11`, color }}>
      {label} <span style={{ color }}>{score}</span>
    </div>
  )
}

function CastCard({ member }) {
  return (
    <div className="flex-shrink-0 w-28 text-center">
      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-white/10 mb-2 border-2 border-white/10">
        <img
          src={member.profile_path ? tmdbImage(member.profile_path, 'w185') : '/placeholder-poster.jpg'}
          alt={member.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = '/placeholder-poster.jpg' }}
        />
      </div>
      <p className="text-xs font-bold text-white leading-tight">{member.name}</p>
      <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{member.character || member.roles?.[0]?.character}</p>
    </div>
  )
}

function StarRating({ score }) {
  if (!score) return null
  const stars = Math.round((score / 10) * 5)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} fill={i <= stars ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth={1.5} />
      ))}
      <span className="text-sm font-black text-amber-400 ml-1">{(score / 2).toFixed(1)}</span>
    </div>
  )
}

export default function WatchPage() {
  const { id, type } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [content, setContent] = useState(null)
  const [tmdbData, setTmdbData] = useState(null)

  const [videoLinks, setVideoLinks] = useState([])
  const [activeLink, setActiveLink] = useState(null)
  const [playing, setPlaying] = useState(false)

  const [seasons, setSeasons] = useState([])
  const [currSeason, setCurrSeason] = useState(null)
  const [currEpisode, setCurrEpisode] = useState(null)

  const [showSidebar, setShowSidebar] = useState(false)
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)

  const castRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => { loadWatchData() }, [id, type])

  async function loadWatchData() {
    setLoading(true); setError(null); setPlaying(false); setShowSidebar(false)
    try {
      if (type === 'pelicula') {
        const movie = await api.movies.get(id)
        setContent(movie)
        const links = movie.video_links || []
        setVideoLinks(links); setActiveLink(links[0] || null)

        if (movie.tmdb_id) {
          try {
            const extra = await tmdbMovieDetails(movie.tmdb_id)
            setTmdbData(extra)
          } catch (e) { console.warn('TMDB data error') }
        }
      } else {
        const seriesData = await api.series.get(id)
        setContent(seriesData)
        setSeasons(seriesData.seasons || [])

        const firstSeason = seriesData.seasons?.[0]
        const firstEp = firstSeason?.episodes?.[0]

        if (firstSeason) setCurrSeason(firstSeason)
        if (firstEp) {
          setCurrEpisode(firstEp)
          const links = firstEp.video_links || []
          setVideoLinks(links); setActiveLink(links[0] || null)
        }

        if (seriesData.tmdb_id) {
          try {
            const extra = await tmdbTVDetails(seriesData.tmdb_id)
            setTmdbData(extra)
          } catch (e) { console.warn('TMDB data error') }
        }
      }
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const handleEpisodeSelect = (season, episode) => {
    setCurrSeason(season)
    setCurrEpisode(episode)
    const links = episode.video_links || []
    setVideoLinks(links)
    setActiveLink(links[0] || null)
    setPlaying(false)
    setShowSidebar(false)
  }

  const getNeighbors = () => {
    if (type === 'pelicula' || !currSeason || !currEpisode || seasons.length === 0) return { prev: null, next: null }
    let prev = null, next = null
    const sIdx = seasons.findIndex(s => s.id === currSeason.id)
    const eIdx = currSeason.episodes?.findIndex(e => e.id === currEpisode.id) ?? -1

    if (eIdx > 0) {
      prev = { season: currSeason, episode: currSeason.episodes[eIdx - 1] }
    } else if (sIdx > 0 && seasons[sIdx - 1].episodes?.length > 0) {
      const pS = seasons[sIdx - 1]
      prev = { season: pS, episode: pS.episodes[pS.episodes.length - 1] }
    }

    if (eIdx !== -1 && eIdx < (currSeason.episodes?.length || 0) - 1) {
      next = { season: currSeason, episode: currSeason.episodes[eIdx + 1] }
    } else if (sIdx !== -1 && sIdx < seasons.length - 1 && seasons[sIdx + 1].episodes?.length > 0) {
      const nS = seasons[sIdx + 1]
      next = { season: nS, episode: nS.episodes[0] }
    }
    return { prev, next }
  }

  const { prev, next } = getNeighbors()

  const scrollCast = (dir) => {
    if (castRef.current) castRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0d0d12] text-white">
      <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0d0d12] text-white p-8">
      <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
      <h1 className="text-2xl font-black mb-2">Contenido no disponible</h1>
      <p className="text-muted text-center mb-8">{error}</p>
      <button onClick={() => navigate(-1)} className="bg-white text-black px-10 py-3 rounded-2xl font-black">Regresar</button>
    </div>
  )

  const genres = tmdbData?.genres || []
  const cast = tmdbData?.credits?.cast || tmdbData?.aggregate_credits?.cast || []
  const tmdbRating = tmdbData?.vote_average || content?.tmdb_rating
  const overview = currEpisode?.overview || content?.overview || tmdbData?.overview
  const runtime = type === 'pelicula' ? tmdbData?.runtime : (currEpisode?.runtime || tmdbData?.episode_run_time?.[0])
  const releaseDate = type === 'pelicula' ? (tmdbData?.release_date || content?.release_date) : (currEpisode?.air_date || tmdbData?.first_air_date)
  const backdropPath = currEpisode?.still_path || tmdbData?.backdrop_path || content?.backdrop_path
  const posterPath = tmdbData?.poster_path || content?.poster_path
  const tagline = tmdbData?.tagline
  const originalTitle = tmdbData?.original_title || tmdbData?.original_name || content?.original_title
  const originalLanguage = tmdbData?.original_language || content?.original_language
  const voteCount = tmdbData?.vote_count
  const trailer = tmdbData?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')

  const isDirectVideo = (url) => {
    if (!url) return false
    if (url.includes('/stream/')) return true // Nuestro Bridge (Telegram)
    if (url.match(/\.(mp4|mkv|mov|m3u8|webm)(\?.*)?$/i)) return true // Videos directos
    return false // Todo lo demás (Vimeus, Voe, Filemoon) se asume como Iframe
  }

  const videoSrc = activeLink?.signed_url || activeLink?.stream_url
  const showIframe = !isDirectVideo(videoSrc)

  const videoOptions = {
    autoplay: true, controls: true, responsive: true, fill: true,
    sources: [{ src: videoSrc, type: 'video/mp4' }],
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
  }

  return (
    <div className="min-h-screen text-white bg-[#0d0d12] relative overflow-x-hidden">
      <div className="px-6 pt-5 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors">
          <ChevronLeft size={18} /> Volver
        </button>
      </div>

      <div className="px-6 pb-6 lg:flex gap-6 relative">
        <div className="hidden lg:block shrink-0 w-64 xl:w-72">
          <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
            <img src={tmdbImage(posterPath, 'w500')} alt={content?.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          {trailer && type === 'pelicula' && (
            <button
              onClick={() => window.open(`https://youtube.com/watch?v=${trailer.key}`, '_blank')}
              className="w-full mt-4 bg-accent hover:bg-accent/80 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Play size={18} /> Ver Tráiler
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {!activeLink ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white font-bold bg-black/60 px-6 py-3 rounded-xl backdrop-blur-md">Sin enlace disponible</p>
              </div>
            ) : showIframe ? (
              <iframe
                src={videoSrc + (videoSrc.includes('?') ? '&autoplay=1&auto=1' : '?autoplay=1&auto=1')}
                title="Reproductor Externo"
                width="100%"
                height="100%"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            ) : !playing ? (
              <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
                <img src={tmdbImage(backdropPath, 'w1280')} alt="backdrop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-accent/90 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <Play size={36} fill="white" className="ml-1.5 opacity-90" />
                  </div>
                </div>
              </div>
            ) : (
              <VideoPlayer key={activeLink?.id} options={videoOptions} onReady={p => { playerRef.current = p }} />
            )}

            {type !== 'pelicula' && (
              <div className="absolute top-4 right-4 z-40">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSidebar(true) }}
                  className="bg-accent/90 hover:bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-lg transition-transform hover:scale-105">
                  Episodios <List size={16} />
                </button>
              </div>
            )}
            
            {type !== 'pelicula' && (
              <div className={`absolute top-0 right-0 bottom-0 w-80 bg-[#121212]/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 flex flex-col ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                  <div className="relative">
                    <button onClick={() => setShowSeasonDropdown(!showSeasonDropdown)} className="flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
                      Temporada {currSeason?.season_number} <ChevronDown size={14} />
                    </button>
                    {showSeasonDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl py-1 w-40 z-50 max-h-60 overflow-y-auto hide-scrollbar">
                        {seasons.map(s => (
                          <button key={s.id} onClick={() => { setCurrSeason(s); setShowSeasonDropdown(false) }}
                            className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-white/10 ${currSeason?.id === s.id ? 'text-accent' : 'text-white'}`}>
                            Temporada {s.season_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowSidebar(false)} className="p-2 text-white/50 hover:text-white cursor-pointer"><X size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto hide-scrollbar touch-pan-y">
                  {currSeason?.episodes?.map((ep) => {
                    const isActive = currEpisode?.id === ep.id
                    const epLinks = ep.video_links || []
                    return (
                      <div key={ep.id} onClick={() => handleEpisodeSelect(currSeason, ep)}
                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors flex gap-4 ${isActive ? 'bg-white/5 border-l-4 border-l-accent' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-accent' : 'text-white'}`}>
                              {currSeason.season_number}x{ep.episode_number}
                            </h4>
                            <span className="text-[10px] text-white/40 whitespace-nowrap">
                              {ep.air_date ? new Date(ep.air_date).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className={`text-sm truncate w-full ${isActive ? 'text-white font-bold' : 'text-white/70'}`}>{ep.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            {epLinks.length > 0 ? (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-black mt-1 inline-block">✓ DISPONIBLE</span>
                            ) : (
                              <span className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded font-bold mt-1 inline-block">Sin video</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {currSeason?.episodes?.length === 0 && (
                    <div className="p-8 text-center text-white/30 text-sm">No hay capítulos</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center bg-[#1a1a1f] p-3 rounded-xl gap-4">
            {type !== 'pelicula' ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => prev && handleEpisodeSelect(prev.season, prev.episode)}
                  disabled={!prev}
                  className="bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 p-3 rounded-lg transition-colors flex items-center justify-center min-w-[48px]">
                  <ChevronLeft size={18} />
                </button>
                <div className="text-center flex-1 sm:min-w-[200px] px-2">
                  <p className="text-xs font-black text-white">{currSeason ? `S${currSeason.season_number}:E${currEpisode?.episode_number || '?'}` : 'Selecciona episodio'}</p>
                  <p className="text-[10px] text-white/60 truncate max-w-[200px] mx-auto">{content?.title}: {currEpisode?.name || ''}</p>
                </div>
                <button
                  onClick={() => next && handleEpisodeSelect(next.season, next.episode)}
                  disabled={!next}
                  className="bg-accent hover:bg-accent/80 disabled:opacity-30 p-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-bold min-w-[100px]">
                  {next ? `S${next.season.season_number}:E${next.episode.episode_number}` : 'Fin'} <ChevronRight size={16} />
                </button>
              </div>
            ) : (
               <div className="flex-1" />
            )}

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors">
                <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
              </button>
              <button className="flex items-center gap-2 bg-accent hover:bg-accent/80 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors">
                <Share2 size={16} /> <span className="hidden sm:inline">Compartir</span>
              </button>
              {trailer && type !== 'pelicula' && (
                <button onClick={() => window.open(`https://youtube.com/watch?v=${trailer.key}`, '_blank')} className="flex items-center gap-2 bg-accent hover:bg-accent/80 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors">
                  <Play size={16} /> Tráiler
                </button>
              )}
            </div>
          </div>
          
          {videoLinks.length > 1 && (
            <div className="mt-6">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Server size={10} /> Fuente de Reproducción
              </label>
              <div className="flex flex-wrap gap-2">
                {videoLinks.map((link, idx) => (
                  <button key={link.id}
                    onClick={() => { setActiveLink(link); setPlaying(false) }}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border ${
                      activeLink?.id === link.id
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-white/5 text-white/60 hover:text-white border-white/5 hover:border-white/10'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeLink?.id === link.id ? 'bg-accent' : 'bg-white/30'}`} />
                    {link.title || `Opcion ${idx + 1}`}
                    <span className="opacity-50 font-black text-[9px] uppercase ml-1">{link.quality} · {link.language}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="px-6 py-4 max-w-7xl border-t border-white/5 mt-6 lg:mt-0 lg:border-t-0">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-1">{content?.title} {releaseDate && `(${releaseDate.slice(0, 4)})`}</h1>
          {originalTitle && originalTitle !== content?.title && <p className="text-white/40 text-sm font-bold">{originalTitle}</p>}
        </div>

        <div className="flex flex-wrap items-start gap-x-12 gap-y-6 text-sm border-t border-b border-white/5 py-6">
          {originalTitle && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Título original</p>
              <p className="font-bold">{originalTitle}</p>
            </div>
          )}
          {tagline && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Eslogan</p>
              <p className="font-bold max-w-xs truncate">{tagline}</p>
            </div>
          )}
          {releaseDate && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Fecha de Estreno</p>
              <p className="font-bold">{releaseDate}</p>
            </div>
          )}
          {genres.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Géneros</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((g, i) => (
                  <span key={g.id} className="font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {tmdbRating && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Rating</p>
              <p className="font-bold">{tmdbRating?.toFixed(1)}</p>
            </div>
          )}
          {runtime && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Duración</p>
              <p className="font-bold">{runtime} min</p>
            </div>
          )}
          {originalLanguage && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Idioma</p>
              <p className="font-bold uppercase">{originalLanguage}</p>
            </div>
          )}
        </div>

        <div className="py-6 space-y-4">
           {tmdbRating && (
            <div className="flex items-center gap-4">
              <RatingBadge label="TMDB" score={tmdbRating?.toFixed(1)} color="#ffffff" />
              <StarRating score={tmdbRating} />
              {voteCount && (
                <div className="flex items-center gap-1.5 text-sm text-white/40 ml-2">
                  <Users size={14} /> <span>{voteCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-white/80 leading-relaxed max-w-5xl font-medium">{overview}</p>
        </div>

        {cast.length > 0 && (
          <div className="py-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest">Elenco</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollCast(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><ChevronLeft size={16}/></button>
                <button onClick={() => scrollCast(1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>
            <div ref={castRef} className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
              {cast.slice(0, 20).map(member => <CastCard key={member.id} member={member} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
