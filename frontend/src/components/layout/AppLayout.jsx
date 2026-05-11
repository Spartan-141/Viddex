import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Contenido principal */}
      <div className="app-main-content">
        <TopBar setMobileMenuOpen={setMobileMenuOpen} />

        <main style={{
          marginTop: 'var(--topbar-height)',
          flex: 1,
          padding: 0,
          width: '100%',
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .app-main-content {
          padding-left: var(--sidebar-offset);
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          width: 100%;
          transition: padding-left var(--transition);
        }
        @media (max-width: 768px) {
          .app-main-content {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
