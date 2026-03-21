import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CheckCircle, AlertTriangle, MessageSquare, Clock } from 'lucide-react'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    try {
      // Nota: Añadiré este método a api.js pronto
      const data = await api.admin.reports()
      setReports(data)
    } catch (err) {
      console.error("Error fetching reports:", err)
    }
    setLoading(false)
  }

  async function handleResolve(id) {
    try {
      await api.admin.resolveReport(id)
      fetchReports()
    } catch (err) {
      alert("Error al resolver: " + err.message)
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-1">Reportes de Errores</h1>
        <p className="text-muted font-medium">Gestiona los problemas técnicos reportados por usuarios.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl bg-opacity-10 ${
                report.status === 'pending' ? 'bg-red-500 text-red-500' : 'bg-green-500 text-green-500'
              }`}>
                {report.status === 'pending' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                    {report.reason.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{report.description || 'Sin descripción adicional'}</h3>
                <p className="text-xs text-muted font-medium">Link ID: <span className="font-mono">{report.video_link_id}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
                <MessageSquare size={16} />
                Detalles
              </button>
              {report.status === 'pending' && (
                <button 
                  onClick={() => handleResolve(report.id)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl text-sm transition-colors"
                >
                  Marcar Resuelto
                </button>
              )}
            </div>
          </div>
        ))}

        {reports.length === 0 && !loading && (
          <div className="py-20 text-center text-muted">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">¡Buen trabajo! No hay reportes pendientes.</p>
          </div>
        )}
      </div>
    </div>
  )
}
