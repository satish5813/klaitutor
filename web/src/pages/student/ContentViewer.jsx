import { useEffect, useRef, useState } from 'react'
import { api, fileUrl, getToken, API_BASE } from '../../lib/api'

const ytId = (u) => (u || '').match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1]
const LANGS = [['en', '🌐 English'], ['hi', 'हिन्दी'], ['te', 'తెలుగు'], ['ta', 'தமிழ்'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം'], ['mr', 'मराठी'], ['bn', 'বাংলা'], ['gu', 'ગુજરાતી'], ['ur', 'اردو'], ['ar', 'العربية'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['zh-CN', '中文'], ['ja', '日本語'], ['ru', 'Русский']]
const ttsCode = (c) => ({ hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', ur: 'ur-PK', ar: 'ar-SA', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', 'zh-CN': 'zh-CN', ja: 'ja-JP', ru: 'ru-RU', en: 'en-US' }[c] || c)
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')

async function fetchBuf(id) {
  const res = await fetch(fileUrl(id), { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('file error')
  return res.arrayBuffer()
}
async function fetchBlobUrl(id) {
  const res = await fetch(fileUrl(id), { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('file error')
  return URL.createObjectURL(await res.blob())
}

/* ---------- PDF book reader (one page at a time, prev/next) ---------- */
function PdfBook({ loader }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [doc, setDoc] = useState(null)
  const [page, setPage] = useState(1)
  const [err, setErr] = useState('')

  useEffect(() => {
    let off = false
    ;(async () => {
      try {
        const pdfjs = window.pdfjsLib
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        const d = await pdfjs.getDocument({ data: await loader() }).promise
        if (!off) setDoc(d)
      } catch (e) { if (!off) setErr(e.message || 'Could not open PDF.') }
    })()
    return () => { off = true }
  }, [])

  useEffect(() => {
    if (!doc || !canvasRef.current) return
    let off = false
    ;(async () => {
      const pg = await doc.getPage(page)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.min(wrapRef.current?.clientWidth || 640, 720)
      const scale = W / pg.getViewport({ scale: 1 }).width
      const vp = pg.getViewport({ scale: scale * dpr })
      const cv = canvasRef.current
      cv.width = vp.width; cv.height = vp.height
      cv.style.width = '100%'
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height)
      if (!off) await pg.render({ canvasContext: ctx, viewport: vp }).promise
    })()
    return () => { off = true }
  }, [doc, page])

  if (err) return <div className="text-center text-slate-400 py-10">{err}</div>
  return (
    <div ref={wrapRef}>
      <div className="bg-slate-200/60 rounded-2xl p-4 flex justify-center">
        <canvas ref={canvasRef} className="rounded-md shadow-xl bg-white max-w-full" />
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold disabled:opacity-40">‹ Prev</button>
        <span className="text-sm text-slate-500">Page {page} of {doc?.numPages || '…'}</span>
        <button disabled={!doc || page >= doc.numPages} onClick={() => setPage(page + 1)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40">Next ›</button>
      </div>
    </div>
  )
}

/* ---------- PPT viewer: server converts PPT→PDF, shown in the book reader ---------- */
function PptView({ id }) {
  const loader = async () => {
    const res = await fetch(`${API_BASE}/contents/${id}/as-pdf`, { headers: { Authorization: `Bearer ${getToken()}` } })
    if (res.status === 501) throw new Error('PPT preview isn’t enabled on the server yet (LibreOffice required).')
    if (!res.ok) throw new Error('Could not render these slides.')
    return res.arrayBuffer()
  }
  return <PdfBook loader={loader} />
}

/* ---------- transcript ---------- */
function Transcript({ lines }) {
  const [cur, setCur] = useState(lines); const [lang, setLang] = useState('en'); const [active, setActive] = useState(0); const [speaking, setSpeaking] = useState(false)
  async function changeLang(code) { setLang(code); if (code === 'en') return setCur(lines); setCur(null); try { const r = await api.post('/translate', { lang: code, texts: lines.map((l) => l[1]) }); setCur(lines.map((l, i) => [l[0], r.texts[i] || l[1]])) } catch { setCur(lines) } }
  function seek(t, i) { setActive(i); const f = document.getElementById('yt-frame'); if (f) f.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${t},true]}`, '*') }
  function toggleSpeak() { if (!('speechSynthesis' in window)) return; if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return } const u = new SpeechSynthesisUtterance((cur || lines).map((l) => l[1]).join('. ')); u.lang = ttsCode(lang); u.rate = 0.97; u.onend = () => setSpeaking(false); speechSynthesis.speak(u); setSpeaking(true) }
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <span className="font-semibold text-sm">📝 Transcript</span>
        <button onClick={toggleSpeak} className="ml-auto bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-sm font-semibold">{speaking ? '⏸ Stop' : '🔊 Listen'}</button>
        <select value={lang} onChange={(e) => changeLang(e.target.value)} className="rounded-lg border border-slate-200 text-sm px-2 py-1.5">{LANGS.map((l) => <option key={l[0]} value={l[0]}>{l[1]}</option>)}</select>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {!cur ? <div className="p-5 text-center text-slate-400 text-sm">🌐 Translating…</div>
          : cur.map(([t, x], i) => <div key={i} onClick={() => seek(t, i)} className={`flex gap-3 p-2.5 rounded-xl cursor-pointer ${active === i ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}><span className="text-xs font-bold text-indigo-600 w-10 shrink-0">{fmt(t)}</span><span className="text-sm text-slate-700 leading-snug">{x}</span></div>)}
      </div>
    </div>
  )
}

function DocText({ text }) {
  const blocks = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  const [cur, setCur] = useState(blocks); const [lang, setLang] = useState('en'); const [speaking, setSpeaking] = useState(false)
  async function changeLang(code) { setLang(code); if (code === 'en') return setCur(blocks); setCur(null); try { const r = await api.post('/translate', { lang: code, texts: blocks }); setCur(r.texts) } catch { setCur(blocks) } }
  function toggleSpeak() { if (!('speechSynthesis' in window)) return; if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return } const u = new SpeechSynthesisUtterance((cur || blocks).join('. ')); u.lang = ttsCode(lang); u.rate = 0.97; u.onend = () => setSpeaking(false); speechSynthesis.speak(u); setSpeaking(true) }
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <span className="font-semibold text-sm">📄 Reading</span>
        <button onClick={toggleSpeak} className="ml-auto bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-sm font-semibold">{speaking ? '⏸ Stop' : '🔊 Listen'}</button>
        <select value={lang} onChange={(e) => changeLang(e.target.value)} className="rounded-lg border border-slate-200 text-sm px-2 py-1.5">{LANGS.map((l) => <option key={l[0]} value={l[0]}>{l[1]}</option>)}</select>
      </div>
      <div className="p-5 leading-relaxed text-[15px] text-slate-700">{!cur ? <div className="text-center text-slate-400">🌐 Translating…</div> : cur.map((p, i) => <p key={i} className="mb-3">{p}</p>)}</div>
    </div>
  )
}

