import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import ContentViewer from './ContentViewer'

const ICON = { youtube: '🎬', pdf: '📄', ppt: '📊', infographic: '🖼️', quiz: '🏆', notes: '📝', csv: '🗒️', mindmap: '🧠' }
const LABEL = { youtube: 'Video lecture', pdf: 'Report (PDF)', ppt: 'Slides (PPT)', infographic: 'Infographic', quiz: 'Quiz', notes: 'Notes', csv: 'Data', mindmap: 'Mind map' }
// per-type colour for the icon tile (nicer + easier to scan)
const TILE = {
  youtube: 'bg-rose-50 text-rose-500 group-hover:bg-rose-100',
  pdf: 'bg-blue-50 text-blue-500 group-hover:bg-blue-100',
  ppt: 'bg-orange-50 text-orange-500 group-hover:bg-orange-100',
  infographic: 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100',
  quiz: 'bg-amber-50 text-amber-500 group-hover:bg-amber-100',
  notes: 'bg-violet-50 text-violet-500 group-hover:bg-violet-100',
  csv: 'bg-cyan-50 text-cyan-500 group-hover:bg-cyan-100',
  mindmap: 'bg-fuchsia-50 text-fuchsia-500 group-hover:bg-fuchsia-100',
}

export default function StudentCourse() {
  const { id } = useParams()
  const [modules, setModules] = useState(null)
  const [openMod, setOpenMod] = useState(0)
  const [openSess, setOpenSess] = useState({})
  const [viewing, setViewing] = useState(null)

  useEffect(() => { api.get(`/student/courses/${id}/modules`).then((m) => { setModules(m); if (m[0]) setOpenMod(m[0].id) }).catch(() => setModules([])) }, [id])

  if (!modules) return <div className="text-slate-400">Loading…</div>

  return (
    <div className="max-w-3xl">
      <Link to="/student" className="text-indigo-600 text-sm">← My courses</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Course content</h1>
      <p className="text-slate-500 text-sm mb-6">Organized module-wise and session-wise.</p>

      {modules.length === 0 ? <div className="bg-white rounded-2xl shadow p-8 text-center text-slate-500">No content yet.</div> : (
        <div className="space-y-4">
          {modules.map((m, mi) => {
            const open = openMod === m.id
            const totalItems = m.sessions.reduce((n, s) => n + (s.contents?.length || 0), 0)
            return (
              <div key={m.id} className="bg-white rounded-2xl shadow overflow-hidden">
                <button onClick={() => setOpenMod(open ? -1 : m.id)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold">{m.id === 0 ? '∗' : mi + 1}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-xs text-slate-500">{m.sessions.length} sessions · {totalItems} materials</div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
                </button>

                {open && (
                  <div className="px-3 pb-3 space-y-2">
                    {m.sessions.map((s) => {
                      const so = openSess[s.id]
                      return (
                        <div key={s.id} className="border border-slate-100 rounded-xl overflow-hidden">
                          <button onClick={() => setOpenSess({ ...openSess, [s.id]: !so })}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-50/60 hover:bg-slate-50">
                            <span className="text-indigo-600">📂</span>
                            <span className="flex-1 font-medium text-sm">{s.title}</span>
                            <span className="text-xs text-slate-400">{(s.contents || []).length}</span>
                            <span className={`text-slate-300 transition-transform ${so ? 'rotate-90' : ''}`}>›</span>
                          </button>
                          {so && (
                            <div className="p-3">
                              {(s.contents || []).length === 0 ? <div className="text-xs text-slate-400 px-1 py-1">No materials.</div>
                                : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {s.contents.map((c) => (
                                      <button key={c.id} onClick={() => setViewing(c)}
                                        className="group h-full bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150">
                                        <span className={`w-12 h-12 rounded-2xl grid place-items-center text-2xl transition ${TILE[c.type] || TILE.notes}`}>{ICON[c.type] || '📦'}</span>
                                        <div className="w-full min-h-[2.25rem] mt-2.5 flex items-center">
                                          <span className="w-full text-center text-[13px] font-semibold leading-snug line-clamp-2 break-words" title={c.title || LABEL[c.type]}>{c.title || LABEL[c.type]}</span>
                                        </div>
                                        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{LABEL[c.type] || c.type}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewing && <ContentViewer content={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
