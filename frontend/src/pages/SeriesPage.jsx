import { useState, useEffect } from 'react'
import ContentCarousel from '@/components/ui/ContentCarousel'
import { api } from '@/lib/api'
import { tmdbDiscover, tmdbTrending } from '@/lib/tmdb'

function SeriesPage({ contentType = 'series', emoji = '📺', label = 'Series' }) {
  const [sections, setSections] = useState([
    { title: `📅 ${label} nuevos`, items: [], loading: true },
    { title: '🔥 Tendencias actuales', items: [], loading: true },
    { title: '⛩️ Recién llegados de Japón', items: [], loading: true, origin: 'JP' },
  ])

  useEffect(() => {
    loadAllSeries()
  }, [contentType])

  async function loadAllSeries() {
    try {
      // 1. Cargar desde la base de datos local
      const dbSeries = await api.series.list({ content_type: contentType, limit: 20 })

      const updatedSections = await Promise.all(sections.map(async (sec) => {
        let items = []
        
        if (sec.origin === 'JP' || contentType === 'anime') {
          const res = await tmdbDiscover('tv', { with_original_language: 'ja' })
          items = res.results.slice(0, 10)
        } else if (sec.title.includes('nuevos')) {
          items = dbSeries?.length ? dbSeries.slice(0, 10) : (await tmdbDiscover('tv', { sort_by: 'first_air_date.desc' })).results.slice(0, 10)
        } else {
          items = dbSeries?.length ? dbSeries.slice(10, 20) : (await tmdbTrending('tv')).results.slice(0, 10)
        }

        return { ...sec, items, loading: false }
      }))

      setSections(updatedSections)
    } catch (error) {
      console.error("Error loading series:", error)
      setSections(prev => prev.map(s => ({ ...s, loading: false })))
    }
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: 32 }}>
      <div style={{ padding: '0 32px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {emoji} {label}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Todo el catálogo de {label.toLowerCase()} disponibles
        </p>
      </div>

      {sections.map((sec, idx) => (
        <ContentCarousel 
          key={idx} 
          title={sec.title} 
          items={sec.items} 
          type="series" 
          loading={sec.loading} 
        />
      ))}
    </div>
  )
}

export function SeriesPageRoute()  { return <SeriesPage contentType="series" emoji="📺" label="Series"  /> }
export function AnimePageRoute()   { return <SeriesPage contentType="anime"  emoji="✨" label="Animes"  /> }