function Quiz({ content }) {
  const qs = JSON.parse(content.quiz_json || '[]')
  const [answers, setAnswers] = useState(Array(qs.length).fill(null)); const [submitted, setSubmitted] = useState(false)
  const correct = answers.filter((a, i) => a === qs[i].a).length; const pct = Math.round((correct / qs.length) * 100)
  async function submit() { if (answers.includes(null)) return alert('Please answer all questions.'); setSubmitted(true); try { await api.post('/quiz-attempts', { content_id: content.id, score: correct, total: qs.length }); await api.post('/progress', { content_id: content.id, completed: 1 }) } catch {} }
  if (submitted) {
    const r = 54, c = 2 * Math.PI * r, o = c * (1 - pct / 100)
    return (
      <div className="text-center py-6">
        <div className="relative w-36 h-36 mx-auto mb-4"><svg width="144" height="144" className="-rotate-90"><circle cx="72" cy="72" r={r} stroke="#fde7ea" strokeWidth="12" fill="none" /><circle cx="72" cy="72" r={r} stroke="#c8102e" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} /></svg><div className="absolute inset-0 grid place-items-center text-3xl font-extrabold">{pct}%</div></div>
        <div className="text-xl font-bold">{pct >= 75 ? 'Excellent! 🎉' : pct >= 50 ? 'Good job 👍' : 'Keep practising 💪'}</div>
        <div className="text-slate-500 text-sm mt-1">{correct} of {qs.length} correct</div>
        <button onClick={() => { setAnswers(Array(qs.length).fill(null)); setSubmitted(false) }} className="mt-5 bg-indigo-600 text-white rounded-xl px-5 py-2.5 font-semibold">Retake</button>
      </div>
    )
  }
  return (
    <div>
      <div className="h-2 rounded bg-rose-100 overflow-hidden mb-4"><div className="h-full bg-indigo-600" style={{ width: `${answers.filter((a) => a !== null).length / qs.length * 100}%` }} /></div>
      {qs.map((q, qi) => (
        <div key={qi} className="bg-white border border-slate-200 rounded-2xl p-4 mb-3">
          <div className="font-medium mb-3 text-sm">{qi + 1}. {q.q}</div>
          {q.opts.map((o, oi) => <label key={oi} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border mb-2 cursor-pointer text-sm ${answers[qi] === oi ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}><input type="radio" checked={answers[qi] === oi} onChange={() => setAnswers(answers.map((a, i) => i === qi ? oi : a))} />{o}</label>)}
        </div>
      ))}
      <button onClick={submit} className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold">Submit quiz</button>
    </div>
  )
}

