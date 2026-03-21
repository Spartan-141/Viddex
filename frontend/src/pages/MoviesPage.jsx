import { useState, useEffect } from 'react'
import ContentCarousel from '@/components/ui/ContentCarousel'
import { api } from '@/lib/api'
import { tmdbDiscover } from '@/lib/tmdb'

export default function MoviesPage() {
  const [sections, setSections] = useState([
    { title: '📅 Estrenos Recientes', items: [], loading: true },
    { title: '🔥 Más Populares', items: [], loading: true },
    { title: '🍿 Películas de Acción', items: [], loading: true, genreId: 28 },
    { title: '🎭 Dramas Imperdibles', items: [], loading: true, genreId: 18 },
  ])

  useEffect(() => {
    loadAllMovies()
  }, [])

  async function loadAllMovies() {
    try {
      // 1. Cargar desde la base de datos local
      const dbMovies = await api.movies.list({ limit: 20 })

      // 2. Combinar con TMDB para secciones por género
      const updatedSections = await Promise.all(sections.map(async (sec) => {
        let items = []
        
        if (sec.genreId) {
          const res = await tmdbDiscover('movie', { with_genres: sec.genreId })
          items = res.results.slice(0, 10)
        } else if (sec.title.includes('Estrenos')) {
          items = dbMovies?.length ? dbMovies.slice(0, 10) : (await tmdbDiscover('movie', { sort_by: 'primary_release_date.desc' })).results.slice(0, 10)
        } else {
          items = dbMovies?.length ? dbMovies.slice(10, 20) : (await tmdbDiscover('movie')).results.slice(0, 10)
        }

        return { ...sec, items, loading: false }
      }))

      setSections(updatedSections)

    } catch (error) {
      console.error("Error loading movies:", error)
      setSections(prev => prev.map(s => ({ ...s, loading: false })))
    }
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: 32 }}>
      <div style={{ padding: '0 32px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          🎬 Películas
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Todo el catálogo de películas disponibles
        </p>
      </div>

      {sections.map((sec, idx) => (
        <ContentCarousel 
          key={idx} 
          title={sec.title} 
          items={sec.items} 
          type="movie" 
          loading={sec.loading} 
        />
      ))}
    </div>
  )
}
