import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { CircleCheck, Flame } from 'lucide-react'
import KidsPage, { Confetti, HeaderChip } from './KidsPage'
import { makeConfetti } from '../design/kidsConfetti'
import { completeBibleReading, getMyBibleStreak, listMyReadingPlans, type ReadingPlanForMe } from '../lib/ministry'
import { bibleComUrl } from '../lib/bibleLink'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

// Bible Reading Plan - Claude Design handoff, Bible Reading Plan.dc.html. The
// plans are the ones the ministry runs (Admin > Bible plans); each day read is
// recorded once and earns the same 10 points the reading always has.

const LOOKS = [
  { img: '/scenes/david.jpg', c2: '#7a2a0e' },
  { img: '/scenes/u5.jpg', c2: '#3d1259' },
  { img: '/scenes/solomon.jpg', c2: '#07665a' },
]
const CONFETTI = makeConfetti(8, 34)
const display = "'Bricolage Grotesque', sans-serif"
const card: CSSProperties = { borderRadius: 28, background: 'var(--card)', border: '1px solid var(--hair)' }

const firstUnread = (p: ReadingPlanForMe) => Math.max(0, p.readings.findIndex((r) => !p.done.has(r.id)))

export default function ReadingPlanPage({ onExit }: { onExit: () => void }) {
  const [plans, setPlans] = useState<ReadingPlanForMe[] | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [day, setDay] = useState(0)
  const [streak, setStreak] = useState(0)
  const [marking, setMarking] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confetti, setConfetti] = useState(false)
  const ct = useRef<number | undefined>(undefined)

  useEffect(() => {
    listMyReadingPlans()
      .then((ps) => {
        setPlans(ps)
        if (ps[0]) {
          setPlanId(ps[0].id)
          setDay(firstUnread(ps[0]))
        }
      })
      .catch(() => {
        setPlans([])
        setError('Could not open the reading plans just now.')
      })
    getMyBibleStreak()
      .then((n) => setStreak(Number(n) || 0))
      .catch(() => {})
    return () => window.clearTimeout(ct.current)
  }, [])

  const plan = plans?.find((p) => p.id === planId) ?? null
  const reading = plan?.readings[day] ?? null
  const read = !!(reading && plan?.done.has(reading.id))

  const markRead = async () => {
    if (!plan || !reading || marking) return
    setMarking(true)
    setError('')
    try {
      await completeBibleReading(reading.id)
      setPlans((ps) => ps?.map((p) => (p.id === plan.id ? { ...p, done: new Set([...p.done, reading.id]) } : p)) ?? ps)
      setLast(reading.id)
      haptics.success()
      setConfetti(true)
      window.clearTimeout(ct.current)
      ct.current = window.setTimeout(() => setConfetti(false), 1500)
      getMyBibleStreak()
        .then((n) => setStreak(Number(n) || 0))
        .catch(() => {})
    } catch {
      setError('That did not save. Please try again.')
      haptics.error()
    } finally {
      setMarking(false)
    }
  }

  return (
    <KidsPage
      label="Bible Reading Plan"
      page="reading"
      glow="rgba(255,138,61,.25)"
      glowAt="30% 0%"
      starSeed={8}
      starCount={30}
      celestial={false}
      onExit={onExit}
      right={
        <HeaderChip bg="rgba(255,138,61,.15)" col="#ff8a3d">
          <Flame style={{ width: 18, height: 18, animation: 'kp-flame 1.2s ease-in-out infinite' }} strokeWidth={2} />
          {streak}
        </HeaderChip>
      }
      overlay={confetti ? <Confetti pieces={CONFETTI} /> : null}
    >
      <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid var(--hair2)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#ff8a3d' }}>Bible Reading Plan</span>
      <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 'clamp(44px,6vw,76px)', lineHeight: 0.92, letterSpacing: '-.045em', color: 'var(--ink)', margin: '16px 0 0' }}>A little every day</h1>
      <p style={{ margin: '14px 0 0', fontSize: 17, lineHeight: 1.6, maxWidth: 560 }}>Pick a plan, read today&apos;s passage, and keep your streak alive. Each day read earns 10 points.</p>

      {plans && plans.length === 0 && (
        <p style={{ margin: '30px 0 0', padding: 30, borderRadius: 24, border: '1px dashed var(--hair2)', textAlign: 'center', color: 'var(--muted)' }}>
          {error || 'There’s no reading plan running right now. Your teacher will start one soon, and a Bible Journey lesson keeps your streak going too.'}
        </p>
      )}

      {plans && plans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))', gap: 14, marginTop: 30 }}>
          {plans.map((p, i) => {
            const look = LOOKS[i % LOOKS.length]
            const d = p.done.size
            const total = p.readings.length
            return (
              <button
                key={p.id}
                type="button"
                className="kp-lift"
                aria-pressed={p.id === planId}
                onClick={() => {
                  playClick()
                  setPlanId(p.id)
                  setDay(firstUnread(p))
                }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  minHeight: 180,
                  padding: 20,
                  borderRadius: 26,
                  border: `3px solid ${p.id === planId ? '#ffd84d' : 'transparent'}`,
                  background: `linear-gradient(180deg,transparent 15%,${look.c2} 85%),url(${look.img}) center/cover,${look.c2}`,
                  color: '#fff',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ position: 'absolute', top: 14, right: 14, padding: '5px 11px', borderRadius: 999, background: 'rgba(0,0,0,.4)', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{d ? `${d}/${total}` : 'New'}</span>
                <span style={{ fontFamily: display, fontWeight: 800, fontSize: 24, letterSpacing: '-.02em' }}>{p.title}</span>
                <span style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>
                  {total} days{p.description ? ` · ${p.description}` : ''}
                </span>
                <span style={{ marginTop: 12, height: 6, borderRadius: 9, background: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${total ? Math.round((d / total) * 100) : 0}%`, background: '#ffd84d', borderRadius: 9 }} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {plan && reading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 20, marginTop: 24, alignItems: 'start' }}>
          <div key={reading.id} style={{ ...card, padding: 28, animation: 'kp-rise20 .45s both' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ff8a3d' }}>
              {plan.title.toUpperCase()} · DAY {reading.day_number}
            </p>
            <h2 style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(28px,3.4vw,38px)', lineHeight: 1.02, letterSpacing: '-.03em', color: 'var(--ink)' }}>{reading.title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <span style={{ fontWeight: 800, color: '#ff8a3d' }}>{reading.reference}</span>
              <a href={bibleComUrl(reading.reference)} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', borderRadius: 999, background: 'var(--track)', fontSize: 12, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                Read on Bible.com ↗
              </a>
            </div>
            {reading.passage_text && <p style={{ margin: '18px 0 0', fontSize: 16, lineHeight: 1.7 }}>&ldquo;{reading.passage_text}&rdquo;</p>}
            {error && <p style={{ margin: '14px 0 0', fontSize: 14, fontWeight: 700, color: '#ff5b6b' }}>{error}</p>}
            {read ? (
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 18, background: 'rgba(47,224,181,.12)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#13b48c' }}>
                  <CircleCheck style={{ width: 20, height: 20 }} strokeWidth={2} />
                  Day {reading.day_number} done
                </span>
                {day + 1 < plan.readings.length && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick()
                      setDay(day + 1)
                    }}
                    style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#13b48c', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Next day →
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="kp-3d"
                onClick={markRead}
                disabled={marking}
                style={
                  {
                    marginTop: 20,
                    width: '100%',
                    padding: 17,
                    borderRadius: 18,
                    border: 'none',
                    background: 'linear-gradient(180deg,#ff9a4d,#e0452a)',
                    ['--sh3' as string]: '#8a2a12',
                    boxShadow: '0 5px 0 #8a2a12',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: 16,
                    letterSpacing: '.04em',
                    cursor: 'pointer',
                    opacity: marking ? 0.7 : 1,
                  } as CSSProperties
                }
              >
                {marking ? 'SAVING…' : 'I READ IT · +10 POINTS'}
              </button>
            )}
          </div>

          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <h3 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>All days</h3>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)' }}>
                {plan.done.size} / {plan.readings.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(52px,1fr))', gap: 8, marginTop: 16 }}>
              {plan.readings.map((r, i) => {
                const isDone = plan.done.has(r.id)
                const cur = i === day
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="kp-day"
                    title={r.title}
                    aria-label={`Day ${r.day_number}: ${r.title}${isDone ? ', done' : ''}`}
                    aria-current={cur}
                    onClick={() => setDay(i)}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: 14,
                      border: `2px solid ${cur ? '#ff8a3d' : isDone ? '#13b48c' : 'var(--hair2)'}`,
                      background: isDone ? '#13b48c' : cur ? 'rgba(255,138,61,.14)' : 'transparent',
                      color: isDone ? '#fff' : 'var(--ink)',
                      fontFamily: display,
                      fontWeight: 800,
                      fontSize: 17,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: isDone && r.id === last ? 'kp-daypop .5s both' : 'none',
                    }}
                  >
                    {r.day_number}
                  </button>
                )
              })}
            </div>
            {plan.readings.length > 0 && plan.done.size === plan.readings.length && (
              <p style={{ margin: '16px 0 0', padding: 14, borderRadius: 16, background: 'rgba(255,201,60,.14)', fontWeight: 800, color: '#d99a00', textAlign: 'center' }}>Plan complete! Well done for reading every day.</p>
            )}
          </div>
        </div>
      )}
    </KidsPage>
  )
}
