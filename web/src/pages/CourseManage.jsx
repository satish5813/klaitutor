import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, fileUrl, getToken, API_BASE } from '../lib/api'

const COLS = [
  { key: 'youtube', label: 'Video', icon: '🎬', req: true, link: true },
  { key: 'pdf', label: 'Report', icon: '📄', req: true, accept: 'application/pdf' },
  { key: 'ppt', label: 'PPT', icon: '📊', req: true, accept: '.ppt,.pptx' },
  { key: 'infographic', label: 'Infographic', icon: '🖼️', req: true, accept: 'image/*' },
  { key: 'quiz', label: 'Quiz', icon: '🏆', req: false },
]
const ytId = (u) => (u || '').match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1]

function Thumb({ id, className }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let url
    fetch(fileUrl(id), { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.blob()).then((b) => { url = URL.createObjectURL(b); setSrc(url) }).catch(() => {})
    return () => url && URL.revokeObjectURL(url)
  }, [id])
  return src ? <img src={src} className={className} alt="" /> : <div className={`${className} bg-slate-100 animate-pulse`} />
}
async function openFile(c) {
  if (c.url) return window.open(c.url, '_blank')
  const res = await fetch(fileUrl(c.id), { headers: { Authorization: `Bearer ${getToken()}` } })
  window.open(URL.createObjectURL(await res.blob()), '_blank')
}

