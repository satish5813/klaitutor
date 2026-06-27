import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function MyCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [badVideos, setBadVideos] = useState([])
  const [checking, setChecking] = useState(false)

  const loadStatus = () => api.get('/videos/status').then(setBadVideos).catch(() => setBadVideos([]))

  useEffect(() => {
    api.get('/my-courses').then(setCourses).catch(() => setCourses([])).finally(() => setLoading(false))
    loadStatus()
  }, [])

  async function recheck() {
    setChecking(true)
    try { await api.post('/videos/recheck'); await loadStatus() } catch { /* ignore */ }
    setChecking(false)
  }

  const byCourse = {}
  badVideos.forEach((v) => { (byCourse[v.course] = byCourse[v.course] || []).push(v) })

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">My Courses</h1>

      {badVideos.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-amber-800">
                {badVideos.length} video{badVideos.length > 1 ? 's are' : ' is'} private / not playable for students
              </div>
              <p className="text-sm text-amber-700 mt-1">
                These are <b>hidden from students</b> until you set them to <b>Public</b> or <b>Unlisted</b> on YouTube
                (they're currently Private, deleted, or have embedding turned off). Fix them on YouTube, then press <b>Re-check</b>.
              </p>
              <ul className="mt-3 space-y-2">
                {Object.entries(byCourse).map(([course, vids]) => (
                  <li key={course} className="text-sm">
                    <span className="font-medium text-amber-900">{course}</span>
                    <div className="mt-1 space-y-1">
                      {vids.map((v) => (
                        <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                          className="block text-amber-700 hover:underline truncate">↗ {v.title || v.url}</a>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <button onClick={recheck} disabled={checking}
                className="mt-3 bg-amber-600 text-white text-sm rounded-lg px-4 py-2 font-medium hover:bg-amber-700 disabled:opacity-60">
                {checking ? 'Re-checking…' : '↻ Re-check videos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-slate-500">Loading…</div> :
       courses.length === 0 ? (
        <div className="text-slate-500">No courses assigned yet. Ask the admin to map a course to you.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.id} to={`/course/${c.id}`}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition block">
              <div className="font-semibold text-lg">{c.title}</div>
              <div className="text-sm text-slate-500 line-clamp-2">{c.description}</div>
              <div className="text-indigo-600 text-sm mt-3">Manage sessions →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