export default function ContentViewer({ content, onClose }) {
  const c = content
  const [img, setImg] = useState(null)
  const [csvUrl, setCsvUrl] = useState(null)

  useEffect(() => {
    if (c.type !== 'quiz') api.post('/progress', { content_id: c.id, completed: 1 }).catch(() => {})
    let url
    if (c.type === 'infographic') fetchBlobUrl(c.id).then((u) => { url = u; setImg(u) }).catch(() => {})
    if (c.type === 'csv') fetchBlobUrl(c.id).then((u) => { url = u; setCsvUrl(u) }).catch(() => {})
    return () => { url && URL.revokeObjectURL(url); window.speechSynthesis?.cancel() }
  }, [c.id])

  const wide = c.type === 'pdf' || c.type === 'ppt'
  const title = c.title || ({ youtube: 'Video lecture', pdf: 'Report', ppt: 'Slides', infographic: 'Infographic', quiz: 'Quiz', notes: 'Notes', csv: 'Data' }[c.type] || c.type)
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className={`bg-slate-50 rounded-3xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} my-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-white rounded-t-3xl sticky top-0 z-10">
          <div className="font-bold flex-1 truncate">{title}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="p-5">
          {c.type === 'youtube' && <>
            <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow"><iframe id="yt-frame" className="w-full h-full" src={`https://www.youtube.com/embed/${ytId(c.url) || ''}?enablejsapi=1&rel=0`} allowFullScreen /></div>
            {c.transcript && <Transcript lines={JSON.parse(c.transcript)} />}
          </>}
          {c.type === 'infographic' && (img ? <img src={img} className="w-full rounded-2xl border" alt="" /> : <div className="text-center text-slate-400 py-10">Loading…</div>)}
          {c.type === 'pdf' && <><PdfBook loader={() => fetchBuf(c.id)} />{c.text_content && <DocText text={c.text_content} />}</>}
          {c.type === 'ppt' && <PptView id={c.id} />}
          {c.type === 'csv' && <div className="text-center py-8">{csvUrl ? <a className="bg-indigo-600 text-white rounded-xl px-5 py-3 font-semibold" href={csvUrl} download={(c.title || 'data') + '.csv'}>⬇ Download data file</a> : 'Loading…'}</div>}
          {c.type === 'notes' && (c.text_content ? <DocText text={c.text_content} /> : <div className="text-center text-slate-400 py-8">No notes.</div>)}
          {c.type === 'quiz' && <Quiz content={c} />}
        </div>
      </div>
    </div>
  )
}
