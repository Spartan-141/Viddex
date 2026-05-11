import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Home, Film, Tv, Sparkles, Users,
  FolderPlus, Calendar, Activity, Mail,
  Play, X, Search
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { to: '/',             icon: Home,       label: 'Inicio' },
  { to: '/peliculas',    icon: Film,       label: 'Películas' },
  { to: '/series',       icon: Tv,         label: 'Series' },
  { to: '/anime',        icon: Sparkles,   label: 'Animes' },
  { to: '/actores',      icon: Users,      label: 'Actores' },
  { to: '/colecciones',  icon: FolderPlus, label: 'Colecciones' },
  { to: '/proximamente', icon: Calendar,   label: 'Próximamente' },
  { to: '/actividades',  icon: Activity,   label: 'Actividades' },
  { to: '/contacto',     icon: Mail,       label: 'contacto' },
]

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { user } = useAuth()

  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleLinkClick = () => {
    if (setMobileMenuOpen) setMobileMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    // Navegar a la página de búsqueda
    navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
    
    // Limpiar y cerrar el menú
    setQuery('')
    if (setMobileMenuOpen) setMobileMenuOpen(false)
  }

  return (
    <>
      {/* ── Backdrop (móvil) ── */}
      <div
        className="sb-backdrop"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
        style={{ opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
      />

      {/* ── Aside principal ── */}
      <aside className={`sb-aside${mobileMenuOpen ? ' sb-open' : ''}`}>

        {/* == SECCIÓN DE ESCRITORIO: sólo logo centrado == */}
        <div className="sb-desktop-logo">
          <div className="sb-logo-icon">
            <Play size={18} fill="white" color="white" />
          </div>
        </div>

        {/* == SECCIÓN MÓVIL: cabecera con logo, buscador y acceso == */}
        <div className="sb-mobile-header">
          <div className="sb-mobile-top">
            <div className="sb-mobile-brand">
              <div className="sb-logo-icon sb-logo-blue">
                <Play size={15} fill="white" color="white" />
              </div>
              <span className="sb-brand-text">
                viddex<span className="sb-brand-accent"> 3</span>
              </span>
            </div>
            <button className="sb-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">
              <X size={18} />
            </button>
          </div>

          {/* Buscador dentro del drawer */}
          <form className="sb-search-wrap" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar..."
              className="sb-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" style={{ background: 'none', border: 'none', padding: 0 }}>
              <Search size={15} className="sb-search-icon" />
            </button>
          </form>

          {/* Botones de acceso (solo si no hay sesión) */}
          {!user && (
            <div className="sb-auth-row">
              <Link to="/login" onClick={handleLinkClick} className="sb-btn-plain">
                Entrar
              </Link>
              <Link to="/registro" onClick={handleLinkClick} className="sb-btn-primary">
                Registro
              </Link>
            </div>
          )}
        </div>

        {/* ── Navegación (compartida escritorio / móvil) ── */}
        <nav className="sb-nav hide-scrollbar">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={handleLinkClick}
              className={({ isActive }) => `sb-item${isActive ? ' sb-active' : ''}`}
              title={label}
            >
              <Icon className="sb-icon" size={22} strokeWidth={1.5} />
              <span className="sb-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Estilos puros ── */}
      <style>{`
        /* ===== BACKDROP ===== */
        .sb-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(5px);
          z-index: 40;
          transition: opacity 0.3s ease;
        }

        /* ===== ASIDE BASE ===== */
        .sb-aside {
          position: fixed;
          left: 0; top: 0;
          height: 100vh;
          z-index: 50;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          /* ESCRITORIO por defecto */
          width: var(--sidebar-desktop-width);
          background: #1e2030;
          border-right: 1px solid rgba(255,255,255,0.04);
        }

        /* ===== LOGO ESCRITORIO ===== */
        .sb-desktop-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--topbar-height);
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sb-logo-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px rgba(37,99,235,0.45);
          flex-shrink: 0;
        }

        /* ===== CABECERA MÓVIL (oculta en escritorio) ===== */
        .sb-mobile-header {
          display: none;
        }

        /* ===== NAVEGACIÓN ===== */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 8px 0;
        }

        /* Item - modo escritorio: columna, centrado */
        .sb-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px 4px;
          color: #7c7fa8;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          border-left: 3px solid transparent;
          position: relative;
        }
        .sb-item:hover {
          color: #e8eaf6;
          background: rgba(255,255,255,0.04);
        }
        .sb-item.sb-active {
          color: #ffffff;
          background: rgba(37,99,235,0.18);
          border-left-color: #2563eb;
        }
        .sb-icon { flex-shrink: 0; }
        .sb-label {
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 80px;
        }

        /* Tooltip en hover (escritorio) */
        .sb-item::after {
          content: attr(title);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #1a1d2e;
          color: #e8eaf6;
          padding: 5px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.18s ease;
          z-index: 200;
        }
        .sb-item:hover::after {
          opacity: 1;
        }

        /* ===== MÓVIL ===== */
        @media (max-width: 768px) {
          /* Activar backdrop */
          .sb-backdrop {
            display: block;
          }

          /* Aside: se convierte en drawer lateral */
          .sb-aside {
            width: var(--sidebar-mobile-width);
            transform: translateX(-100%);
            background: #0c1022;
            border-right: none;
            box-shadow: none;
          }
          .sb-aside.sb-open {
            transform: translateX(0);
            box-shadow: 6px 0 32px rgba(0,0,0,0.6);
          }

          /* Ocultar logo de escritorio en móvil */
          .sb-desktop-logo {
            display: none;
          }

          /* Mostrar cabecera móvil */
          .sb-mobile-header {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 20px 18px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .sb-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .sb-mobile-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .sb-logo-blue {
            background: #2563eb !important;
            box-shadow: 0 0 14px rgba(37,99,235,0.4) !important;
            border-radius: 50% !important;
            width: 32px !important; height: 32px !important;
          }
          .sb-brand-text {
            font-size: 19px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
          }
          .sb-brand-accent {
            color: #2563eb;
          }
          .sb-close-btn {
            background: rgba(37,99,235,0.2);
            border: 1px solid rgba(37,99,235,0.3);
            border-radius: 50%;
            width: 34px; height: 34px;
            display: flex; align-items: center; justify-content: center;
            color: #a0b0ff;
            cursor: pointer;
            transition: background 0.2s;
          }
          .sb-close-btn:hover {
            background: rgba(37,99,235,0.4);
            color: #fff;
          }

          /* Buscador */
          .sb-search-wrap {
            position: relative;
          }
          .sb-search-input {
            width: 100%;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            padding: 10px 40px 10px 14px;
            border-radius: 22px;
            color: #e8eaf6;
            font-size: 13.5px;
            outline: none;
            transition: border 0.2s;
          }
          .sb-search-input::placeholder { color: rgba(255,255,255,0.3); }
          .sb-search-input:focus { border-color: rgba(37,99,235,0.5); }
          .sb-search-icon {
            position: absolute;
            right: 14px; top: 50%;
            transform: translateY(-50%);
            color: rgba(255,255,255,0.35);
            cursor: pointer;
          }

          /* Auth buttons */
          .sb-auth-row {
            display: flex;
            gap: 10px;
          }
          .sb-btn-plain {
            flex: 1;
            text-align: center;
            color: rgba(255,255,255,0.75);
            text-decoration: none;
            padding: 9px 0;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            transition: color 0.2s;
          }
          .sb-btn-plain:hover { color: #fff; }
          .sb-btn-primary {
            flex: 1;
            text-align: center;
            background: #2563eb;
            color: #fff;
            text-decoration: none;
            padding: 9px 0;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            transition: background 0.2s;
          }
          .sb-btn-primary:hover { background: #1d4ed8; }

          /* Items: fila horizontal en móvil */
          .sb-nav {
            padding: 10px 14px;
            gap: 4px;
          }
          .sb-item {
            flex-direction: row;
            justify-content: flex-start;
            gap: 14px;
            padding: 12px 14px;
            border-radius: 10px;
            border-left: none;
          }
          .sb-item.sb-active {
            background: #1d4ed8;
            border-left: none;
          }
          .sb-item.sb-active .sb-label,
          .sb-item.sb-active .sb-icon { color: #fff; }
          .sb-label {
            font-size: 15px;
            font-weight: 500;
            white-space: normal;
            max-width: none;
          }
          /* Ocultar tooltip en móvil */
          .sb-item::after { display: none; }
        }
      `}</style>
    </>
  )
}
