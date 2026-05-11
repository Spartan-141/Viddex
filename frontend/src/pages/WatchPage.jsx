import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertTriangle, Play, Download, Share2, Star, Users, Server, Check, List, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { tmdbImage, tmdbMovieDetails, tmdbTVDetails } from '@/lib/tmdb'
import VideoPlayer from '@/components/ui/VideoPlayer'
import { useAuth } from '@/context/AuthContext'

export default function WatchPage() {
  const { id, type } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [content, setContent] = useState(null)
  const [tmdbData, setTmdbData] = useState(null)
  const [videoLinks, setVideoLinks] = useState([])
  const [activeLink, setActiveLink] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [currSeason, setCurrSeason] = useState(null)
  const [currEpisode, setCurrEpisode] = useState(null)
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const playerRef = useRef(null)
  const castRef = useRef(null)

  useEffect(() => { loadData() }, [id, type])

  async function loadData() {
    setLoading(true); setError(null); setPlaying(false)
    try {
      if (type === 'pelicula') {
        const movie = await api.movies.get(id)
        setContent(movie)
        const links = movie.video_links || []
        setVideoLinks(links); setActiveLink(links[0] || null)
        if (movie.tmdb_id) {
          try { setTmdbData(await tmdbMovieDetails(movie.tmdb_id)) } catch {}
        }
      } else {
        const s = await api.series.get(id)
        setContent(s); setSeasons(s.seasons || [])
        const fs = s.seasons?.[0]; const fe = fs?.episodes?.[0]
        if (fs) setCurrSeason(fs)
        if (fe) { setCurrEpisode(fe); const l = fe.video_links||[]; setVideoLinks(l); setActiveLink(l[0]||null) }
        if (s.tmdb_id) { try { setTmdbData(await tmdbTVDetails(s.tmdb_id)) } catch {} }
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const selectEpisode = (season, ep) => {
    setCurrSeason(season); setCurrEpisode(ep)
    const l = ep.video_links||[]; setVideoLinks(l); setActiveLink(l[0]||null); setPlaying(false)
  }

  const refreshLinks = async () => {
    if (!content) return
    setRefreshing(true)
    try {
      const year = releaseDate?.slice(0,4)
      const res = await api.scraper.cuevana(content.title, year)
      if (res?.url) {
        await api.movies.addLink(content.id, { stream_url: res.url, quality:'HD', language:'LAT', title:'Vimeus (Auto)' })
        await loadData()
      }
    } catch {}
    finally { setRefreshing(false) }
  }

  const getNeighbors = () => {
    if (type==='pelicula'||!currSeason||!currEpisode) return {prev:null,next:null}
    const si = seasons.findIndex(s=>s.id===currSeason.id)
    const ei = currSeason.episodes?.findIndex(e=>e.id===currEpisode.id)??-1
    let prev=null,next=null
    if (ei>0) prev={season:currSeason,episode:currSeason.episodes[ei-1]}
    else if (si>0&&seasons[si-1].episodes?.length) { const ps=seasons[si-1]; prev={season:ps,episode:ps.episodes[ps.episodes.length-1]} }
    if (ei!==-1&&ei<(currSeason.episodes?.length||0)-1) next={season:currSeason,episode:currSeason.episodes[ei+1]}
    else if (si<seasons.length-1&&seasons[si+1].episodes?.length) { const ns=seasons[si+1]; next={season:ns,episode:ns.episodes[0]} }
    return {prev,next}
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#07090f'}}><Loader2 size={48} style={{color:'#2563eb',animation:'spin 1s linear infinite'}} /></div>
  if (error) return <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#07090f',color:'white',gap:16}}><AlertTriangle size={48} style={{color:'#f59e0b'}} /><p>{error}</p><button onClick={()=>navigate(-1)} style={{background:'white',color:'black',padding:'10px 28px',borderRadius:12,fontWeight:800,border:'none',cursor:'pointer'}}>Volver</button></div>

  const genres = tmdbData?.genres||[]
  const cast = tmdbData?.credits?.cast||tmdbData?.aggregate_credits?.cast||[]
  const rating = tmdbData?.vote_average||content?.tmdb_rating
  const overview = currEpisode?.overview||content?.overview||tmdbData?.overview
  const runtime = type==='pelicula' ? tmdbData?.runtime : (currEpisode?.runtime||tmdbData?.episode_run_time?.[0])
  const releaseDate = type==='pelicula' ? (tmdbData?.release_date||content?.release_date) : (currEpisode?.air_date||tmdbData?.first_air_date)
  const backdropPath = currEpisode?.still_path || tmdbData?.backdrop_path || content?.backdrop_path
  const posterPath = tmdbData?.poster_path || content?.poster_path
  const originalTitle = tmdbData?.original_title || tmdbData?.original_name || content?.original_title
  const trailer = tmdbData?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
  
  // Usamos w1280 para mayor compatibilidad y velocidad que 'original'
  const backdropUrl = backdropPath ? tmdbImage(backdropPath, 'w1280') : null
  
  const videoSrc = activeLink?.signed_url || activeLink?.stream_url
  const isDirectVideo = url => url&&(url.includes('/stream/')||url.match(/\.(mp4|mkv|mov|m3u8|webm)(\?.*)?$/i))
  const showIframe = !isDirectVideo(videoSrc)
  const {prev,next} = getNeighbors()

  return (
    <div style={{minHeight:'100vh',color:'white',background:'#07090f',position:'relative',overflowX:'hidden'}}>

      {backdropUrl && (
        <>
          {/* Capa 1: Imagen visible, sin blur, recortada al tercio superior */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: '65vh',
            zIndex: 0,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            opacity: 0.55,
          }} />
          {/* Capa 2: Gradiente lateral — oscurece los bordes izquierdo/derecho */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: '65vh',
            zIndex: 1,
            background: 'linear-gradient(to right, rgba(7,9,15,0.6) 0%, transparent 30%, transparent 70%, rgba(7,9,15,0.6) 100%)',
          }} />
          {/* Capa 3: Gradiente hacia abajo — imagen desaparece suavemente */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: '65vh',
            zIndex: 2,
            background: 'linear-gradient(to bottom, rgba(7,9,15,0.15) 0%, rgba(7,9,15,0.5) 60%, #07090f 100%)',
          }} />
          {/* Capa 4: Fondo sólido para el resto de la página */}
          <div style={{
            position: 'fixed',
            top: '65vh', left: 0, right: 0, bottom: 0,
            zIndex: 0,
            background: '#07090f',
          }} />
        </>
      )}

      <div style={{position:'relative',zIndex:10,padding:'0 24px 60px',maxWidth:1200,margin:'0 auto'}}>

        {/* ── TOP NAV ── */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0 16px'}}>
          <button onClick={()=>navigate(-1)} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',padding:'8px 16px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            <ChevronLeft size={16}/> Volver
          </button>
          <button onClick={refreshLinks} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:6,background:'transparent',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)',padding:'6px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:0.5}}>
            {refreshing?<Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/>:<RefreshCw size={11}/>}
            {refreshing?'Buscando...':'¿Link roto?'}
          </button>
        </div>

        {/* ── HERO ROW: poster + player ── */}
        <div style={{display:'flex',gap:18,alignItems:'stretch',marginBottom:20}}>

          {/* LEFT: Poster + Tráiler (columna fija) */}
          <div style={{width:200,flexShrink:0,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{flex:1,borderRadius:14,overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.06)'}}>
              {posterPath
                ? <img src={tmdbImage(posterPath,'w500')} alt={content?.title} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                : <div style={{width:'100%',height:'100%',background:'rgba(255,255,255,0.05)'}} />
              }
            </div>
            {trailer && (
              <button onClick={()=>window.open(`https://youtube.com/watch?v=${trailer.key}`,'_blank')} style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',borderRadius:10,padding:'11px 0',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(37,99,235,0.15)';e.currentTarget.style.color='white'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.7)'}}>
                <Play size={14} fill="currentColor"/> Ver Tráiler
              </button>
            )}
            {!trailer && <div style={{flexShrink:0,height:44}} />}
          </div>

          {/* RIGHT: Player — misma altura que columna izquierda */}
          <div style={{flex:1,display:'flex',flexDirection:'column',borderRadius:14,overflow:'hidden',background:'#000',boxShadow:'0 24px 60px rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.05)',position:'relative'}}>
            {!activeLink ? (
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24,textAlign:'center'}}>
                <AlertTriangle size={40} style={{color:'#f59e0b',opacity:0.5}} />
                <div><p style={{fontWeight:800,marginBottom:6}}>Sin enlace disponible</p><p style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>El link expiró o no existe.</p></div>
                <button onClick={refreshLinks} style={{background:'#2563eb',color:'white',border:'none',padding:'10px 24px',borderRadius:10,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <RefreshCw size={14}/> Buscar en Vimeos
                </button>
              </div>
            ) : showIframe ? (
              <iframe src={videoSrc+(videoSrc.includes('?')?'&autoplay=1&auto=1':'?autoplay=1&auto=1')} title="Player" style={{flex:1,width:'100%',border:'none'}} allow="autoplay; fullscreen" sandbox="allow-scripts allow-same-origin allow-presentation" />
            ) : !playing ? (
              <div onClick={()=>setPlaying(true)} style={{flex:1,cursor:'pointer',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}
                className="group">
                {backdropPath && <img src={tmdbImage(backdropPath,'w1280')} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />}
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)'}} />
                <div style={{position:'relative',width:72,height:72,borderRadius:'50%',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',border:'2px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.25s'}}>
                  <Play size={32} fill="white" style={{marginLeft:4}} />
                </div>
              </div>
            ) : (
              <div style={{flex:1}}><VideoPlayer key={activeLink?.id} options={{autoplay:true,controls:true,responsive:true,fill:true,sources:[{src:videoSrc,type:'video/mp4'}],playbackRates:[0.5,1,1.25,1.5,2]}} onReady={p=>{playerRef.current=p}} /></div>
            )}

            {/* Episode nav overlay for series */}
            {type!=='pelicula' && (
              <div style={{position:'absolute',top:10,right:10,display:'flex',gap:6,zIndex:20}}>
                <button onClick={()=>setShowSeasonDropdown(!showSeasonDropdown)} style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)',color:'white',padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                  S{currSeason?.season_number}:E{currEpisode?.episode_number} <ChevronDown size={12}/>
                </button>
                {showSeasonDropdown && (
                  <div style={{position:'absolute',top:'100%',right:0,marginTop:4,background:'rgba(18,18,28,0.97)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:8,minWidth:280,maxHeight:320,overflowY:'auto',zIndex:50,boxShadow:'0 20px 60px rgba(0,0,0,0.6)'}}>
                    <div style={{display:'flex',gap:6,marginBottom:8,paddingBottom:8,borderBottom:'1px solid rgba(255,255,255,0.08)',flexWrap:'wrap'}}>
                      {seasons.map(s=>(
                        <button key={s.id} onClick={()=>{setCurrSeason(s);setShowSeasonDropdown(false)}} style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:700,border:'1px solid',cursor:'pointer',background:currSeason?.id===s.id?'#2563eb':'transparent',borderColor:currSeason?.id===s.id?'#2563eb':'rgba(255,255,255,0.15)',color:currSeason?.id===s.id?'white':'rgba(255,255,255,0.6)'}}>
                          T{s.season_number}
                        </button>
                      ))}
                    </div>
                    {currSeason?.episodes?.map(ep=>{
                      const isActive=currEpisode?.id===ep.id
                      return (
                        <div key={ep.id} onClick={()=>{selectEpisode(currSeason,ep);setShowSeasonDropdown(false)}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,cursor:'pointer',background:isActive?'rgba(37,99,235,0.15)':'transparent',marginBottom:2}}>
                          <div style={{width:26,height:26,borderRadius:6,background:isActive?'#2563eb':'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{ep.episode_number}</div>
                          <span style={{fontSize:12,fontWeight:isActive?700:500,color:isActive?'white':'rgba(255,255,255,0.6)',truncate:true}}>{ep.name}</span>
                          {ep.video_links?.length>0&&<span style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:'#22c55e',flexShrink:0}} />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── TITLE + ACTIONS ── */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:20,marginBottom:28}}>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontSize:28,fontWeight:900,lineHeight:1.2,margin:'0 0 4px'}}>{content?.title}{releaseDate&&` (${releaseDate.slice(0,4)})`}</h1>
            {originalTitle&&originalTitle!==content?.title&&<p style={{color:'rgba(255,255,255,0.35)',fontSize:13,fontWeight:600,margin:'0 0 10px'}}>{originalTitle}</p>}
            <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:12}}>
              {rating&&<div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.25)',padding:'4px 10px',borderRadius:8}}>
                <Star size={13} fill="#f59e0b" style={{color:'#f59e0b'}} /><span style={{fontSize:13,fontWeight:800,color:'#f59e0b'}}>{rating.toFixed(1)}</span>
              </div>}
              {runtime&&<span style={{fontSize:13,color:'rgba(255,255,255,0.4)',fontWeight:600}}>{runtime} min</span>}
              {genres.slice(0,3).map(g=><span key={g.id} style={{fontSize:12,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.06)',padding:'3px 10px',borderRadius:6,fontWeight:600}}>{g.name}</span>)}
            </div>
            {type!=='pelicula'&&(
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}>
                <button onClick={()=>prev&&selectEpisode(prev.season,prev.episode)} disabled={!prev} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:prev?'white':'rgba(255,255,255,0.2)',padding:'6px 10px',borderRadius:8,cursor:prev?'pointer':'not-allowed',display:'flex',alignItems:'center'}}><ChevronLeft size={15}/></button>
                <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.6)'}}>S{currSeason?.season_number}:E{currEpisode?.episode_number} — {currEpisode?.name}</span>
                <button onClick={()=>next&&selectEpisode(next.season,next.episode)} disabled={!next} style={{background:next?'#2563eb':'rgba(255,255,255,0.05)',border:'none',color:next?'white':'rgba(255,255,255,0.2)',padding:'6px 10px',borderRadius:8,cursor:next?'pointer':'not-allowed',display:'flex',alignItems:'center'}}><ChevronRight size={15}/></button>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            {user&&<button style={{display:'flex',alignItems:'center',gap:7,background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93c5fd',padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}><List size={15}/>Mi Lista</button>}
            <button style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}><Download size={15}/>Descargar</button>
            <button style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}><Share2 size={15}/>Compartir</button>
          </div>
        </div>

        {/* ── SERVERS ── */}
        {videoLinks.length>1&&(
          <div style={{marginBottom:32}}>
            <p style={{fontSize:11,fontWeight:800,color:'rgba(255,255,255,0.3)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><Server size={11}/>Fuente de reproducción</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {videoLinks.map((l,i)=>(
                <button key={l.id} onClick={()=>{setActiveLink(l);setPlaying(false)}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px',borderRadius:10,border:'1px solid',cursor:'pointer',transition:'all 0.2s',background:activeLink?.id===l.id?'rgba(37,99,235,0.12)':'rgba(255,255,255,0.04)',borderColor:activeLink?.id===l.id?'rgba(37,99,235,0.4)':'rgba(255,255,255,0.07)',color:activeLink?.id===l.id?'#93c5fd':'rgba(255,255,255,0.55)'}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:activeLink?.id===l.id?'#2563eb':'rgba(255,255,255,0.25)',boxShadow:activeLink?.id===l.id?'0 0 8px #2563eb':''}} />
                  <span style={{fontSize:13,fontWeight:700}}>{l.title||`Opción ${i+1}`}</span>
                  <span style={{fontSize:10,fontWeight:800,opacity:0.5,textTransform:'uppercase'}}>{l.quality}·{l.language}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SYNOPSIS ── */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:28,marginBottom:32}}>
          <h3 style={{fontSize:15,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:14}}>Sinopsis</h3>
          <p style={{color:'rgba(255,255,255,0.65)',lineHeight:1.8,fontSize:14,maxWidth:900}}>{overview||'Sinopsis no disponible.'}</p>
        </div>

        {/* ── CAST ── */}
        {cast.length>0&&(
          <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:28}}>
            <h3 style={{fontSize:15,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:18,display:'flex',alignItems:'center',gap:8}}><Users size={14}/>Reparto</h3>
            <div ref={castRef} style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:12}} className="hide-scrollbar">
              {cast.slice(0,15).map(m=>(
                <div key={m.id} style={{flexShrink:0,width:100,textAlign:'center'}}>
                  <div style={{width:100,height:150,borderRadius:10,overflow:'hidden',background:'rgba(255,255,255,0.04)',marginBottom:8,border:'1px solid rgba(255,255,255,0.06)'}}>
                    <img src={m.profile_path?tmdbImage(m.profile_path,'w185'):'/placeholder-poster.jpg'} alt={m.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.src='/placeholder-poster.jpg'}} />
                  </div>
                  <p style={{fontSize:11,fontWeight:700,color:'white',lineHeight:1.3,margin:0}}>{m.name}</p>
                  <p style={{fontSize:10,color:'rgba(255,255,255,0.35)',margin:'3px 0 0',lineHeight:1.3}}>{m.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
