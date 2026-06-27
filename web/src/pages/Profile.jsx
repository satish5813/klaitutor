import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [pMsg, setPMsg] = useState(''); const [pErr, setPErr] = useState('')

  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [nw2, setNw2] = useState('')
  const [wMsg, setWMsg] = useState(''); const [wErr, setWErr] = useState('')

  async function saveProfile(e) {
    e.preventDefault(); setPErr(''); setPMsg('')
    try { await api.patch('/me', { name, email }); await refreshProfile(); setPMsg('Profile updated.') }
    catch (e) { setPErr(e.message) }
  }

  async function changePassword(e) {
    e.preventDefault(); setWErr(''); setWMsg('')
    if (nw !== nw2) return setWErr('New passwords do not match')
    try {
      await api.post('/me/password', { current_password: cur, new_password: nw })
      setWMsg('Password changed.'); setCur(''); setNw(''); setNw2('')
    } catch (e) { setWErr(e.message) }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <form onSubmit={saveProfile} className="bg-white rounded-xl shadow p-5 mb-8 space-y-3">
        <div className="font-semibold">Edit profile</div>
        {pErr && <div className="text-sm text-rose-600">{pErr}</div>}
        {pMsg && <div className="text-sm text-emerald-600">{pMsg}</div>}
        <label className="block text-sm font-medium">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <label className="block text-sm font-medium">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <div className="text-xs text-slate-400 capitalize">Role: {profile?.role}</div>
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700">
          Save changes
        </button>
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-xl shadow p-5 space-y-3">
        <div className="font-semibold">Change password</div>
        {wErr && <div className="text-sm text-rose-600">{wErr}</div>}
        {wMsg && <div className="text-sm text-emerald-600">{wMsg}</div>}
        <input type="password" value={cur} onChange={(e) => setCur(e.target.value)}
          placeholder="Current password" required
          className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input type="password" value={nw} onChange={(e) => setNw(e.target.value)}
          placeholder="New password" required minLength={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input type="password" value={nw2} onChange={(e) => setNw2(e.target.value)}
          placeholder="Confirm new password" required minLength={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <button className="bg-slate-800 text-white rounded-lg px-4 py-2 font-medium hover:bg-slate-900">
          Update password
        </button>
      </form>
    </div>
  )
}
