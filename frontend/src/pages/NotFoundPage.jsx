import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 32,
    }}>
      <div style={{
        fontSize: 120, fontWeight: 900, letterSpacing: '-6px',
        background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: 1, marginBottom: 16,
      }}>404</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Página no encontrada</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400 }}>
        Lo que buscas no existe o fue movido. Vuelve al inicio para seguir explorando.
      </p>
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--accent)', color: 'white',
        padding: '12px 24px', borderRadius: 'var(--radius)',
        fontSize: 15, fontWeight: 600, textDecoration: 'none',
      }}>
        <Home size={18} /> Ir al Inicio
      </Link>
    </div>
  )
}
