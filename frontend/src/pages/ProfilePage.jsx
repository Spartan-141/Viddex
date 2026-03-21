import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { User, Mail, Save, LogOut, Camera, Loader2, CheckCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    const { error } = await updateProfile({ username })
    
    setLoading(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="p-8 md:p-12 animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-10 flex items-center gap-4">
        <User size={36} className="text-accent" />
        Mi Perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left: Avatar & Bio */}
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer">
            <div className="w-40 h-40 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={80} className="text-white/20" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" />
            </div>
          </div>
          <p className="mt-6 text-xl font-bold">{profile?.username || 'Usuario'}</p>
          <p className="text-muted text-sm">{user?.email}</p>
          
          <button 
            onClick={signOut}
            className="mt-10 flex items-center gap-3 text-red-500 font-bold hover:scale-105 transition-transform"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>

        {/* Right: Settings */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-6">Información General</h3>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2 ml-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2 ml-1">Email (Privado)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white/30 cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Guardar Cambios
              </button>

              {success && (
                <div className="flex items-center gap-2 text-green-500 font-medium animate-fade-in">
                  <CheckCircle size={18} />
                  Perfil actualizado con éxito
                </div>
              )}
            </form>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-4">Membresía VIDDEX</h3>
            <p className="text-muted text-sm leading-relaxed">
              Actualmente eres miembro de la comunidad VIDDEX. Disfruta de todo el contenido sin límites.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="bg-red-600/20 text-accent font-black text-[10px] uppercase px-2 py-1 rounded-md border border-accent/20">PREMIUM</span>
              <span className="text-xs text-muted">Válido hasta: Indefinido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
