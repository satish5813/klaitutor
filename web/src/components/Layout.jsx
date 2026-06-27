import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const adminNav = [
  { to: '/courses', label: 'Courses', icon: '📚' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/faculty', label: 'Faculty', icon: '🧑‍🏫' },
  { to: '/students', label: 'Students', icon: '🎓' },
  { to: '/mapping', label: 'Faculty ↔ Course', icon: '🔗' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/profile', label: 'My Profile', icon: '⚙️' },
]

const facultyNav = [
  { to: '/my-courses', label: 'My Courses', icon: '📚' },
  { to: '/students', label: 'Students', icon: '🎓' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/profile', label: 'My Profile', icon: '⚙️' },
]

const studentNav = [
  { to: '/student', label: 'My Courses', icon: '📚' },
  { to: '/profile', label: 'My Profile', icon: '⚙️' },
]

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const nav = profile?.role === 'admin' ? adminNav : profile?.role === 'faculty' ? facultyNav : studentNav

  return (
    <div className="min-h-screen flex">
      {/* Windows 11 navigation pane */}
      <aside className="w-64 bg-white/70 backdrop-blur border-r border-black/10 flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-black/5">
          <img src="/kl-logo.png" alt="KL University" className="h-9 object-contain" />
          <div className="mt-2 text-[11px] font-semibold tracking-wide text-[#c8102e]">AI TUTOR · SKILL DEVELOPMENT</div>
        </div>
        <div className="px-5 pt-4 pb-3 text-[11px] uppercase tracking-wide text-slate-400">
          {profile?.role === 'admin' ? 'Administration' : profile?.role === 'faculty' ? 'Faculty' : 'Student'}
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-black/[0.04]'
                }`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-indigo-600" />}
                  <span className="text-base">{n.icon}</span>
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="m-2 p-3 rounded-xl bg-black/[0.03] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white grid place-items-center text-xs font-semibold">
            {initials(profile?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-800 truncate">{profile?.name}</div>
            <div className="text-[11px] text-slate-400 capitalize">{profile?.role}</div>
          </div>
          <button onClick={signOut} title="Sign out"
            className="text-slate-400 hover:text-rose-600 text-lg leading-none">⏻</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
