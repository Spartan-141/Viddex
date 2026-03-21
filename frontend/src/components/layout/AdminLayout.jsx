import { Link, Outlet, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Film, 
  Tv, 
  AlertTriangle, 
  Users, 
  Settings, 
  ChevronLeft,
  ArrowUpRight,
  Unlink
} from 'lucide-react'

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Film, label: 'Películas', path: '/admin/peliculas' },
  { icon: Tv, label: 'Series', path: '/admin/series' },
  { icon: AlertTriangle, label: 'Reportes', path: '/admin/reportes' },
  { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
  { icon: Unlink, label: 'Links Faltantes', path: '/admin/links-faltantes' },
]

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0f0f15] flex flex-col">
        <div className="p-8 border-bottom border-white/5">
          <Link to="/" className="flex items-center gap-2 group mb-6 text-muted hover:text-white transition-colors">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Ir al Sitio</span>
          </Link>
          <h1 className="text-2xl font-black italic">
            VID<span className="text-accent">DEX</span> <span className="text-[10px] not-italic align-top bg-accent px-1.5 py-0.5 rounded ml-1">ADMIN</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-black text-muted uppercase tracking-tighter mb-2">Estado Sistema</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#0f0f15]/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold">Panel de Administración</h2>
          <div className="flex items-center gap-4">
             {/* User profile small (Placeholder) */}
             <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-black">A</div>
          </div>
        </header>

        <div className="p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
