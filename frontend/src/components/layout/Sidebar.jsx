import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Users,
  FolderOpen,
  Mail,
  ChevronLeft,
  Play,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          icon: Home,       label: 'Inicio' },
  { to: '/peliculas', icon: Film,       label: 'Películas' },
  { to: '/series',    icon: Tv,         label: 'Series' },
  { to: '/anime',     icon: Sparkles,   label: 'Anime' },
  { to: '/actores',   icon: Users,      label: 'Actores' },
  { to: '/colecciones', icon: FolderOpen, label: 'Colecciones' },
  { to: '/contacto',  icon: Mail,       label: 'Contacto' },
]

export default function Sidebar({ collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) {
  
  const handleLinkClick = () => {
    if (setMobileMenuOpen) setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        onClick={() => setMobileMenuOpen(false)}
        className="mobile-backdrop"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      <aside
        className={`sidebar-container ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: collapsed ? '72px' : 'var(--sidebar-actual-width)',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #111118 0%, #0a0a0f 100%)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          transition: `all var(--transition)`,
          overflow: 'hidden',
        }}
      >

      {/* Logo */}
      <div style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 20px' : '0 24px',
        gap: 10,
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(229,9,20,0.5)',
        }}>
          <Play size={18} fill="white" color="white" />
        </div>
        {!collapsed && (
          <span style={{
            fontSize: 22, fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}>
            VIDD<span style={{ color: 'var(--accent)' }}>EX</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }} className="hide-scrollbar">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={handleLinkClick}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: collapsed ? '12px 20px' : '12px 24px',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              textDecoration: 'none',
              borderRadius: collapsed ? '0' : '0 var(--radius) var(--radius) 0',
              marginRight: collapsed ? 0 : 12,
              background: isActive
                ? 'linear-gradient(90deg, rgba(229,9,20,0.15), rgba(229,9,20,0.05))'
                : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all var(--transition)',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              whiteSpace: 'nowrap',
              position: 'relative',
            })}
            className={({ isActive }) => !isActive ? 'sidebar-link' : ''}
          >
            <Icon size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}

            {/* Tooltip for collapsed */}
            {collapsed && (
              <span style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                border: '1px solid var(--border)',
                opacity: 0,
                pointerEvents: 'none',
                marginLeft: 8,
                transition: 'opacity var(--transition)',
              }} className="sidebar-tooltip">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid var(--border)',
      }}>
        <button
          onClick={() => {
            if (setCollapsed) setCollapsed(!collapsed)
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            gap: 8,
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px 12px',
            transition: 'all var(--transition)',
            fontSize: 12,
          }}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ChevronLeft size={16} style={{
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition)',
          }} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>

      <style>{`
        .sidebar-link:hover {
          background: rgba(255,255,255,0.04) !important;
          color: var(--text-primary) !important;
        }
        .sidebar-link:hover .sidebar-tooltip {
          opacity: 1 !important;
        }
        .mobile-backdrop {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-backdrop {
            display: block;
          }
          .sidebar-container {
            transform: translateX(-100%);
            width: var(--sidebar-actual-width) !important;
          }
          .sidebar-container.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
    </>
  )
}
