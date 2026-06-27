// Local backend API client (replaces Supabase).
// Default to the SAME host the page is served from, on port 4000 — so the portal
// works whether opened via localhost or the PC's LAN IP (e.g. from a phone).
const BASE = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:4000/api`

const tokenKey = 'tutoriq_token'
export const getToken = () => localStorage.getItem(tokenKey)
export const setToken = (t) => localStorage.setItem(tokenKey, t)
export const clearToken = () => localStorage.removeItem(tokenKey)

async function request(method, path, body, isForm = false) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (!isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p, b) => request('DELETE', p, b),
  upload: (p, formData) => request('POST', p, formData, true),
}

// build a URL for a protected file, with the token as a query param fallback
export const fileUrl = (contentId) => `${BASE}/contents/${contentId}/file`
export const API_BASE = BASE
