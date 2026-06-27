import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Mapping() {
  const [faculty, setFaculty] = useState([])
  const [courses, setCourses] = useState([])
  const [maps, setMaps] = useState([])
  const [facultyId, setFacultyId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [err, setErr] = useState('')

  async function load() {
    try {
      const [users, cs, ms] = await Promise.all([
        api.get('/users'), api.get('/courses'), api.get('/mappings'),
      ])
      setFaculty(users.filter((u) => u.role === 'faculty'))
      setCourses(cs)
      setMaps(ms)
    } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [])

  async function addMap(e) {
    e.preventDefault(); setErr('')
    if (!facultyId || !courseId) return
    try { await api.post('/mappings', { faculty_id: facultyId, course_id: courseId }); load() }
    catch (e) { setErr(e.message) }
  }

  async function removeMap(faculty_id, course_id) {
    try { await api.del('/mappings', { faculty_id, course_id }); load() }
    catch (e) { setErr(e.message) }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Faculty ↔ Course mapping</h1>

      <form onSubmit={addMap} className="bg-white rounded-xl shadow p-5 mb-8 space-y-3">
        <div className="font-semibold">Assign a faculty to a course</div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="grid grid-cols-2 gap-3">
          <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select faculty…</option>
            {faculty.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.email})</option>)}
          </select>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select course…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700">
          Assign
        </button>
      </form>

      <h2 className="font-semibold mb-3">Current assignments</h2>
      {maps.length === 0 ? <div className="text-slate-500">No assignments yet.</div> : (
        <div className="grid gap-2">
          {maps.map((m) => (
            <div key={`${m.faculty_id}-${m.course_id}`}
              className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{m.faculty_name}</span>
                <span className="text-slate-400"> → </span>
                <span>{m.course_title}</span>
              </div>
              <button onClick={() => removeMap(m.faculty_id, m.course_id)}
                className="text-rose-500 hover:text-rose-700 text-sm">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
