import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Faculty() {
  const [people, setPeople] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try { setPeople(await api.get('/users')) } catch (e) { setErr(e.message) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function createFaculty(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try {
      await api.post('/faculty', { name, email, password })
      setMsg(`Faculty "${name}" registered. Password: ${password}`)
      setName(''); setEmail(''); setPassword(''); load()
    } catch (e) { setErr(e.message) }
  }
  async function setRole(id, role) {
    setErr(''); setMsg('')
    try { await api.patch(`/users/${id}/role`, { role }); load() } catch (e) { setErr(e.message) }
  }
  async function toggleActive(u) { try { await api.patch(`/users/${u.id}/active`, { is_active: u.is_active ? 0 : 1 }); load() } catch (e) { setErr(e.message) } }

  const faculty = people.filter((p) => p.role === 'faculty')
  const promotable = people.filter((p) => p.role === 'student')

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Faculty Management</h1>

      <form onSubmit={createFaculty} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
        <div className="font-semibold">Register a faculty account</div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        {msg && <div className="text-sm text-emerald-600">{msg}</div>}
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="rounded-xl border border-slate-300 px-3 py-2" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2" />
          <button type="button" onClick={() => setPassword('Kl' + Math.random().toString(36).slice(2, 8) + '@' + Math.floor(Math.random() * 90 + 10))}
            className="text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-xl px-3 hover:bg-indigo-100 whitespace-nowrap">Generate password</button>
        </div>
        <button className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-indigo-700">Register faculty</button>
      </form>

      <h2 className="font-semibold mb-3">Faculty members ({faculty.length})</h2>
      <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
                : faculty.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No faculty yet.</td></tr>
                  : faculty.map((p, i) => (
                    <tr key={p.id} className={`${i % 2 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-indigo-50/40`}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                          {p.is_active ? 'Active' : 'Deactivated'}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => toggleActive(p)} className="text-amber-600 hover:underline mr-3">{p.is_active ? 'deactivate' : 'activate'}</button>
                        <button onClick={() => setRole(p.id, 'student')} className="text-slate-500 hover:text-rose-600">demote</button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Promote a student to faculty ({promotable.length})</h2>
      {promotable.length === 0 ? <div className="text-slate-500">No students to promote.</div> : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-100 text-slate-600 text-left">
              <th className="px-4 py-2.5 font-semibold">Name</th><th className="px-4 py-2.5 font-semibold">Reg ID</th>
              <th className="px-4 py-2.5 font-semibold">Email</th><th className="px-4 py-2.5 font-semibold text-right">Action</th></tr></thead>
            <tbody>
              {promotable.slice(0, 50).map((p, i) => (
                <tr key={p.id} className={`${i % 2 ? 'bg-slate-50/60' : 'bg-white'}`}>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{p.reg_id || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{p.email}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => setRole(p.id, 'faculty')} className="text-indigo-600 hover:underline">promote to faculty</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
