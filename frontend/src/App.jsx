import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import { SeriesPageRoute, AnimePageRoute } from './pages/SeriesPage'
import SearchPage from './pages/SearchPage'
import WatchPage from './pages/WatchPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import WatchlistPage from './pages/WatchlistPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminMovies from './pages/admin/Movies'
import AdminSeries from './pages/admin/Series'
import Reports from './pages/admin/Reports'
import SeriesDetail from './pages/admin/SeriesDetail'
import MissingLinks from './pages/admin/MissingLinks'
import { AuthProvider, useAuth } from './context/AuthContext'

/**
 * ProtectedRoute — Componente para proteger rutas privadas
 */
const LoadingSpinner = () => {
  const [showClear, setShowClear] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setShowClear(true), 5000)
    return () => clearTimeout(t)
  }, [])
  const clearSession = async () => {
    // Limpiar localStorage de Supabase y recargar
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k))
    window.location.href = '/'
  }
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      {showClear && (
        <div className="text-center">
          <p className="text-white/40 text-xs mb-3">La carga está tardando demasiado...</p>
          <button
            onClick={clearSession}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔄 Limpiar sesión y recargar
          </button>
        </div>
      )}
    </div>
  )
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

/**
 * AdminRoute — Protege rutas exclusivas para administradores
 */
const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h1 className="text-3xl font-black mb-4">Acceso Denegado</h1>
        <p className="text-muted max-w-md mb-8">
          Tu cuenta no tiene privilegios de administrador para acceder a esta sección. 
          Contacta con el soporte técnico de VIDDEX.
        </p>
        <Navigate to="/" replace className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
          Volver al Inicio
        </Navigate>
        {/* Usamos Navigate pero en un botón real de retorno */}
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    )
  }
  return children
}

function PlaceholderPage({ title }) {
  return (
    <div className="p-12 text-center text-white">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-muted">Esta sección estará disponible próximamente.</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas de Autenticación (Sin Layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/* Rutas con Layout Principal */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="peliculas" element={<MoviesPage />} />
            <Route path="series" element={<SeriesPageRoute />} />
            <Route path="anime" element={<AnimePageRoute />} />
            <Route path="buscar" element={<SearchPage />} />
            
            <Route path="ver/:type/:id" element={<WatchPage />} />

            {/* Rutas Protegidas */}
            <Route path="perfil" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="mi-lista" element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            } />

            {/* Placeholders */}
            <Route path="actores" element={<PlaceholderPage title="👥 Actores" />} />
            <Route path="colecciones" element={<PlaceholderPage title="📁 Colecciones" />} />
            <Route path="contacto" element={<PlaceholderPage title="✉️ Contacto" />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Rutas de Administración (Layout Dedicado) */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="peliculas" element={<AdminMovies />} />
            <Route path="series" element={<AdminSeries />} />
            <Route path="series/:id" element={<SeriesDetail />} />
            <Route path="reportes" element={<Reports />} />
            <Route path="usuarios" element={<PlaceholderPage title="👥 Gestión de Usuarios" />} />
            <Route path="links-faltantes" element={<MissingLinks />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
