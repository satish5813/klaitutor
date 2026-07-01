import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

// Safe light formatting: **bold** + newlines. React escapes text nodes, so no XSS.
function Formatted({ text }) {
  const nodes = []
  String(text || '').split(/(\*\*[^*]+?\*\*)/g).forEach((chunk, ci) => {
    if (/^\*\*[^*]+?\*\*$/.test(chunk)) {
      nodes.push(<strong key={'b' + ci}>{chunk.slice(2, -2)}</strong>)
    } else {
      const lines = chunk.split('\n')
      lines.forEach((ln, li) => {
        nodes.push(<span key={ci + '-' + li}>{ln}</span>)
        if (li < lines.length - 1) nodes.push(<br key={ci + '-br-' + li} />)
      })
    }
  })
  return <>{nodes}</>
}

const Dots = () => (
  <span className="flex gap-1 py-1">
    <i className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
    <i className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
    <i className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
  </span>
)

/**
 * Per-session AI Tutor chat. Topic-locked to this session, any language,
 * teacher-level. Talks ONLY to the backend (POST /tutor-chat) — the Anthropic
 * key stays server-side. Question limit is enforced + reported by the backend.
 */
export default function AiTutor({ sessionId, title }) {
  const [messages, setMessages] = useState(null) // null = loading
  const [remaining, setRemaining] = useState(null)
  const [limit, setLimit] = useState(20)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => {
    let ok = true
    api.get(`/tutor-chat/${sessionId}/history`)
      .then((d) => { if (!ok) return; setMessages(d.messages || []); setLimit(d.limit); setRemaining(d.remaining) })
      .catch((e) => { if (ok) setMessages([{ role: 'assistant', content: '⚠️ ' + e.message }]) })
    return () => { ok = false }
  }, [sessionId])

  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight }, [messages, busy])

  const out = remaining != null && remaining <= 0

  async function send() {
    const qtext = input.trim()
    if (!qtext || busy || out) return
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setMessages((m) => [...(m || []), { role: 'user', content: qtext }])
    setBusy(true)
    try {
      const d = await api.post('/tutor-chat', { session_id: sessionId, question: qtext })
      setMessages((m) => [...m, { role: 'assistant', content: d.answer || '…' }])
      if (typeof d.remaining === 'number') setRemaining(d.remaining)
      if (typeof d.limit === 'number') setLimit(d.limit)
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ ' + e.message }])
    }
    setBusy(false)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }
  function grow(e) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="mt-3 border border-indigo-100 rounded-2xl overflow-hidden bg-indigo-50/30">
      <div className="px-4 py-2.5 bg-white border-b border-indigo-100 flex items-center gap-2">
        <span>🤖</span>
        <span className="text-sm font-semibold">AI Tutor</span>
        <span className="text-xs text-slate-400 hidden sm:inline">— ask about this lesson, any language</span>
        {remaining != null && <span className="ml-auto text-[11px] text-slate-400">{remaining}/{limit} left</span>}
      </div>

      <div ref={scrollRef} className="max-h-80 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages == null ? (
          <div className="text-center text-xs text-slate-400 py-6">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-6">👋 Ask your first question about<br /><b>&ldquo;{title}&rdquo;</b></div>
        ) : messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'gap-2'}`}>
            {m.role !== 'user' && <span className="w-7 h-7 rounded-full bg-indigo-100 grid place-items-center text-sm flex-none">🤖</span>}
            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[85%] break-words ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
              <Formatted text={m.content} />
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <span className="w-7 h-7 rounded-full bg-indigo-100 grid place-items-center text-sm flex-none">🤖</span>
            <div className="px-3 rounded-2xl bg-white border border-slate-200 grid place-items-center"><Dots /></div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 p-2.5 border-t border-indigo-100 bg-white">
        <textarea ref={taRef} rows={1} value={input} onChange={grow} onKeyDown={onKey} disabled={out}
          placeholder={out ? 'Question limit reached for this lesson.' : 'Type your question…'}
          className="flex-1 resize-none max-h-32 border border-indigo-200 focus:border-indigo-500 outline-none rounded-xl px-3 py-2 text-sm disabled:bg-slate-50" />
        <button onClick={send} disabled={busy || out || !input.trim()} aria-label="Send"
          className="w-10 h-10 flex-none rounded-xl bg-indigo-600 text-white grid place-items-center disabled:opacity-40">➤</button>
      </div>
    </div>
  )
}
