import { useEffect, useState } from 'react'
import { api, API_BASE, getToken } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

async function downloadCsv(path, filename) {
  const res = await fetch(API_BASE + path, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) return alert('Download failed')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className={`text-2xl font-extrabold ${accent ? 'text-indigo-600' : 'text-slate-800'}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function DailyChart({ daily }) {
  if (!daily?.length) return <div className="text-sm text-slate-400">No quiz activity yet.</div>
  const max = Math.max(1, ...daily.map((d) => Number(d.attempts)))
  const fmt = (s) => new Date(s).toLocaleDateString(undefined, { weekday: 'short' })
  return (
    <div className="flex items-end gap-3 h-40 pt-2">
      {daily.map((d, i) => {
        const a = Number(d.attempts), p = Number(d.passed)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[11px] text-slate-500">{a}</div>
            <div className="w-full bg-slate-100 rounded-lg relative flex flex-col justify-end" style={{ height: '100%' }}>
              <div className="bg-indigo-200 rounded-lg w-full" style={{ height: `${(a / max) * 100}%` }} />
              <div className="bg-indigo-600 rounded-lg w-full absolute bottom-0" style={{ height: `${(p / max) * 100}%` }} title={`${p} passed`} />
            </div>
            <div className="text-[11px] text-slate-400">{fmt(d.day)}</div>
          </div>
        )
      })}
    </div>
  )
}

function StudentProgressTable({ cid }) {
  const [data, setData] = useState(null)
  useEffect(() => { if (cid) api.get(`/courses/${cid}/progress-report`).then(setData).catch(() => setData(null)) }, [cid])
  const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—'
  if (!data) return null
  const t = data.totals
  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat label="Students enrolled" value={t.students_enrolled} />
        <Stat label="Accessed course" value={t.students_accessed} accent />
        <Stat label="Avg progression" value={`${t.avg_progress}%`} accent />
        <Stat label="Modules / Sessions" value={`${t.modules} / ${t.sessions}`} />
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Student-wise progress ({data.students.length})</div>
          <button onClick={() => downloadCsv(`/courses/${cid}/progress-report.csv`, `course-${cid}-progress.csv`)}
            className="bg-indigo-600 text-white rounded-xl px-3 py-1.5 text-sm font-semibold hover:bg-indigo-700">⬇ Download CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left text-slate-400 text-xs border-b">
              <th className="py-2">Student</th><th>Reg ID</th>
              <th className="text-center">Modules</th><th className="text-center">Sessions</th>
              <th className="text-center">Progress</th><th className="text-center">Attempts</th>
              <th className="text-center">Passed</th><th>Last access</th></tr></thead>
            <tbody>
              {data.students.length === 0 ? <tr><td colSpan={8} className="py-4 text-center text-slate-400">No students mapped yet.</td></tr>
                : data.students.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 font-medium">{s.name || s.email.split('@')[0]}
                      {!s.accessed && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">not started</span>}</td>
                    <td className="text-slate-500">{s.reg_id || '—'}</td>
                    <td className="text-center">{s.modules_done}/{t.modules}</td>
                    <td className="text-center">{s.sessions_done}/{t.sessions}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-14 h-1.5 rounded bg-slate-100 overflow-hidden"><span className="block h-full bg-indigo-600" style={{ width: `${s.progress_pct}%` }} /></span>
                        {s.progress_pct}%</span>
                    </td>
                    <td className="text-center">{s.attempts}</td>
                    <td className="text-center text-emerald-600 font-semibold">{s.passed}</td>
                    <td className="text-slate-500">{fmt(s.last_access)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ContentStatusReport({ cid }) {
  const [data, setData] = useState(null)
  useEffect(() => { if (cid) api.get(`/courses/${cid}/content-report`).then(setData).catch(() => setData(null)) }, [cid])
  if (!data) return null
  const t = data.totals
  const mark = (b) => b ? <span className="text-emerald-600">✓</span> : <span className="text-rose-300">✗</span>
  const pill = (s) => ({ Ready: 'bg-emerald-100 text-emerald-700', Partial: 'bg-amber-100 text-amber-700', Empty: 'bg-rose-100 text-rose-600' }[s])
  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat label="Ready sessions" value={t.ready} accent />
        <Stat label="Partial" value={t.partial} />
        <Stat label="Empty" value={t.empty} />
        <Stat label="Content complete" value={`${t.completion}%`} accent />
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Upload status by session ({data.sessions.length})</div>
          <button onClick={() => downloadCsv(`/courses/${cid}/content-report.csv`, `course-${cid}-content-status.csv`)}
            className="bg-indigo-600 text-white rounded-xl px-3 py-1.5 text-sm font-semibold hover:bg-indigo-700">⬇ Download CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left text-slate-400 text-xs border-b">
              <th className="py-2">Module</th><th>Session</th>
              <th className="text-center">🎬</th><th className="text-center">📄</th><th className="text-center">📊</th>
              <th className="text-center">🖼️</th><th className="text-center">🏆</th><th>Status</th></tr></thead>
            <tbody>
              {data.sessions.length === 0 ? <tr><td colSpan={8} className="py-4 text-center text-slate-400">No sessions yet.</td></tr>
                : data.sessions.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 text-slate-500">{s.module}</td>
                    <td className="font-medium">{s.session}</td>
                    <td className="text-center">{mark(s.video)}</td>
                    <td className="text-center">{mark(s.report)}</td>
                    <td className="text-center">{mark(s.ppt)}</td>
                    <td className="text-center">{mark(s.infographic)}</td>
                    <td className="text-center">{mark(s.quiz)}</td>
                    <td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pill(s.status)}`}>{s.status}</span>
                      {s.missing.length > 0 && <span className="ml-2 text-[11px] text-rose-400">missing: {s.missing.join(', ')}</span>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-slate-400">🎬 Video · 📄 Report · 📊 PPT · 🖼️ Infographic (mandatory) · 🏆 Quiz (optional). "Ready" = all 4 mandatory uploaded.</div>
      </div>
    </div>
  )
}

