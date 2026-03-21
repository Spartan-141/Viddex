import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Info, Volume2, VolumeX, Star } from 'lucide-react'
import { tmdbImage } from '@/lib/tmdb'

/**
 * HeroSlider — Banner principal dinámico
 * Rota entre las últimas películas cada cierto tiempo y muestra miniaturas.
 */
export default function HeroSection({ items = [], type = 'movie' }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Si pasan un solo item por compatibilidad
  const validItems = Array.isArray(items) && items.length > 0 ? items : (items ? [items] : [])

  useEffect(() => {
    setIsLoaded(false)
    const t = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(t)
  }, [currentIndex])

  useEffect(() => {
    if (validItems.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validItems.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [validItems.length])

  if (validItems.length === 0) return <HeroSkeleton />

  const item = validItems[currentIndex]
  const title = item.title || item.name || item.original_title || 'Sin título'
  const backdrop = tmdbImage(item.backdrop_path, 'original')
  const rating = (item.tmdb_rating || item.vote_average || 0).toFixed(1)
  const id = item.id
  const contentType = item.content_type || (type === 'series' ? 'series' : 'movie')

  const watchUrl = contentType === 'movie' 
    ? `/ver/pelicula/${id}` 
    : `/ver/episodio/${item.first_episode_id || id}`

  // Obtener los 4 siguientes elementos para la cuadrícula
  const getNextItems = () => {
    if (validItems.length <= 1) return []
    const next = []
    for (let i = 1; i <= 4; i++) {
      if (validItems.length > i) {
        next.push(validItems[(currentIndex + i) % validItems.length])
      }
    }
    return next
  }

  const handleThumbClick = (clickedItem) => {
    const idx = validItems.findIndex(i => i.id === clickedItem.id)
    if (idx !== -1) setCurrentIndex(idx)
  }

  return (
    <section 
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        background: `url(${backdrop}) center/cover no-repeat`,
        overflow: 'hidden',
        transition: 'background-image 0.8s ease',
      }}
      className="animate-fade-in h-[70vh] md:h-[85vh]"
    >
      {/* Gradients: Reforzados para fondos claros */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(10,10,15,1) 0%, rgba(10,10,15,0.85) 35%, rgba(10,10,15,0.4) 60%, transparent 100%)',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.6) 30%, transparent 70%)',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,10,15,0.2)', // Overlay ligero constante
        zIndex: 1,
      }} />

      <div className="w-full max-w-[1800px] mx-auto relative z-10 flex px-[5%] xl:px-[8%] justify-between items-center mt-10">
        
        {/* Left Content (Text and Buttons) */}
        <div style={{
          maxWidth: 650,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          opacity: isLoaded ? 1 : 0,
          transition: 'transform 0.6s ease, opacity 0.6s ease',
        }}>
          {/* Action Button Prominente */}
          <Link
            to={watchUrl}
            className="inline-flex mb-8 bg-accent text-white border-none rounded-xl px-8 py-3.5 text-base font-black items-center gap-2 shadow-[0_0_40px_rgba(233,9,20,0.5)] hover:scale-105 transition-transform"
          >
            Ver ahora
          </Link>

          {/* Title - Con sombra de texto para legibilidad */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-4 tracking-tighter"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' }}>
            {title} {item.release_date && <span className="text-white/50 font-bold text-3xl">({item.release_date.slice(0, 4)})</span>}
          </h1>

          {/* Description - Con sombra suave */}
          <p className="text-base md:text-lg text-white/90 mb-6 leading-relaxed line-clamp-3 font-medium max-w-[90%]"
             style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {item.overview || 'Un viaje épico a través de las fronteras de la realidad y el tiempo.'}
          </p>

          {/* Badges / Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8">
            <div className="flex items-center gap-2 text-sm font-bold text-white/90"
                 style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
               {['Acción', 'Suspense', 'Drama'].map((g, i) => (
                 <span key={i} className="flex items-center gap-2">
                   {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />}
                   {g}
                 </span>
               ))}
            </div>
            
            <div className="w-px h-4 bg-white/30" />

            {/* Rating */}
            <div className="flex items-center gap-2 border border-white/20 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-black shadow-lg shadow-black/20">
              <span className="text-white/70">TMDB</span>
              <span className="text-white">{rating}</span>
            </div>
          </div>

        </div>

        {/* Right Content (Thumbnails Grid) */}
        <div className="hidden lg:block w-[400px] xl:w-[500px]">
          <div className="grid grid-cols-2 gap-4">
            {getNextItems().map((thumb, idx) => (
              <div 
                key={thumb.id}
                onClick={() => handleThumbClick(thumb)}
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group shadow-2xl transition-transform hover:scale-105 border-2 border-transparent hover:border-white/50"
              >
                <img 
                  src={tmdbImage(thumb.backdrop_path, 'w500')} 
                  alt={thumb.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-bold truncate drop-shadow-md">
                    {thumb.title || thumb.name || thumb.original_title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Barra de Progreso Inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-20">
        <div 
          key={currentIndex} 
          className="h-full bg-accent"
          style={{ 
            width: '100%', 
            animation: 'progress 8s linear' 
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </section>
  )
}

function HeroSkeleton() {
  return (
    <div style={{ 
      width: '100%', 
      background: 'var(--bg-elevated)',
      display: 'flex', alignItems: 'center', padding: '0 8%'
    }} className="animate-shimmer h-[70vh] md:h-[85vh]">
      <div style={{ maxWidth: 600, width: '100%' }}>
        <div style={{ height: 20, width: 100, background: 'rgba(255,255,255,0.05)', marginBottom: 20, borderRadius: 4 }} />
        <div style={{ height: 60, width: '80%', background: 'rgba(255,255,255,0.05)', marginBottom: 20, borderRadius: 8 }} />
        <div style={{ height: 100, width: '100%', background: 'rgba(255,255,255,0.05)', marginBottom: 40, borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ height: 50, width: 160, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
          <div style={{ height: 50, width: 160, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}
