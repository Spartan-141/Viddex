import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Plus, Star, Info, Check } from 'lucide-react'
import { tmdbImage } from '@/lib/tmdb'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

/**
 * MovieCard — Tarjeta de película/serie para carruseles
 */
export default function MovieCard({ item, type = 'movie' }) {
  const [hovered, setHovered] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const { user } = useAuth()

  if (!item) return null

  // Normalización de campos
  const id      = item.id
  const title   = item.title || item.name || item.original_title || item.original_name
  const posterPath = item.poster_path
  const rating  = (item.tmdb_rating || item.vote_average || 0).toFixed(1)
  const date    = item.release_date || item.first_air_date
  const year    = date ? new Date(date).getFullYear() : ''
  const contentType = item.content_type || (item.media_type === 'tv' ? 'series' : 'movie') || type

  // Solo los items con ID alfanumérico (UUID o similar del backend) soportan watchlist
  // Los items puros de TMDB tienen IDs numéricos (ej: 1159559)
  const isBackendItem = isNaN(id) && String(id).length > 10

  const watchPath = contentType === 'movie' 
    ? `/ver/pelicula/${id}` 
    : `/ver/episodio/${item.first_episode_id || id}`
  
  const poster = tmdbImage(posterPath, 'w300')

  // Check watchlist — solo si el item es del backend
  useEffect(() => {
    if (user && isBackendItem) {
      checkWatchlist()
    }
  }, [user, id])

  async function checkWatchlist() {
    try {
      const list = await api.watchlist.list()
      const found = list.find(item => 
        (contentType === 'movie' ? item.movie_id === id : item.series_id === id)
      )
      setInWatchlist(!!found)
    } catch (err) {
      console.error("Watchlist check error:", err)
    }
  }

  async function toggleWatchlist(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert("Debes iniciar sesión para añadir a favoritos")
      return
    }

    setWatchlistLoading(true)
    try {
      if (inWatchlist) {
        // Encontrar el item en la lista para obtener su ID de watchlist
        const list = await api.watchlist.list()
        const found = list.find(item => 
          (contentType === 'movie' ? item.movie_id === id : item.series_id === id)
        )
        if (found) {
          await api.watchlist.remove(found.id)
          setInWatchlist(false)
        }
      } else {
        const payload = {
          [contentType === 'movie' ? 'movie_id' : 'series_id']: id
        }
        await api.watchlist.add(payload)
        setInWatchlist(true)
      }
    } catch (err) {
      console.error("Toggle watchlist error:", err)
    } finally {
      setWatchlistLoading(false)
    }
  }

  return (
    <Link
      to={watchPath}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'block',
        aspectRatio: '2/3',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        background: 'var(--bg-elevated)',
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)',
        transform: hovered ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
        zIndex: hovered ? 20 : 1,
        boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.6)' : 'none',
        flexShrink: 0,
        width: '100%',
        textDecoration: 'none',
      }}
    >
      {/* Poster */}
      <img
        src={poster}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'filter 0.4s ease',
          filter: hovered ? 'brightness(0.3)' : 'brightness(0.9)',
        }}
        loading="lazy"
      />

      {/* Overlay info */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 16,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
      }}>
        <h3 style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'white',
          marginBottom: 4,
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{title}</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={11} fill="#fbbf24" color="#fbbf24" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>{rating}</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{year}</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {/* PlayBtn */}
          <div style={{
            background: 'var(--accent)',
            borderRadius: 8,
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            <Play size={14} fill="white" />
          </div>
          
          {/* WatchlistBtn — solo si el item es del backend */}
          {isBackendItem && (
            <button 
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
              style={{
                background: inWatchlist ? '#22c55e' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              {watchlistLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : inWatchlist ? (
                <Check size={14} />
              ) : (
                <Plus size={14} />
              )}
            </button>
          )}
          
          {/* InfoBtn */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            backdropFilter: 'blur(10px)',
          }}>
            <Info size={14} />
          </div>
        </div>
      </div>

      {/* Ribbon Quality */}
      {item.quality && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          color: 'black',
          fontSize: 9,
          fontWeight: 900,
          padding: '2px 5px',
          borderRadius: 4,
          textTransform: 'uppercase',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        }}>{item.quality}</div>
      )}
    </Link>
  )
}
