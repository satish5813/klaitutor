import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function Users() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('')
  const [manage, setManage] = useState(null)   // user being managed (modal)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // create-user form
  const [name, setName] = useState(''); const [email, setEmail] = useState('')
  const [password, setPassword] = useState(''); const [role, setRole] = useState('faculty')

  async function load() { try { setUsers(await api.get('/users')) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  async function createUser(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try {
      const r = await api.post('/faculty', { name, email, password })
      if (role !== 'faculty') await api.patch(`/users/${r.id}`, { role })
      setMsg(`User "${name}" created.`); setName(''); setEmail(''); setPassword(''); setRole('faculty'); load()
    } catch (e) { setErr(e.message) }
  }
  async function toggleActive(u) { try { await api.patch(`/users/${u.id}/active`, { is_active: u.is_active ? 0 : 1 }); load() } catch (e) { setErr(e.message) } }
  async function remove(u) { if (confirm(`Delete ${u.email}? This cannot be undone.`)) { try { await api.del(`/users/${u.id}`); load() } catch (e) { setErr(e.message) } } }

  const rows = useMemo(() => users.filter((u) =>
    (filter === 'all' || u.role === filter) &&
    (!search || (u.name + ' ' + u.email + ' ' + (u.reg_id || '')).toLowerCase().includes(search.toLowerCase()))
  ), [users, filter, search])

  const counts = { all: users.length, admin: 0, faculty: 0, student: 0 }
  users.forEach((u) => { counts[u.role]++ })
  const roleBadge = { admin: 'bg-purple-100 text-purple-700', faculty: 'bg-indigo-50 text-indigo-700', student: 'bg-emerald-50 text-emerald-700' }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <form onSubmit={createUser} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
        <div className="font-semibold">Register a new user</div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        {msg && <div className="text-sm text-emerald-600">{msg}</div>}
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="rounded-xl border border-slate-300 px-3 py-2" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex gap-2">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6} className="flex-1 rounded-xl border border-slate-300 px-3 py-2" />
            <button type="button" onClick={() => setPassword('Kl' + Math.random().toString(36).slice(2, 8) + '@' + Math.floor(Math.random() * 90 + 10))}
              className="text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-xl px-3 hover:bg-indigo-100 whitespace-nowrap">Generate</button>
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2">
            <option value="faculty">Faculty</option><option value="admin">Admin</option><option value="student">Student</option>
          </select>
        </div>
        {password && <p className="text-xs text-slate-500">Share this password with the user: <b>{password}</b></p>}
        <button className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-indigo-700">Register user</button>
      </form>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {['all', 'admin', 'faculty', 'student'].map((r) => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold capitalize ${filter === r ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
            {r} <span className="opacity-60">{counts[r]}</span>
          </button>
        ))}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / email / reg id…"
          className="ml-auto rounded-xl border border-slate-300 px-3 py-1.5 text-sm w-64" />
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Reg ID</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No users found.</td></tr>
              ) : rows.map((u, i) => (
                <tr key={u.id} className={`${i % 2 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-indigo-50/40`}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.reg_id || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadge[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setManage(u)} className="text-indigo-600 hover:underline mr-3">manage</button>
                    {u.id !== profile.id && (
                      <>
                        <button onClick={() => toggleActive(u)} className="text-amber-600 hover:underline mr-3">{u.is_active ? 'deactivate' : 'activate'}</button>
                        <button onClick={() => remove(u)} className="text-rose-500 hover:underline">delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {manage && <ManageModal user={manage} onClose={() => setManage(null)} onDone={() => { setManage(null); load() }} />}
    </div>
  )
}

function ManageModal({ user, onClose, onDone }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [reg_id, setRegId] = useState(user.reg_id || '')
  const [role, setRole] = useState(user.role)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('')

  async function saveInfo(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try { await api.patch(`/users/${user.id}`, { name, email, reg_id, role }); setMsg('Details saved.'); onDone() }
    catch (e) { setErr(e.message) }
  }
  async function resetPw(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try { await api.post(`/users/${user.id}/password`, { new_password: pw }); setPw(''); setMsg('Password reset.') }
    catch (e) { setErr(e.message) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold">{(user.name || '?')[0]}</div>
          <div className="flex-1"><div className="font-bold">{user.name}</div><div className="text-xs text-slate-500 capitalize">{user.role}</div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="text-sm text-rose-600">{err}</div>}
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <form onSubmit={saveInfo} className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase">Edit details</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={reg_id} onChange={(e) => setRegId(e.target.value)} placeholder="Reg ID" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="admin">Admin</option><option value="faculty">Faculty</option><option value="student">Student</option>
            </select>
            <button className="bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-900">Save details</button>
          </form>
          <form onSubmit={resetPw} className="space-y-2 border-t pt-4">
            <div className="text-xs font-semibold text-slate-400 uppercase">Reset password</div>
            <div className="flex gap-2">
              <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" minLength={6}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <button type="button" onClick={() => setPw('Kl' + Math.random().toString(36).slice(2, 8) + '@' + Math.floor(Math.random() * 90 + 10))}
                className="text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-xl px-3">Generate</button>
            </div>
            <button className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700">Reset password</button>
          </form>
        </div>
      </div>
    </div>
  )
}
