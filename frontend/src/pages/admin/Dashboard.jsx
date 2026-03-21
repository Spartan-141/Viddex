import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Film, Tv, AlertTriangle, Users, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    series: 0,
    reports: 0,
    users: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const data = await api.admin.stats()
      setStats({
        movies: data.total_movies || 0,
        series: data.total_series || 0,
        reports: data.pending_reports || 0,
        users: data.total_users || 0
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    }
  }

  const cards = [
    { label: 'Películas', value: stats.movies, icon: Film, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Series / Animes', value: stats.series, icon: Tv, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Reportes Pendientes', value: stats.reports, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Usuarios Totales', value: stats.users, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="animate-fade-in space-y-10">
      <div>
        <h1 className="text-3xl font-black mb-2">Bienvenido, Admin</h1>
        <p className="text-muted font-medium">Aquí tienes un resumen del estado actual de VIDDEX.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-lg">
                  <TrendingUp size={12} />
                  +0%
                </div>
              </div>
              <p className="text-4xl font-black mb-1">{card.value}</p>
              <p className="text-muted text-xs font-bold uppercase tracking-widest">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            <p className="text-muted text-sm italic">Próximamente: Log de acciones administrativas...</p>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">Reportes Críticos</h3>
          <div className="space-y-4">
            {stats.reports === 0 ? (
              <p className="text-green-500 text-sm font-bold flex items-center gap-2">
                ✅ No hay reportes pendientes.
              </p>
            ) : (
              <p className="text-red-500 text-sm font-bold flex items-center gap-2 cursor-pointer hover:underline">
                ⚠️ Tienes {stats.reports} reportes que requieren atención.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
