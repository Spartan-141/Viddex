import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main content */}
      <div 
        className="main-layout-container"
        style={{
          paddingLeft: sidebarCollapsed ? '72px' : 'var(--sidebar-offset)',
          flex: 1,
          minHeight: '100vh',
          transition: `padding-left var(--transition)`,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}>
        <TopBar 
          sidebarCollapsed={sidebarCollapsed} 
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main style={{
          marginTop: 'var(--topbar-height)',
          flex: 1,
          padding: 0,
          width: '100%',
          overflowX: 'hidden'
        }}>
          <Outlet />
        </main>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .main-layout-container {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
