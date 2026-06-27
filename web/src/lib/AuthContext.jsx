import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken, clearToken } from './api'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadMe() {
    if (!getToken()) { setProfile(null); setLoading(false); return }
    try {
      const me = await api.get('/auth/me')
      setProfile(me)
    } catch {
      clearToken()
      setProfile(null)
    }
    setLoading(false)
  }

  useEffect(() => { loadMe() }, [])

  async function signIn(email, password) {
    try {
      const { token, user } = await api.post('/auth/login', { email, password })
      setToken(token)
      setProfile(user)
      return { error: null }
    } catch (e) {
      return { error: { message: e.message } }
    }
  }

  function signOut() {
    clearToken()
    setProfile(null)
  }

  async function refreshProfile() {
    try { setProfile(await api.get('/auth/me')) } catch { /* ignore */ }
  }

  const session = profile ? { user: profile } : null

  return (
    <AuthCtx.Provider value={{ session, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}
