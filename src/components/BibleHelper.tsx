import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowUp, BookOpenText, EyeOff } from 'lucide-react'
import KidsPage from './KidsPage'
import { askBibleBuddy, listMyBibleBuddyHistory } from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

// Bible Helper - Claude Design handoff, Bible Helper.dc.html. The chat runs
// on the ministry's own Bible Buddy function, so every question and answer
// is kept and a teacher can see it (unless the child asks without their name).

const STARTERS = ['Why did God make rainbows?', 'Who was the bravest person in the Bible?', 'How do I pray?', 'What does it mean that God loves me?']
const BADGE = 'linear-gradient(150deg,#6f9bff,#4f2bd6)'
const SEND = 'linear-gradient(135deg,#6f9bff,#4f5bff)'

type Msg = { id: string; me: boolean; t: string; anon?: boolean }

export default function BibleHelperPage({ onExit, onAskTeacher, onEars }: { onExit: () => void; onAskTeacher: () => void; onEars: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loaded, setLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listMyBibleBuddyHistory()
      .then((rows) => setMsgs(rows.flatMap((r) => [{ id: `${r.id}q`, me: true, t: r.question, anon: r.is_anonymous }, { id: `${r.id}a`, me: false, t: r.answer }])))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
  }, [msgs.length, thinking])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || thinking) return
    playClick()
    const anon = anonymous
    setMsgs((m) => [...m, { id: crypto.randomUUID(), me: true, t: q, anon }])
    setDraft('')
    setThinking(true)
    let reply: string
    try {
      reply = (await askBibleBuddy(q, anon)).trim()
      haptics.success()
    } catch (e) {
      reply = e instanceof Error && e.message ? e.message : 'Sorry, I couldn’t answer just now. Please try again in a moment.'
      haptics.error()
    }
    setMsgs((m) => [...m, { id: crypto.randomUUID(), me: false, t: reply }])
    setThinking(false)
  }

  const ready = draft.trim() !== '' && !thinking
  const link: CSSProperties = { padding: 0, border: 'none', background: 'none', color: '#c86be0', font: 'inherit', cursor: 'pointer' }

  return (
    <KidsPage
      label="Bible Helper"
      page="helper"
      glow="rgba(79,123,255,.28)"
      starSeed={23}
      starCount={30}
      celestial={false}
      width={860}
      mainBorderBox
      mainPadding="24px clamp(12px,2.5vw,28px) 170px"
      onExit={onExit}
      overlay={
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20, padding: '14px clamp(12px,2.5vw,28px) 18px', background: 'linear-gradient(180deg,transparent,var(--bg) 35%)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, padding: 8, borderRadius: 999, background: 'var(--card)', border: '1px solid var(--hair2)', boxShadow: '0 14px 40px -16px rgba(0,0,0,.5)' }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    ask(draft)
                  }
                }}
                placeholder="Ask a Bible question…"
                maxLength={300}
                aria-label="Ask a Bible question"
                style={{ flex: 1, minWidth: 0, padding: '12px 16px', border: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 16, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => ask(draft)}
                aria-label="Send"
                disabled={!ready}
                style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', border: 'none', background: ready ? SEND : 'rgba(127,127,160,.4)', color: '#fff', cursor: ready ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowUp style={{ width: 20, height: 20 }} strokeWidth={2} />
              </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} style={{ width: 15, height: 15, margin: 0, accentColor: '#6f9bff' }} />
              Ask without my name
            </label>
            <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--faint)' }}>
              Your helper can make mistakes. For big worries,{' '}
              <button type="button" onClick={onAskTeacher} style={link}>
                talk to your teacher
              </button>{' '}
              or use{' '}
              <button type="button" onClick={onEars} style={link}>
                Ears for You
              </button>
              .
            </p>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loaded && msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0 10px', animation: 'kp-rise .5s both' }}>
            <span style={{ display: 'flex', margin: '0 auto', width: 92, height: 92, borderRadius: 30, background: BADGE, alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -14px rgba(79,91,255,.8)', animation: 'kp-float 3.4s ease-in-out infinite' }}>
              <BookOpenText style={{ width: 46, height: 46, color: '#fff' }} strokeWidth={2} />
            </span>
            <h1 style={{ margin: '20px 0 0', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(40px,6vw,64px)', lineHeight: 0.95, letterSpacing: '-.04em', color: 'var(--ink)' }}>Ask the Bible</h1>
            <p style={{ margin: '12px auto 0', maxWidth: 460, fontSize: 16, lineHeight: 1.6 }}>Ask any question about God, the Bible or Bible stories. Your helper answers with real verses.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 26 }}>
              {STARTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="kp-starter"
                  onClick={() => ask(t)}
                  style={{ padding: '12px 16px', borderRadius: 16, border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end', animation: 'kp-rise .35s both' }}>
            {!m.me && (
              <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 12, background: BADGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpenText style={{ width: 18, height: 18, color: '#fff' }} strokeWidth={2} />
              </span>
            )}
            <div
              style={{
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: m.me ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                background: m.me ? SEND : 'var(--bot)',
                border: `1px solid ${m.me ? 'transparent' : 'var(--hair)'}`,
                color: m.me ? '#fff' : 'var(--ink)',
                fontSize: 16,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                textWrap: 'pretty',
                overflowWrap: 'anywhere',
              }}
            >
              {m.anon && <EyeOff aria-label="Asked without your name" style={{ display: 'inline-block', width: 14, height: 14, marginRight: 6, verticalAlign: '-2px', opacity: 0.75 }} strokeWidth={2} />}
              {m.t}
            </div>
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, background: BADGE }} />
            <div style={{ display: 'flex', gap: 6, padding: '18px 20px', borderRadius: '20px 20px 20px 6px', background: 'var(--bot)', border: '1px solid var(--hair)' }}>
              {[0, 0.15, 0.3].map((d) => (
                <span key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6f9bff', animation: `kp-typing 1.2s ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </KidsPage>
  )
}
