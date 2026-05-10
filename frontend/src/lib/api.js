// src/lib/api.js
// Cliente HTTP para el backend local de VIDDEX
// Reemplaza completamente a supabase.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001'

// ─── TOKEN HELPERS ─────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem('viddex_token')
export const setToken = (token) => localStorage.setItem('viddex_token', token)
export const clearToken = () => localStorage.removeItem('viddex_token')

// ─── FETCH BASE ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.detail || `Error ${res.status}`)
  }

  return data
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => apiFetch('/auth/me'),
    updateMe: (body) => apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // ─── MOVIES ────────────────────────────────────────────────────────────────

  movies: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch(`/movies${qs ? '?' + qs : ''}`)
    },
    get: (id) => apiFetch(`/movies/${id}`),
    create: (body) => apiFetch('/movies', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/movies/${id}`, { method: 'DELETE' }),
    addLink: (movieId, body) => apiFetch(`/movies/${movieId}/links`, { method: 'POST', body: JSON.stringify(body) }),
    updateLink: (movieId, linkId, body) => apiFetch(`/movies/${movieId}/links/${linkId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteLink: (movieId, linkId) => apiFetch(`/movies/${movieId}/links/${linkId}`, { method: 'DELETE' }),
    available: (body) => apiFetch('/movies/available', { method: 'POST', body: JSON.stringify(body) }),
    recent: (limit = 15) => apiFetch(`/movies/recent?limit=${limit}`),
    classics: (limit = 15) => apiFetch(`/movies/classics?limit=${limit}`),
  },

  // ─── SERIES ────────────────────────────────────────────────────────────────

  series: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch(`/series${qs ? '?' + qs : ''}`)
    },
    get: (id) => apiFetch(`/series/${id}`),
    create: (body) => apiFetch('/series', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/series/${id}`, { method: 'DELETE' }),
    available: (body) => apiFetch('/series/available', { method: 'POST', body: JSON.stringify(body) }),
    recent: (limit = 15) => apiFetch(`/series/recent?limit=${limit}`),
    classics: (limit = 15) => apiFetch(`/series/classics?limit=${limit}`),
  },

  // ─── SEASONS & EPISODES ───────────────────────────────────────────────────

  seasons: {
    list: (seriesId) => apiFetch(`/series/${seriesId}/seasons`),
    create: (body) => apiFetch('/seasons', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/seasons/${id}`, { method: 'DELETE' }),
  },

  episodes: {
    create: (body) => apiFetch('/episodes', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/episodes/${id}`, { method: 'DELETE' }),
    addLink: (episodeId, body) => apiFetch(`/episodes/${episodeId}/links`, { method: 'POST', body: JSON.stringify(body) }),
    updateLink: (linkId, body) => apiFetch(`/links/${linkId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteLink: (linkId) => apiFetch(`/links/${linkId}`, { method: 'DELETE' }),
  },

  // ─── WATCHLIST ────────────────────────────────────────────────────────────

  watchlist: {
    list: () => apiFetch('/watchlist'),
    add: (body) => apiFetch('/watchlist', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => apiFetch(`/watchlist/${id}`, { method: 'DELETE' }),
  },

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  admin: {
    stats: () => apiFetch('/admin/stats'),
    users: () => apiFetch('/admin/users'),
    setRole: (userId, role) => apiFetch(`/admin/users/${userId}/role?role=${role}`, { method: 'PUT' }),
    reports: () => apiFetch('/admin/reports'),
    resolveReport: (id) => apiFetch(`/admin/reports/${id}/resolve`, { method: 'POST' }),
  },

  // ─── GENERIC REQUEST ──────────────────────────────────────────────────────
  request: (path, options = {}) => apiFetch(path, options),
}

export default api
