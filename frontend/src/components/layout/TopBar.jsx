import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, User, X, LogIn, LogOut, Shield, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function TopBar({ sidebarCollapsed, setMobileMenuOpen }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  // Foco automático al abrir buscador
  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus()
  }, [searchOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    <header
      className="glass-dark"
      style={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '72px' : 'var(--sidebar-offset)',
        right: 0,
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
        transition: `left var(--transition)`,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Mobile Menu Trigger + Page title placeholder */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <button 
          type="button"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Center/Right: Search + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: searchOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: searchOpen ? '1px solid var(--border)' : '1px solid transparent',
            borderRadius: 'var(--radius)',
            padding: searchOpen ? '6px 12px' : '6px',
            transition: 'all 0.25s ease',
            width: searchOpen ? 280 : 38,
          }}
        >
          <button
            type="button"
            onClick={() => !searchOpen ? setSearchOpen(true) : handleSearch({ preventDefault: () => {} })}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0,
            }}
          >
            <Search size={19} />
          </button>

          {searchOpen && (
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar contenido..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: 14,
              }}
            />
          )}

          {searchOpen && (
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setQuery('') }}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: 0,
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Notifications */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-all relative"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent border-2 border-black" />
        </button>

        {/* User profile / Login */}
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-black text-xs overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  profile?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <span className="text-xs font-bold text-white/80">{profile?.username || 'Usuario'}</span>
            </button>

            {userMenuOpen && (
              <div className="absolute top-[calc(100%+10px)] right-0 w-48 bg-[#121218] border border-white/10 rounded-2xl shadow-2xl p-2 animate-scale-in">
                {profile?.role === 'admin' && (
                  <>
                    <Link 
                      to="/admin" 
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-accent/10 hover:bg-accent/20 rounded-xl transition-colors text-sm text-accent font-bold"
                    >
                      <Shield size={16} /> Panel Admin
                    </Link>
                    <div className="h-px bg-white/5 my-1 mx-2" />
                  </>
                )}
                <Link 
                  to="/perfil" 
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-sm text-muted hover:text-white"
                >
                  <User size={16} /> Mi Perfil
                </Link>
                <div className="h-px bg-white/5 my-1 mx-2" />
                <button 
                  onClick={() => { signOut(); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors text-sm text-red-500 font-medium"
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 bg-accent hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent/20"
          >
            <LogIn size={18} />
            <span>Entrar</span>
          </Link>
        )}
      </div>
    </header>
  )
}
