// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken, clearToken } from '@/lib/api'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Al iniciar, verificar si hay token guardado y obtener el perfil
    const token = getToken()
    if (token) {
      api.auth.me()
        .then(userData => setUser(userData))
        .catch(() => {
          // Token inválido/expirado
          clearToken()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    try {
      const res = await api.auth.register({ email, password, ...metadata })
      setToken(res.access_token)
      setUser(res.user)
      return { data: res, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const signIn = async (email, password) => {
    try {
      const res = await api.auth.login({ email, password })
      setToken(res.access_token)
      setUser(res.user)
      return { data: res, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const signOut = () => {
    clearToken()
    setUser(null)
  }

  const updateProfile = async (updates) => {
    try {
      const updated = await api.auth.updateMe(updates)
      setUser(updated)
      return { data: updated, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  // Compatibilidad: profile = user (ya que auth devuelve el objeto completo)
  const profile = user

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