// ---- small reusable "create things" box (single / bulk / quick) ----
function Creator({ label, onCreate, onBulk, onQuick }) {
  const [val, setVal] = useState('')
  async function submit(e) {
    e.preventDefault()
    const names = val.split('\n').map((t) => t.trim()).filter(Boolean)
    if (!names.length) return
    if (names.length === 1) await onCreate(names[0]); else await onBulk(names)
    setVal('')
  }
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">Create {label}s</div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-400">Quick add:</span>
          {[3, 5, 10].map((n) => (
            <button key={n} type="button" onClick={() => onQuick(n)}
              className="text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg px-2.5 py-1 hover:bg-indigo-100">+{n}</button>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="flex gap-3 items-stretch">
        <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2}
          placeholder={`One ${label} name per line — paste many to bulk-create`}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <button className="bg-indigo-600 text-white rounded-xl px-5 font-semibold hover:bg-indigo-700 whitespace-nowrap">+ Create</button>
      </form>
    </div>
  )
}

export default function CourseManage() {
  const { id: courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [tab, setTab] = useState('content')
  useEffect(() => { api.get(`/courses/${courseId}`).then(setCourse).catch(() => {}) }, [courseId])

  return (
    <div className="max-w-5xl">
      <Link to="/my-courses" className="text-indigo-600 text-sm">← My courses</Link>
      <h1 className="text-2xl font-bold mt-2">{course?.title || 'Course'}</h1>
      <p className="text-slate-500 mb-5">{course?.description}</p>
      <div className="flex gap-2 mb-6">
        {[['content', 'Modules & content'], ['students', 'Student mapping']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === t ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600'}`}>{l}</button>
        ))}
      </div>
      {tab === 'content' ? <Modules courseId={courseId} /> : <Students courseId={courseId} />}
    </div>
  )
}

function Modules({ courseId }) {
  const [modules, setModules] = useState([])
  const [open, setOpen] = useState(null) // selected module
  const [err, setErr] = useState('')

  async function load() { try { setModules(await api.get(`/courses/${courseId}/modules`)) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [courseId])

  if (open) return <SessionTable module={open} courseId={courseId} onBack={() => { setOpen(null); load() }} />

  async function delModule(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this module with all its sessions & content?')) return
    await api.del(`/modules/${id}`); load()
  }
  async function renameModule(m, e) {
    e.stopPropagation()
    const title = prompt('Rename module:', m.title)
    if (title && title.trim()) { await api.patch(`/modules/${m.id}`, { title: title.trim() }); load() }
  }

  return (
    <>
      <Creator label="module"
        onCreate={async (t) => { await api.post(`/courses/${courseId}/modules`, { title: t }); load() }}
        onBulk={async (titles) => { await api.post(`/courses/${courseId}/modules/bulk`, { titles }); load() }}
        onQuick={async (n) => { await api.post(`/courses/${courseId}/modules/bulk`, { count: n, prefix: 'Module' }); load() }} />
      {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}

      {modules.length === 0 ? (
        <div className="text-slate-500 bg-white rounded-2xl shadow p-8 text-center">No modules yet — create one above.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <button key={m.id} onClick={() => setOpen(m)}
              className="text-left bg-white rounded-2xl shadow p-5 hover:shadow-lg transition relative group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white grid place-items-center text-xl font-bold mb-3">{i + 1}</div>
              <div className="font-semibold leading-snug">{m.title}</div>
              <div className="text-sm text-slate-500 mt-1">{m.session_count} session{m.session_count !== 1 ? 's' : ''}</div>
              <div className="text-indigo-600 text-sm mt-3 font-medium">Open sessions →</div>
              <span className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100">
                <span onClick={(e) => renameModule(m, e)} className="text-slate-300 hover:text-indigo-600" title="Rename module">✏️</span>
                <span onClick={(e) => delModule(m.id, e)} className="text-slate-300 hover:text-rose-500" title="Delete module">🗑</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function SessionTable({ module, courseId, onBack }) {
  const [sessions, setSessions] = useState([])
  const [modal, setModal] = useState(null) // {sessionId, colKey}
  const [err, setErr] = useState('')
  async function load() { try { setSessions(await api.get(`/modules/${module.id}/sessions`)) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [module.id])

  async function delSession(id) {
    if (!confirm('Delete this session and all its materials?')) return
    await api.del(`/sessions/${id}`); load()
  }
  async function renameSession(s) {
    const title = prompt('Rename session:', s.title)
    if (title && title.trim()) { await api.patch(`/sessions/${s.id}`, { title: title.trim() }); load() }
  }
  const itemsOf = (s, key) => (s.contents || []).filter((c) => c.type === key)
  const modalSession = modal && sessions.find((s) => s.id === modal.sessionId)
  const modalCol = modal && COLS.find((c) => c.key === modal.colKey)

  return (
    <div>
      <button onClick={onBack} className="text-indigo-600 text-sm mb-3">← All modules</button>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white grid place-items-center text-lg">📦</div>
        <h2 className="text-xl font-bold">{module.title}</h2>
      </div>

      <Creator label="session"
        onCreate={async (t) => { await api.post(`/modules/${module.id}/sessions`, { title: t }); load() }}
        onBulk={async (titles) => { await api.post(`/modules/${module.id}/sessions/bulk`, { titles }); load() }}
        onQuick={async (n) => { await api.post(`/modules/${module.id}/sessions/bulk`, { count: n, prefix: 'Session' }); load() }} />
      {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}

      {sessions.length === 0 ? (
        <div className="text-slate-500 bg-white rounded-2xl shadow p-8 text-center">No sessions yet — create some above.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="text-left font-semibold px-4 py-3 sticky left-0 bg-indigo-600 min-w-[170px]">Session</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="px-3 py-3 font-semibold whitespace-nowrap">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-base">{c.icon}</span>
                        <span>{c.label}{c.req && <span className="text-rose-200"> *</span>}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, ri) => {
                  const doneReq = COLS.filter((c) => c.req && itemsOf(s, c.key).length > 0).length
                  const totalReq = COLS.filter((c) => c.req).length
                  const complete = doneReq === totalReq
                  return (
                    <tr key={s.id} className={`${ri % 2 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-indigo-50/40 transition`}>
                      <td className="px-4 py-3 font-medium sticky left-0 bg-inherit">{s.title}</td>
                      {COLS.map((c) => {
                        const items = itemsOf(s, c.key)
                        const has = items.length > 0
                        return (
                          <td key={c.key} className="px-3 py-3 text-center">
                            {has ? (
                              <button onClick={() => setModal({ sessionId: s.id, colKey: c.key })}
                                className="inline-flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 min-w-[60px] bg-emerald-50 hover:bg-emerald-100 transition">
                                {c.key === 'youtube' && ytId(items[0].url)
                                  ? <img src={`https://img.youtube.com/vi/${ytId(items[0].url)}/default.jpg`} className="w-12 h-8 object-cover rounded" alt="" />
                                  : c.key === 'infographic' ? <Thumb id={items[0].id} className="w-12 h-8 object-cover rounded" />
                                    : <span className="text-lg">{c.key === 'quiz' ? '🏆' : '✓'}</span>}
                                <span className="text-[11px] font-semibold text-emerald-700">
                                  {c.key === 'quiz' && items[0].quiz_json ? `${JSON.parse(items[0].quiz_json).length} Q` : items.length > 1 ? `${items.length} ✓` : 'Done'}
                                </span>
                              </button>
                            ) : (
                              <button onClick={() => setModal({ sessionId: s.id, colKey: c.key })}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${
                                  c.req ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}>⬆ Upload</button>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {complete ? '✓ Ready' : `${doneReq}/${totalReq}`}</span>
                      </td>
                      <td className="px-2 text-center whitespace-nowrap">
                        <button onClick={() => renameSession(s)} className="text-slate-300 hover:text-indigo-600 mr-2" title="Rename session">✏️</button>
                        <button onClick={() => delSession(s.id)} className="text-slate-300 hover:text-rose-500" title="Delete session">🗑</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 text-xs text-slate-400 border-t flex gap-4">
            <span><span className="text-rose-400">*</span> mandatory</span>
            <span>✓ uploaded · ⬆ click Upload to add</span>
          </div>
        </div>
      )}

      {modal && modalSession && modalCol && (
        <CellModal col={modalCol} session={modalSession} courseId={courseId}
          items={itemsOf(modalSession, modalCol.key)} onClose={() => setModal(null)} onChange={load} />
      )}
    </div>
  )
}

function CellModal({ col, session, courseId, items, onClose, onChange }) {
  async function del(id) { await api.del(`/contents/${id}`); onChange() }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b sticky top-0 bg-white rounded-t-3xl">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 grid place-items-center text-xl">{col.icon}</div>
          <div className="flex-1">
            <div className="font-bold">{col.label}{col.req && <span className="text-rose-500"> *</span>}</div>
            <div className="text-xs text-slate-500">{session.title}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase">Uploaded</div>
              {items.map((c) => (
                <div key={c.id} className="flex items-center gap-3 border border-slate-100 rounded-xl p-2">
                  {col.key === 'youtube' && ytId(c.url)
                    ? <img src={`https://img.youtube.com/vi/${ytId(c.url)}/mqdefault.jpg`} className="w-16 h-10 object-cover rounded-lg" alt="" />
                    : col.key === 'infographic' ? <Thumb id={c.id} className="w-16 h-10 object-cover rounded-lg" />
                      : <div className="w-16 h-10 rounded-lg bg-slate-100 grid place-items-center">{col.icon}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.title || col.label}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {col.key === 'quiz' && c.quiz_json ? `${JSON.parse(c.quiz_json).length} questions`
                        : col.key === 'pdf' && c.text_content ? c.text_content.slice(0, 50) + '…' : 'uploaded'}
                    </div>
                  </div>
                  {col.key !== 'quiz' && <button onClick={() => openFile(c)} className="text-indigo-600 text-xs hover:underline">preview</button>}
                  <button onClick={() => del(c.id)} className="text-rose-500 text-xs hover:underline">remove</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Add {col.label}</div>
            {col.key === 'quiz'
              ? <QuizBuilder courseId={courseId} sessionId={session.id} onDone={onChange} />
              : <AddFileOrLink col={col} courseId={courseId} sessionId={session.id} onDone={onChange} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddFileOrLink({ col, courseId, sessionId, onDone }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const preview = file && col.key === 'infographic' ? URL.createObjectURL(file) : null
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const fd = new FormData(); fd.append('type', col.key); fd.append('title', title)
      if (col.link) { if (!url) throw new Error('Paste the YouTube link'); fd.append('url', url) }
      else { if (!file) throw new Error('Choose a file'); fd.append('file', file) }
      await api.upload(`/courses/${courseId}/sessions/${sessionId}/contents`, fd)
      setTitle(''); setUrl(''); setFile(null); onDone()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <div className="text-sm text-rose-600">{err}</div>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
      {col.link ? (
        <>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          {ytId(url) && <iframe className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${ytId(url)}`} allowFullScreen />}
          <p className="text-xs text-slate-400">Transcript auto-generates after you add the video.</p>
        </>
      ) : (
        <>
          <input type="file" accept={col.accept} onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm" />
          {preview && <img src={preview} className="max-h-40 rounded-xl border" alt="preview" />}
          {file && col.key !== 'infographic' && <div className="text-xs text-slate-500">Selected: {file.name}</div>}
        </>
      )}
      <button disabled={busy} className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 shadow">
        {busy ? 'Uploading…' : `⬆ Upload ${col.label}`}
      </button>
    </form>
  )
}

const blankQ = () => ({ q: '', opts: ['', '', '', ''], a: 0 })
function QuizBuilder({ courseId, sessionId, onDone }) {
  const [mode, setMode] = useState('build')
  const [title, setTitle] = useState('Quiz')
  const [qs, setQs] = useState([blankQ()])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('')
  const MAX = 10
  function upd(i, patch) { setQs(qs.map((q, idx) => idx === i ? { ...q, ...patch } : q)) }
  function setOpt(i, oi, v) { setQs(qs.map((q, idx) => idx === i ? { ...q, opts: q.opts.map((o, k) => k === oi ? v : o) } : q)) }

  // CSV → parse on the server, load into the editable builder to VERIFY
  async function previewCsv(e) {
    const file = e.target.files[0]; if (!file) return
    setErr(''); setMsg('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await api.upload('/quiz/parse-csv', fd)
      setQs(r.questions.map((x) => ({ q: x.q, opts: [...x.opts, '', '', '', ''].slice(0, 4), a: x.a })))
      setMode('build')
      setMsg(`Imported ${r.count} question(s) from CSV — verify below, then save.`)
    } catch (e) { setErr(e.message) } finally { e.target.value = '' }
  }
  async function save(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      await api.post(`/courses/${courseId}/sessions/${sessionId}/quiz`, { title, questions: qs })
      setQs([blankQ()]); onDone()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="flex items-center gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
          {['build', 'csv'].map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-2 capitalize ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{m}</button>
          ))}
        </div>
      </div>
      {err && <div className="text-sm text-rose-600">{err}</div>}
      {msg && <div className="text-sm text-emerald-600">{msg}</div>}
      {mode === 'csv' ? (
        <div className="space-y-2 bg-slate-50 rounded-xl p-3">
          <div className="text-sm font-semibold">Import quiz from CSV</div>
          <a href={`${API_BASE}/quiz-template.csv`} className="text-indigo-600 text-sm hover:underline block">⬇ Download CSV template</a>
          <label className="bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-900 cursor-pointer inline-block">
            ⬆ Upload CSV to preview<input type="file" accept=".csv" onChange={previewCsv} className="hidden" />
          </label>
          <p className="text-xs text-slate-400">Columns: question, optionA–D, answer (1–4). Max {MAX} rows. The CSV loads into the editor below so you can <b>verify and edit before saving</b>.</p>
        </div>
      ) : (
        <>
          {qs.map((q, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                <input value={q.q} onChange={(e) => upd(i, { q: e.target.value })} placeholder="Question"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                {qs.length > 1 && <button type="button" onClick={() => setQs(qs.filter((_, x) => x !== i))} className="text-rose-500">✕</button>}
              </div>
              <div className="grid grid-cols-2 gap-2 pl-7">
                {q.opts.map((o, oi) => (
                  <label key={oi} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${q.a === oi ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                    <input type="radio" checked={q.a === oi} onChange={() => upd(i, { a: oi })} title="Correct" />
                    <input value={o} onChange={(e) => setOpt(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="w-full bg-transparent outline-none" />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button type="button" disabled={qs.length >= MAX} onClick={() => setQs([...qs, blankQ()])} className="text-indigo-600 text-sm disabled:text-slate-300">+ Add question</button>
            <span className="text-xs text-slate-400">{qs.length}/{MAX} · radio = correct</span>
          </div>
        </>
      )}
      <button disabled={busy} className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 shadow">{busy ? 'Saving…' : '⬆ Save quiz'}</button>
    </form>
  )
}

function Students({ courseId }) {
  const [students, setStudents] = useState([])
  const [input, setInput] = useState('')
  const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { try { setStudents(await api.get(`/courses/${courseId}/students`)) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [courseId])
  async function add(e) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    // each line: "Name, RegID, email"  (RegID optional)
    const list = input.split('\n').map((line) => {
      const parts = line.split(',').map((x) => x.trim()).filter(Boolean)
      const ei = parts.findIndex((p) => p.includes('@'))
      if (ei < 0) return null
      const email = parts[ei]
      const rest = parts.filter((_, i) => i !== ei)
      const ri = rest.findIndex((r) => !r.includes(' ') && /\d/.test(r)) // reg id = token with digits, no spaces
      const reg_id = ri >= 0 ? rest[ri] : ''
      const name = (ri >= 0 ? rest.filter((_, i) => i !== ri) : rest).join(' ')
      return { name, reg_id, email }
    }).filter(Boolean)
    if (!list.length) { setBusy(false); return setErr('Add at least one valid email') }
    try { const r = await api.post(`/courses/${courseId}/students`, { students: list })
      setMsg(`${r.enrolled} enrolled · ${r.accountsCreated} new. Default password: ${r.defaultPassword}`); setInput(''); load() }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  async function remove(id) { if (confirm('Remove this student?')) { await api.del(`/enrollments/${id}`); load() } }
  async function toggle(s) { try { await api.patch(`/courses/${courseId}/students/${s.user_id}/active`, { is_active: s.is_active ? 0 : 1 }); load() } catch (e) { setErr(e.message) } }
  async function uploadCsv(e) {
    const file = e.target.files[0]; if (!file) return
    setErr(''); setMsg('')
    try { const fd = new FormData(); fd.append('file', file)
      const r = await api.upload(`/courses/${courseId}/students/csv`, fd)
      setMsg(`CSV: ${r.parsed} rows · ${r.enrolled} enrolled · ${r.accountsCreated} new (password ${r.defaultPassword}).`); load()
    } catch (e) { setErr(e.message) } finally { e.target.value = '' }
  }
  return (
    <div>
      <form onSubmit={add} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-3">
        <div className="font-semibold">Map students to this course</div>
        <p className="text-sm text-slate-500">One per line: <code className="bg-slate-100 px-1 rounded">Name, RegID, email</code>. A login is auto-created with default password <b>student123</b>.</p>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        {msg && <div className="text-sm text-emerald-600">{msg}</div>}
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4}
          placeholder={'Rahul Kumar, 2100031001, rahul@kl.edu\nPriya Sharma, 2100031002, priya@kl.edu'} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm" />
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Adding…' : 'Add students'}</button>
          <span className="text-slate-300">|</span>
          <label className="bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-900 cursor-pointer">
            ⬆ Upload CSV<input type="file" accept=".csv" onChange={uploadCsv} className="hidden" />
          </label>
          <a href={`${API_BASE}/student-template.csv`} className="text-indigo-600 text-sm hover:underline">⬇ template</a>
        </div>
      </form>
      <h2 className="font-semibold mb-2">Students ({students.length})</h2>
      <div className="grid gap-2">
        {students.map((s) => (
          <div key={s.enrollment_id} className="bg-white rounded-xl shadow px-4 py-2.5 flex items-center justify-between text-sm">
            <div><div className="font-medium text-slate-700">{s.name || s.student_email.split('@')[0]}
              {s.reg_id && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{s.reg_id}</span>}
              {!s.is_active && s.user_id && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">deactivated</span>}</div>
              <div className="text-slate-500 text-xs">{s.student_email}</div></div>
            <div className="flex gap-3 shrink-0">
              {s.user_id && <button onClick={() => toggle(s)} className="text-amber-600 hover:underline">{s.is_active ? 'deactivate' : 'activate'}</button>}
              <button onClick={() => remove(s.enrollment_id)} className="text-rose-500 hover:underline">remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
