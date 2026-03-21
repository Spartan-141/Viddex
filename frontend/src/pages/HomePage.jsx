import { useState, useEffect } from 'react'
import HeroSection from '@/components/ui/HeroSection'
import ContentCarousel from '@/components/ui/ContentCarousel'
import { api } from '@/lib/api'
import { tmdbTrending, tmdbDiscover } from '@/lib/tmdb'

export default function HomePage() {
  const [heroList, setHeroList] = useState([])
  const [sections, setSections] = useState([
    { title: '🎬 Agregados Recientemente', items: [], type: 'movie', loading: true },
    { title: '🔥 Tendencias de la Semana', items: [], type: 'multi', loading: true },
    { title: '⭐ Joyas del Cine', items: [], type: 'movie', loading: true },
    { title: '💥 Acción Imparable', items: [], type: 'movie', loading: true },
    { title: '😂 Comedias para Reír', items: [], type: 'movie', loading: true },
    { title: '👻 Terror y Suspenso', items: [], type: 'movie', loading: true },
  ])

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      // 1. HERO: Blockbusters recientes
      const upcomingTMDB = await tmdbDiscover('movie', {
        'primary_release_date.gte': '2023-01-01', // Margen amplio para garantizar resultados top
        'sort_by': 'popularity.desc'
      })
      const upcomingIds = upcomingTMDB.results.map(m => m.id)
      const availableHero = await api.movies.available({ tmdb_ids: upcomingIds })
      
      // Ordenamos según la popularidad original de TMDB
      const heroSorted = availableHero.sort((a,b) => upcomingIds.indexOf(a.tmdb_id) - upcomingIds.indexOf(b.tmdb_id))
      setHeroList(heroSorted.slice(0, 10).map(m => ({ ...m, media_type: 'movie' })))

      // 2. Agregados Recientemente (Fila 1)
      const recentMovies = await api.movies.recent(15)

      // 3. Tendencias de la Semana (Fila 2)
      const trendingTMDB = await tmdbTrending('all', 'week')
      const trendingMovieIds = trendingTMDB.results.filter(x => x.media_type === 'movie').map(x => x.id)
      const trendingSeriesIds = trendingTMDB.results.filter(x => x.media_type === 'tv').map(x => x.id)
      
      const [availableTrendingMovies, availableTrendingSeries] = await Promise.all([
        trendingMovieIds.length > 0 ? api.movies.available({ tmdb_ids: trendingMovieIds }) : [],
        trendingSeriesIds.length > 0 ? api.series.available({ tmdb_ids: trendingSeriesIds }) : []
      ])
      
      const trendingMix = [
        ...availableTrendingMovies.map(m => ({...m, media_type: 'movie'})),
        ...availableTrendingSeries.map(s => ({...s, media_type: 'series'}))
      ]
      
      const allTrendingIds = trendingTMDB.results.map(x => x.id)
      trendingMix.sort((a,b) => allTrendingIds.indexOf(a.tmdb_id) - allTrendingIds.indexOf(b.tmdb_id))

      // 4. Joyas del Cine (Clásicos)
      const classics = await api.movies.classics(15)

      // 5. Géneros (Híbridos TMDB -> Local)
      const fetchGenreMovies = async (genreId) => {
        const tmdbGenre = await tmdbDiscover('movie', { with_genres: genreId })
        const ids = tmdbGenre.results.map(m => m.id)
        const available = await api.movies.available({ tmdb_ids: ids })
        return available.sort((a,b) => ids.indexOf(a.tmdb_id) - ids.indexOf(b.tmdb_id)).map(m => ({...m, media_type: 'movie'}))
      }

      const [accion, comedia, terror] = await Promise.all([
        fetchGenreMovies(28),
        fetchGenreMovies(35),
        fetchGenreMovies(27)
      ])

      // Actualizar estado UI
      setSections([
        { title: '🎬 Agregados Recientemente', items: recentMovies.map(m=>({...m, media_type:'movie'})), type: 'movie', loading: false },
        { title: '🔥 Tendencias de la Semana', items: trendingMix, type: 'multi', loading: false },
        { title: '⭐ Joyas del Cine', items: classics.map(m=>({...m, media_type:'movie'})), type: 'movie', loading: false },
        { title: '💥 Acción Imparable', items: accion, type: 'movie', loading: false },
        { title: '😂 Comedias para Reír', items: comedia, type: 'movie', loading: false },
        { title: '👻 Terror y Suspenso', items: terror, type: 'movie', loading: false },
      ])

    } catch (error) {
      console.error("Error loading home data:", error)
      setSections(prev => prev.map(s => ({ ...s, loading: false })))
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Slider Dinámico */}
      <HeroSection items={heroList} type={heroList[0]?.media_type === 'tv' ? 'series' : 'movie'} />

      {/* Carruseles Dinámicos */}
      <div style={{ paddingTop: 32 }}>
        {sections.map((sec, idx) => {
          if (!sec.loading && sec.items.length === 0) return null // Ocultar filas vacías (ej: si no hay comedias)
          return (
            <ContentCarousel
              key={idx}
              title={sec.title}
              items={sec.items}
              type={sec.type}
              loading={sec.loading}
            />
          )
        })}
      </div>
    </div>
  )
}
