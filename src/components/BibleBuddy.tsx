import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, MessageCircleQuestion, EyeOff } from 'lucide-react'
import { askBibleBuddy, listMyBibleBuddyHistory, type AiCompanionMessageRow } from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function BibleBuddyChat({ onAskTeacher }: { onAskTeacher: () => void }) {
  const [history, setHistory] = useState<AiCompanionMessageRow[]>([])
  const [question, setQuestion] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listMyBibleBuddyHistory().then(setHistory)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.length, asking])

  const ask = async () => {
    const q = question.trim()
    if (!q || asking) return
    setError('')
    setAsking(true)
    setQuestion('')
    try {
      const answer = await askBibleBuddy(q, anonymous)
      setHistory((h) => [...h, { id: crypto.randomUUID(), question: q, answer, is_anonymous: anonymous, created_at: new Date().toISOString() }])
      haptics.success()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bible Buddy could not answer that - try again.')
      haptics.error()
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
        {history.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--hero-accent)' }}>
              <Sparkles className="h-6 w-6 text-white" />
            </span>
            <p className="text-sm font-bold text-white">Hi, I&apos;m Bible Buddy!</p>
            <p className="max-w-xs text-xs text-white/60">Ask me any question about the Bible, and I&apos;ll do my best to answer.</p>
          </div>
        )}

        {history.map((m) => (
          <div key={m.id} className="space-y-1.5">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-white/15 px-3 py-2 text-sm text-white">
              {m.is_anonymous && <EyeOff className="mb-1 inline h-3 w-3 opacity-60" />} {m.question}
            </div>
            <div className="mr-auto max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-white" style={{ background: 'color-mix(in srgb, var(--hero-accent) 30%, #15101f)' }}>
              <p>{m.answer}</p>
              <button onClick={onAskTeacher} className="text-xs font-bold underline opacity-80 hover:opacity-100">
                Ask your teacher instead
              </button>
            </div>
          </div>
        ))}

        {asking && <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm text-white/50">Thinking…</div>}
        {error && <p className="text-center text-xs text-red-300">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-3.5 w-3.5" />
          Ask without my name (your teacher will only see the question)
        </label>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (playClick(), ask())}
            placeholder="Ask a Bible question…"
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-white/30"
          />
          <button
            onClick={() => {
              playClick()
              ask()
            }}
            disabled={asking || !question.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
            style={{ background: 'var(--hero-accent)' }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <button onClick={onAskTeacher} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/5 py-2 text-xs font-bold text-white/70">
          <MessageCircleQuestion className="h-3.5 w-3.5" /> Ask your teacher instead
        </button>
      </div>
    </div>
  )
}