function CourseReportTabs({ cid }) {
  const [tab, setTab] = useState('progress')
  return (
    <div className="mt-5">
      <div className="flex gap-2 mb-1">
        {[['progress', 'Student progress'], ['content', 'Content upload status']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${tab === k ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>{l}</button>
        ))}
      </div>
      {tab === 'progress' ? <StudentProgressTable cid={cid} /> : <ContentStatusReport cid={cid} />}
    </div>
  )
}

function FacultyReports() {
  const [courses, setCourses] = useState([])
  const [cid, setCid] = useState('')
  const [rep, setRep] = useState(null)
  useEffect(() => { api.get('/my-courses').then((c) => { setCourses(c); if (c[0]) setCid(String(c[0].id)) }).catch(() => {}) }, [])
  useEffect(() => { if (cid) api.get(`/courses/${cid}/report`).then(setRep).catch(() => {}) }, [cid])

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Progress Reports</h1>
      <p className="text-slate-500 mb-5 text-sm">Content, quizzes and daily student progress for your course.</p>
      <select value={cid} onChange={(e) => setCid(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 mb-6">
        {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      {rep && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Stat label="Modules" value={rep.modules} />
            <Stat label="Sessions" value={rep.sessions} />
            <Stat label="Content items" value={rep.contents} accent />
            <Stat label="Quizzes" value={rep.quizzes} />
            <Stat label="Students mapped" value={rep.students} />
            <Stat label="Quiz attempts" value={rep.attempts} accent />
            <Stat label="Passed" value={rep.passed} />
            <Stat label="Pass rate" value={`${rep.passRate}%`} accent />
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">Daily quiz progress (last 7 days)</div>
              <div className="text-xs text-slate-400"><span className="text-indigo-600">■</span> passed · <span className="text-indigo-300">■</span> attempts</div>
            </div>
            <DailyChart daily={rep.daily} />
          </div>
          <CourseReportTabs cid={cid} />
        </>
      )}
    </div>
  )
}

function AdminReports() {
  const [o, setO] = useState(null)
  const [cid, setCid] = useState('')
  useEffect(() => { api.get('/report/overview').then((d) => { setO(d); if (d.perCourse?.[0]) setCid(String(d.perCourse[0].id)) }).catch(() => {}) }, [])
  if (!o) return <div className="text-slate-500">Loading…</div>
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Platform Reports</h1>
      <p className="text-slate-500 mb-5 text-sm">System-wide content, quiz and student activity.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Courses" value={o.courses} />
        <Stat label="Faculty" value={o.faculty} />
        <Stat label="Students" value={o.students} accent />
        <Stat label="Content items" value={o.contents} />
        <Stat label="Quizzes" value={o.quizzes} />
        <Stat label="Quiz attempts" value={o.attempts} accent />
        <Stat label="Passed" value={o.passed} />
        <Stat label="Pass rate" value={`${o.passRate}%`} accent />
      </div>
      <div className="bg-white rounded-2xl shadow p-5 mb-5">
        <div className="font-semibold mb-1">Daily quiz activity (last 7 days)</div>
        <DailyChart daily={o.daily} />
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="font-semibold mb-3">By course</div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs">
            <th className="py-1">Course</th><th>Students</th><th>Attempts</th><th>Passed</th></tr></thead>
          <tbody>
            {o.perCourse.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="py-2 font-medium">{c.title}</td>
                <td>{c.students}</td><td>{c.attempts}</td><td className="text-emerald-600 font-semibold">{c.passed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">Course-wise student progress:</span>
          <select value={cid} onChange={(e) => setCid(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm">
            {o.perCourse.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        {cid && <CourseReportTabs cid={cid} />}
      </div>
    </div>
  )
}

export default function Reports() {
  const { profile } = useAuth()
  return profile?.role === 'admin' ? <AdminReports /> : <FacultyReports />
}
