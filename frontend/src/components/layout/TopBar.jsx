import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, User, X, LogIn, LogOut, Shield, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function TopBar({ setMobileMenuOpen }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

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
    <header className="topbar-root glass-dark">
      {/* ── Izquierda: botón hamburguesa (solo móvil) ── */}
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-hamburger"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Derecha: acciones ── */}
      <div className="topbar-actions">
        {/* Buscador (visible solo en escritorio) */}
        <form
          onSubmit={handleSearch}
          className="topbar-search-form topbar-desktop-only"
          style={{
            width: searchOpen ? 260 : 38,
            background: searchOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: searchOpen ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
          }}
        >
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => !searchOpen ? setSearchOpen(true) : handleSearch({ preventDefault: () => {} })}
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>
          {searchOpen && (
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar contenido..."
              className="topbar-search-input"
            />
          )}
          {searchOpen && (
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => { setSearchOpen(false); setQuery('') }}
              aria-label="Cerrar buscador"
            >
              <X size={15} />
            </button>
          )}
        </form>

        {/* Notificaciones */}
        <button className="topbar-icon-btn topbar-icon-circle" aria-label="Notificaciones">
          <Bell size={17} />
          <span className="topbar-notif-dot" />
        </button>

        {/* User / Login (visible solo en escritorio) */}
        <div className="topbar-desktop-only">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="topbar-user-btn"
              >
                <div className="topbar-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile?.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="topbar-username">{profile?.username || 'Usuario'}</span>
              </button>

              {userMenuOpen && (
                <div className="topbar-dropdown animate-scale-in">
                  {profile?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="topbar-dd-item topbar-dd-admin"
                      >
                        <Shield size={15} /> Panel Admin
                      </Link>
                      <div className="topbar-dd-divider" />
                    </>
                  )}
                  <Link
                    to="/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="topbar-dd-item"
                  >
                    <User size={15} /> Mi Perfil
                  </Link>
                  <div className="topbar-dd-divider" />
                  <button
                    onClick={() => { signOut(); setUserMenuOpen(false) }}
                    className="topbar-dd-item topbar-dd-danger"
                  >
                    <LogOut size={15} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="topbar-login-btn">
              <LogIn size={16} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Estilos ── */}
      <style>{`
        .topbar-root {
          position: fixed;
          top: 0;
          left: var(--sidebar-offset);
          right: 0;
          height: var(--topbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
          transition: left var(--transition);
          border-bottom: 1px solid var(--border);
        }
        .topbar-left { display: flex; align-items: center; }

        /* Hamburguesa - solo visible en móvil */
        .topbar-hamburger {
          display: none;
          background: none;
          border: none;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          padding: 7px;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .topbar-hamburger:hover { background: rgba(255,255,255,0.07); color: #fff; }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Mostrar / ocultar en desktop vs móvil */
        .topbar-desktop-only { display: flex; align-items: center; }

        /* Buscador */
        .topbar-search-form {
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 10px;
          padding: 6px 10px;
          transition: all 0.25s ease;
          overflow: hidden;
        }
        .topbar-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #e8eaf6;
          font-size: 13.5px;
          min-width: 0;
        }
        .topbar-search-input::placeholder { color: rgba(255,255,255,0.3); }

        /* Botones icono */
        .topbar-icon-btn {
          background: none;
          border: none;
          color: #7c7fa8;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 0;
          transition: color 0.2s;
        }
        .topbar-icon-btn:hover { color: #fff; }

        .topbar-icon-circle {
          width: 38px; height: 38px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px;
          position: relative;
        }
        .topbar-notif-dot {
          position: absolute;
          top: 8px; right: 8px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent);
          border: 1.5px solid #0a0a0f;
        }

        /* User button */
        .topbar-user-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 12px 4px 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .topbar-user-btn:hover { background: rgba(255,255,255,0.09); }
        .topbar-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #fff;
          overflow: hidden;
        }
        .topbar-username {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
        }

        /* Login button */
        .topbar-login-btn {
          display: flex; align-items: center; gap: 7px;
          background: var(--accent);
          color: #fff;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 9px;
          font-size: 13px; font-weight: 700;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.25);
        }
        .topbar-login-btn:hover { background: var(--accent-hover); }

        /* Dropdown */
        .topbar-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 190px;
          background: #13141f;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .topbar-dd-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          background: none; border: none; width: 100%;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .topbar-dd-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .topbar-dd-admin { color: var(--accent); font-weight: 700; }
        .topbar-dd-admin:hover { background: rgba(37,99,235,0.12); color: var(--accent); }
        .topbar-dd-danger { color: #f87171; }
        .topbar-dd-danger:hover { background: rgba(248,113,113,0.08); }
        .topbar-dd-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 8px; }

        /* ===== MÓVIL ===== */
        @media (max-width: 768px) {
          .topbar-root {
            left: 0 !important;
          }
          .topbar-hamburger {
            display: flex;
          }
          /* Ocultar búsqueda y login en móvil (ya están en el sidebar) */
          .topbar-desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
