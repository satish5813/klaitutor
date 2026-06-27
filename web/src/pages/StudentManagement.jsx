import { useEffect, useMemo, useState } from 'react'
import { api, API_BASE } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function StudentManagement() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin'
  const [students, setStudents] = useState([])
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState(null)

  // create form (admin)
  const [name, setName] = useState(''); const [regId, setRegId] = useState('')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('student123')

  async function load() { try { setStudents(await api.get('/students')) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try {
      const r = await api.post('/students', { name, email, reg_id: regId, password })
      setMsg(`Student "${name}" registered. Password: ${r.defaultPassword}`)
      setName(''); setRegId(''); setEmail(''); setPassword('student123'); load()
    } catch (e) { setErr(e.message) }
  }
  async function uploadCsv(e) {
    const file = e.target.files[0]; if (!file) return
    setErr(''); setMsg('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await api.upload('/students/csv', fd)
      setMsg(`CSV: ${r.parsed} rows, ${r.created} new accounts created (password ${r.defaultPassword}).`); load()
    } catch (e) { setErr(e.message) } finally { e.target.value = '' }
  }
  async function toggle(s) { try { await api.patch(`/users/${s.id}/active`, { is_active: s.is_active ? 0 : 1 }); load() } catch (e) { setErr(e.message) } }
  async function remove(s) { if (confirm(`Delete ${s.email}?`)) { try { await api.del(`/students/${s.id}`); load() } catch (e) { setErr(e.message) } } }

  const rows = useMemo(() => students.filter((s) =>
    !search || (s.name + ' ' + s.email + ' ' + (s.reg_id || '')).toLowerCase().includes(search.toLowerCase())), [students, search])

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Student Management</h1>
      <p className="text-slate-500 text-sm mb-6">{canEdit ? 'Register, edit and manage student accounts.' : 'View students enrolled in your courses (read-only).'}</p>

      {canEdit && (
        <form onSubmit={create} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
          <div className="font-semibold">Register a student</div>
          {err && <div className="text-sm text-rose-600">{err}</div>}
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <div className="grid grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="rounded-xl border border-slate-300 px-3 py-2" />
            <input value={regId} onChange={(e) => setRegId(e.target.value)} placeholder="Reg ID" className="rounded-xl border border-slate-300 px-3 py-2" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div className="flex gap-3 items-center">
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-xl border border-slate-300 px-3 py-2 w-56" />
            <span className="text-xs text-slate-400">default: student123</span>
            <button className="ml-auto bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-indigo-700">Register student</button>
          </div>
          <div className="border-t pt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Bulk upload CSV:</span>
            <label className="bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-900 cursor-pointer">
              ⬆ Upload CSV<input type="file" accept=".csv" onChange={uploadCsv} className="hidden" />
            </label>
            <a href={`${API_BASE}/student-template.csv`} className="text-indigo-600 text-sm hover:underline">⬇ Download template</a>
            <span className="text-xs text-slate-400">columns: name, reg_id, email</span>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold">Students ({students.length})</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="ml-auto rounded-xl border border-slate-300 px-3 py-1.5 text-sm w-64" />
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Reg ID</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold text-center">Courses</th>
                <th className="px-3 py-3 font-semibold text-center">Attempts</th>
                <th className="px-3 py-3 font-semibold text-center">Passed</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                {canEdit && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-6 text-center text-slate-400">No students found.</td></tr>
              ) : rows.map((s, i) => (
                <tr key={s.id} className={`${i % 2 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-indigo-50/40`}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.reg_id || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email}</td>
                  <td className="px-3 py-3 text-center">{s.courses}</td>
                  <td className="px-3 py-3 text-center">{s.attempts}</td>
                  <td className="px-3 py-3 text-center text-emerald-600 font-semibold">{s.passed}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                      {s.is_active ? 'Active' : 'Off'}</span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEdit(s)} className="text-indigo-600 hover:underline mr-3">edit</button>
                      <button onClick={() => toggle(s)} className="text-amber-600 hover:underline mr-3">{s.is_active ? 'off' : 'on'}</button>
                      <button onClick={() => remove(s)} className="text-rose-500 hover:underline">delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && <EditModal student={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load() }} />}
    </div>
  )
}

function EditModal({ student, onClose, onDone }) {
  const [name, setName] = useState(student.name)
  const [email, setEmail] = useState(student.email)
  const [reg_id, setRegId] = useState(student.reg_id || '')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('')
  async function save(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try { await api.patch(`/students/${student.id}`, { name, email, reg_id }); onDone() } catch (e) { setErr(e.message) }
  }
  async function resetPw(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try { await api.post(`/users/${student.id}/password`, { new_password: pw }); setPw(''); setMsg('Password reset.') } catch (e) { setErr(e.message) }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold">{(student.name || '?')[0]}</div>
          <div className="flex-1"><div className="font-bold">{student.name}</div><div className="text-xs text-slate-500">Student</div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="text-sm text-rose-600">{err}</div>}
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <form onSubmit={save} className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase">Edit details</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={reg_id} onChange={(e) => setRegId(e.target.value)} placeholder="Reg ID" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button className="bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-900">Save</button>
          </form>
          <form onSubmit={resetPw} className="space-y-2 border-t pt-4">
            <div className="text-xs font-semibold text-slate-400 uppercase">Reset password</div>
            <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" minLength={6}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700">Reset password</button>
          </form>
        </div>
      </div>
    </div>
  )
}
