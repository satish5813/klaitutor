import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'

const GRAD = ['from-rose-500 to-red-700', 'from-indigo-500 to-indigo-700', 'from-emerald-500 to-teal-700', 'from-amber-500 to-orange-600', 'from-sky-500 to-blue-700', 'from-fuchsia-500 to-pink-700']

export default function StudentHome() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState(null)
  useEffect(() => { api.get('/student/courses').then(setCourses).catch(() => setCourses([])) }, [])

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="text-sm text-slate-500">Welcome back,</div>
        <h1 className="text-2xl font-bold">{profile?.name || 'Student'} 👋</h1>
      </div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">My courses</h3>
      {!courses ? <div className="text-slate-400">Loading…</div>
        : courses.length === 0 ? <div className="bg-white rounded-2xl shadow p-8 text-center text-slate-500">No courses assigned yet.</div>
          : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((c, i) => (
                <Link key={c.id} to={`/student/course/${c.id}`}
                  className="rounded-2xl shadow-lg overflow-hidden group">
                  <div className={`bg-gradient-to-br ${GRAD[i % GRAD.length]} p-5 text-white relative`}>
                    <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/15" />
                    <div className="text-3xl mb-6">📚</div>
                    <div className="font-bold text-lg leading-tight relative">{c.title}</div>
                    <div className="text-white/80 text-sm mt-1 relative">{c.code ? c.code + ' · ' : ''}Tap to open</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
    </div>
  )
}
