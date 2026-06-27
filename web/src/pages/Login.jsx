import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <div className="min-h-screen flex">
      {/* ===== brand panel (desktop) ===== */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-[#c8102e] text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <img src="/skill-logo.png" alt="KL Skill Development" className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg" />
          <div>
            <div className="font-semibold text-lg leading-tight">KL Skill Development</div>
            <div className="text-white/70 text-sm">AI Tutor Platform</div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4">Learn smarter,<br />with AI by your side.</h2>
          <p className="text-white/80 max-w-sm leading-relaxed">Video lectures, slides, infographics, reports and quizzes — organised course-wise and personalised for every student.</p>
          <ul className="mt-8 space-y-3 text-white/90 text-sm">
            <li className="flex items-center gap-2.5"><span className="grid place-items-center w-5 h-5 rounded-full bg-white/20">✓</span> Multi-language lessons &amp; transcripts</li>
            <li className="flex items-center gap-2.5"><span className="grid place-items-center w-5 h-5 rounded-full bg-white/20">✓</span> Slides, PDFs &amp; quizzes in one place</li>
            <li className="flex items-center gap-2.5"><span className="grid place-items-center w-5 h-5 rounded-full bg-white/20">✓</span> Track progress across every course</li>
          </ul>
        </div>

        <div className="text-white/60 text-xs relative z-10">© KL University · Koneru Lakshmaiah Education Foundation</div>
        <img src="/skill-logo.png" alt="" aria-hidden="true" className="absolute -right-20 -bottom-20 w-80 opacity-10 pointer-events-none" />
      </div>

      {/* ===== form panel ===== */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <form onSubmit={submit} className="w-full max-w-sm">
          <img src="/kl-logo.png" alt="KL University" className="h-11 mb-8 object-contain" />
          <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to continue to your dashboard.</p>

          {err && <div className="mb-4 text-sm bg-rose-50 text-rose-600 rounded-lg px-3 py-2 border border-rose-100">{err}</div>}

          <label className="block text-sm font-medium mb-1 text-slate-600">Email or Reg ID</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@kl.edu"
            className="w-full mb-4 rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none transition focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/20" />

          <label className="block text-sm font-medium mb-1 text-slate-600">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
            className="w-full mb-6 rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none transition focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/20" />

          <button disabled={busy}
            className="w-full bg-[#c8102e] text-white rounded-xl py-3 font-semibold shadow-sm transition hover:bg-[#a60d26] active:scale-[.99] disabled:opacity-60">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-6">KL AI Tutor · Skill Development Division</p>
        </form>
      </div>
    </div>
  )
}
