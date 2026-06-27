import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const YEARS = ['1', '2', '3', '4', '5']
const SEMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [err, setErr] = useState('')
  const [mapFor, setMapFor] = useState(null)

  // create form
  const [ay, setAy] = useState('2026-27')
  const [year, setYear] = useState('1')
  const [sem, setSem] = useState('1')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  async function load() { try { setCourses(await api.get('/courses')) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault(); setErr('')
    try {
      await api.post('/courses', { title, description, code, academic_year: ay, year, sem })
      setCode(''); setTitle(''); setDescription(''); load()
    } catch (e) { setErr(e.message) }
  }
  async function remove(id) {
    if (!confirm('Delete this course and all its content?')) return
    try { await api.del(`/courses/${id}`); load() } catch (e) { setErr(e.message) }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Courses</h1>

      <form onSubmit={add} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
        <div className="font-semibold">Create a course</div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="text-xs font-semibold text-slate-500">Academic Year
            <input value={ay} onChange={(e) => setAy(e.target.value)} placeholder="2026-27" required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800" /></label>
          <label className="text-xs font-semibold text-slate-500">Year
            <select value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800">
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-500">Semester
            <select value={sem} onChange={(e) => setSem(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800">
              {SEMS.map((s) => <option key={s} value={s}>Sem {s}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-500">Course Code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MBA101"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course name" required
          className="w-full rounded-xl border border-slate-300 px-3 py-2" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
          className="w-full rounded-xl border border-slate-300 px-3 py-2" />
        <button className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-indigo-700">+ Add course</button>
      </form>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white text-left">
                <th className="px-3 py-3 font-semibold">Acad. Yr</th>
                <th className="px-3 py-3 font-semibold">Year</th>
                <th className="px-3 py-3 font-semibold">Sem</th>
                <th className="px-3 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Course Name</th>
                <th className="px-4 py-3 font-semibold">Faculty</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No courses yet.</td></tr>
              ) : courses.map((c, i) => (
                <tr key={c.id} className={`${i % 2 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-indigo-50/40`}>
                  <td className="px-3 py-3">{c.academic_year || '—'}</td>
                  <td className="px-3 py-3">{c.year ? `Y${c.year}` : '—'}</td>
                  <td className="px-3 py-3">{c.sem ? `S${c.sem}` : '—'}</td>
                  <td className="px-3 py-3 font-mono text-xs">{c.code || '—'}</td>
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3">
                    {c.faculty
                      ? <span className="text-xs">{c.faculty}</span>
                      : <span className="text-xs text-rose-500 font-semibold">⚠ not mapped</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setMapFor(c)} className="text-indigo-600 hover:underline mr-3">map faculty</button>
                    <button onClick={() => remove(c.id)} className="text-rose-500 hover:underline">delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 text-xs text-slate-400 border-t">A course is visible to faculty/students only after a faculty is mapped to it.</div>
      </div>

      {mapFor && <MapModal course={mapFor} onClose={() => setMapFor(null)} onChange={load} />}
    </div>
  )
}

function MapModal({ course, onClose, onChange }) {
  const [faculty, setFaculty] = useState([])
  const [mapped, setMapped] = useState([]) // faculty_ids mapped to this course
  const [err, setErr] = useState('')

  async function load() {
    try {
      const [users, maps] = await Promise.all([api.get('/users'), api.get('/mappings')])
      setFaculty(users.filter((u) => u.role === 'faculty'))
      setMapped(maps.filter((m) => m.course_id === course.id).map((m) => m.faculty_id))
    } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [course.id])

  async function toggle(fid) {
    try {
      if (mapped.includes(fid)) await api.del('/mappings', { faculty_id: fid, course_id: course.id })
      else await api.post('/mappings', { faculty_id: fid, course_id: course.id })
      await load(); onChange()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="flex-1"><div className="font-bold">Map faculty</div>
            <div className="text-xs text-slate-500">{course.code ? course.code + ' · ' : ''}{course.title}</div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="p-5">
          {err && <div className="text-sm text-rose-600 mb-2">{err}</div>}
          {faculty.length === 0 ? <div className="text-slate-500 text-sm">No faculty registered yet.</div> : (
            <div className="space-y-2">
              {faculty.map((f) => {
                const on = mapped.includes(f.id)
                return (
                  <label key={f.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${on ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(f.id)} />
                    <div className="flex-1"><div className="text-sm font-medium">{f.name}</div><div className="text-xs text-slate-500">{f.email}</div></div>
                    {on && <span className="text-xs font-semibold text-indigo-600">mapped</span>}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
