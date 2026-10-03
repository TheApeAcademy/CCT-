import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Globe, GraduationCap, HandHeart, Heart, House, Lightbulb, RefreshCw, Smile, Sparkles, Star, Trash2, Users, type LucideIcon } from 'lucide-react'
import KidsPage, { Confetti, HeaderChip } from './KidsPage'
import { makeConfetti } from '../design/kidsConfetti'
import { addPrayer, listMyPrayers, removePrayer, savePrayer, type Prayer, type PrayerCategory } from '../lib/prayerJournal'
import { flagEmoji, getCountryForOffset } from '../content/prayerCountries'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

// Prayer Journal - Claude Design handoff, Prayer Journal.dc.html. Prayers are
// the child's private notes (see lib/prayerJournal); Pray for the World uses
// the ministry's country-of-the-day list, so every child lands on the same
// country, and remembers on this device which countries they prayed for.

const CATS: { id: PrayerCategory; label: string; icon: LucideIcon; c: string }[] = [
  { id: 'family', label: 'Family', icon: House, c: '#ff8a3d' },
  { id: 'friends', label: 'Friends', icon: Users, c: '#ff4fa3' },
  { id: 'school', label: 'School', icon: GraduationCap, c: '#2fe0b5' },
  { id: 'me', label: 'Me', icon: Smile, c: '#c13bff' },
  { id: 'world', label: 'The World', icon: Globe, c: '#4f7bff' },
  { id: 'thanks', label: 'Thank You', icon: Heart, c: '#e0a400' },
]
const IDEAS = [
  'Thank God for one thing that made you smile today.',
  'Pray for someone in your class by name.',
  'Ask God to help you be kind to your family.',
  'Pray for children who don’t have enough food.',
  'Ask God to help you with something you find hard.',
  'Pray for your Sunday school teacher.',
  'Thank God for your church family.',
]
const CONFETTI = makeConfetti(41, 36)
const JARPOS = Array.from({ length: 24 }, (_, i) => ({ x: 8 + ((i * 37) % 70), y: 4 + Math.floor(i / 4) * 13 + (i % 2) * 4 }))
const WORLD_KEY = 'mfm-world-prayed'

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`
}
const eyebrow: CSSProperties = { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }
const display = "'Bricolage Grotesque', sans-serif"
const card: CSSProperties = { padding: 24, borderRadius: 28, background: 'var(--card)', border: '1px solid var(--hair)', boxShadow: '0 14px 40px -24px var(--sh)' }

function loadWorld(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(WORLD_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export default function PrayerJournalPage({ onExit }: { onExit: () => void }) {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [days, setDays] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [cat, setCat] = useState<PrayerCategory>('family')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'open' | 'answered'>('open')
  const [idea, setIdea] = useState(0)
  const [quiet, setQuiet] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [wi, setWi] = useState(0)
  const [world, setWorld] = useState<string[]>(loadWorld)
  const qt = useRef<number | undefined>(undefined)
  const ct = useRef<number | undefined>(undefined)

  const load = () =>
    listMyPrayers()
      .then(({ prayers, days }) => {
        setPrayers(prayers)
        setDays(days)
      })
      .catch(() => setError('Could not open your journal just now.'))
      .finally(() => setLoaded(true))

  useEffect(() => {
    load()
    return () => {
      window.clearInterval(qt.current)
      window.clearTimeout(ct.current)
    }
  }, [])

  const celebrate = (ms: number) => {
    setConfetti(true)
    window.clearTimeout(ct.current)
    ct.current = window.setTimeout(() => setConfetti(false), ms)
  }

  /** Changes one prayer on screen at once and puts it back if saving fails. */
  const change = async (p: Prayer, next: Prayer) => {
    setPrayers((all) => all.map((x) => (x.id === p.id ? next : x)))
    try {
      await savePrayer(next)
    } catch {
      setPrayers((all) => all.map((x) => (x.id === p.id ? p : x)))
      setError('That did not save. Please try again.')
    }
  }

  const add = async () => {
    const text = draft.trim()
    if (!text || saving) return
    playClick()
    setSaving(true)
    setError('')
    try {
      const p = await addPrayer(cat, text)
      setPrayers((all) => [p, ...all])
      setDraft('')
      setTab('open')
      haptics.success()
      load()
    } catch {
      setError('Your prayer did not save. Please try again.')
      haptics.error()
    } finally {
      setSaving(false)
    }
  }

  const toggleQuiet = () => {
    playClick()
    if (quiet) {
      window.clearInterval(qt.current)
      setQuiet(0)
      return
    }
    setQuiet(60)
    qt.current = window.setInterval(() => {
      setQuiet((q) => {
        if (q <= 1) {
          window.clearInterval(qt.current)
          return 0
        }
        return q - 1
      })
    }, 1000)
  }

  const all = [...prayers].sort((a, b) => b.at.localeCompare(a.at))
  const open = all.filter((p) => !p.answered)
  const ans = all.filter((p) => p.answered)
  const shown = tab === 'open' ? open : ans
  const canAdd = draft.trim().length > 0 && !saving

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const country = getCountryForOffset(today, wi)
  const didWorld = world.includes(country.code)
  const prayWorld = () => {
    if (didWorld) return
    playClick()
    haptics.success()
    const next = [...world, country.code]
    setWorld(next)
    try {
      localStorage.setItem(WORLD_KEY, JSON.stringify(next))
    } catch {
      // Remembered on this device only; fine if it does not stick.
    }
    celebrate(1400)
  }
  const shownDay = new Date(today)
  shownDay.setDate(shownDay.getDate() + wi)
  const wPlace = wi === 0 ? 'Country of the day' : wi === 1 ? 'Tomorrow’s country' : shownDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <KidsPage
      label="Prayer Journal"
      glow="rgba(79,123,255,.28)"
      glowAt="70% 0%"
      starSeed={41}
      starCount={34}
      backLabel="My House"
      backIcon={House}
      sunMoon={{ right: '5%', top: 96, size: 84, fixed: true }}
      onExit={onExit}
      right={
        <HeaderChip bg="rgba(79,123,255,.14)" col="#6f9bff">
          <HandHeart style={{ width: 18, height: 18 }} strokeWidth={2} />
          {days} {days === 1 ? 'day' : 'days'}
        </HeaderChip>
      }
      overlay={confetti ? <Confetti pieces={CONFETTI} /> : null}
    >
      <div style={{ maxWidth: 640 }}>
        <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid var(--hair2)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6f9bff' }}>My Prayer Journal</span>
        <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 'clamp(44px,6vw,76px)', lineHeight: 0.92, letterSpacing: '-.045em', color: 'var(--ink)', margin: '16px 0 0' }}>Talk to God</h1>
        <p style={{ margin: '14px 0 0', fontSize: 17, lineHeight: 1.6 }}>Write your prayers, keep praying for them, and mark them when God answers. Only you can see this journal.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 20, marginTop: 32, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,201,60,.12)', border: '1px solid rgba(255,201,60,.3)' }}>
              <Lightbulb style={{ flexShrink: 0, width: 22, height: 22, marginTop: 1, color: '#e0a400' }} strokeWidth={2} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: '#d99a00' }}>TODAY&apos;S IDEA</p>
                <p style={{ margin: '3px 0 0', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{IDEAS[idea % IDEAS.length]}</p>
              </div>
              <button
                type="button"
                onClick={() => setIdea((i) => i + 1)}
                aria-label="Another idea"
                style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--hair2)', background: 'transparent', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} strokeWidth={2} />
              </button>
            </div>
            <p style={{ ...eyebrow, margin: '20px 0 10px', color: 'var(--muted)' }}>I&apos;m praying for…</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATS.map((c) => {
                const on = cat === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCat(c.id)}
                    aria-pressed={on}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 999, border: `1.5px solid ${on ? c.c : 'var(--hair2)'}`, background: on ? c.c + '22' : 'transparent', color: on ? c.c : 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all .2s' }}
                  >
                    <c.icon style={{ width: 16, height: 16 }} strokeWidth={2} />
                    {c.label}
                  </button>
                )
              })}
            </div>
            <textarea
              className="kp-field"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Dear God…"
              aria-label="Your prayer"
              style={{ marginTop: 16, width: '100%', boxSizing: 'border-box', padding: '16px 18px', borderRadius: 20, border: '1px solid var(--hair2)', background: 'var(--field)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 16, lineHeight: 1.6, outline: 'none', resize: 'vertical' }}
            />
            {error && <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 700, color: '#ff5b6b' }}>{error}</p>}
            <button
              type="button"
              className="kp-3d"
              onClick={add}
              disabled={!canAdd}
              style={
                {
                  marginTop: 14,
                  width: '100%',
                  padding: 16,
                  borderRadius: 18,
                  border: 'none',
                  background: canAdd ? 'linear-gradient(180deg,#6f9bff,#4f5bff)' : 'var(--track)',
                  ['--sh3' as string]: canAdd ? '#2a2fa0' : 'transparent',
                  boxShadow: `0 5px 0 ${canAdd ? '#2a2fa0' : 'transparent'}`,
                  color: canAdd ? '#fff' : 'var(--faint)',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: '.04em',
                  cursor: canAdd ? 'pointer' : 'default',
                  transition: 'transform .1s',
                } as CSSProperties
              }
            >
              {saving ? 'SAVING…' : 'AMEN, SAVE MY PRAYER'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(
              [
                ['open', 'Still praying', open.length],
                ['answered', 'Answered', ans.length],
              ] as const
            ).map(([k, label, count]) => {
              const on = tab === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  aria-pressed={on}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, border: `1px solid ${on ? 'var(--ink)' : 'var(--hair2)'}`, background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--bg)' : 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
                >
                  {label}
                  <span style={{ minWidth: 22, height: 22, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: on ? 'rgba(127,127,127,.25)' : 'var(--track)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
                </button>
              )
            })}
          </div>
          {loaded && shown.length === 0 && (
            <p style={{ margin: 0, padding: 30, borderRadius: 24, border: '1px dashed var(--hair2)', textAlign: 'center', color: 'var(--muted)' }}>
              {tab === 'open' ? 'No prayers yet. Write your first one above.' : 'When God answers a prayer, mark it and it lands here.'}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shown.map((p) => {
              const c = CATS.find((x) => x.id === p.cat) ?? CATS[3]
              return (
                <div key={p.id} style={{ position: 'relative', padding: '18px 20px', borderRadius: 24, background: 'var(--card)', border: `1px solid ${p.answered ? 'rgba(255,201,60,.45)' : 'var(--hair)'}`, boxShadow: '0 10px 30px -22px var(--sh)', animation: 'kp-up .45s both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: c.c + '22', color: c.c, fontSize: 12, fontWeight: 800 }}>
                      <c.icon style={{ width: 13, height: 13 }} strokeWidth={2} />
                      {c.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>{ago(p.at)}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>Prayed {p.prayed}×</span>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--ink)', textWrap: 'pretty', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.text}</p>
                  {p.answered ? (
                    <p style={{ margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, color: '#d99a00' }}>
                      <Star style={{ width: 18, height: 18 }} strokeWidth={2} />
                      God answered · {ago(p.answered)}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      <button
                        type="button"
                        className="kp-ghost"
                        onClick={() => {
                          playClick()
                          change(p, { ...p, prayed: p.prayed + 1 })
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--hair2)', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                      >
                        <HandHeart style={{ width: 15, height: 15 }} strokeWidth={2} />I prayed again
                      </button>
                      <button
                        type="button"
                        className="kp-3d"
                        onClick={() => {
                          haptics.success()
                          change(p, { ...p, answered: new Date().toISOString() })
                          celebrate(1500)
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 14, border: 'none', background: 'linear-gradient(180deg,#ffe066,#f0a400)', ['--sh3' as string]: '#9a6a00', boxShadow: '0 3px 0 #9a6a00', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' } as CSSProperties}
                      >
                        <Sparkles style={{ width: 15, height: 15 }} strokeWidth={2} />
                        God answered!
                      </button>
                      <button
                        type="button"
                        className="kp-trash"
                        onClick={() => {
                          if (!window.confirm('Delete this prayer?')) return
                          setPrayers((all) => all.filter((x) => x.id !== p.id))
                          removePrayer(p.id).catch(() => {
                            setError('That prayer was not deleted. Please try again.')
                            load()
                          })
                        }}
                        aria-label="Delete prayer"
                        style={{ marginLeft: 'auto', width: 38, height: 38, borderRadius: 12, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div key={wi} style={{ position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 28, background: 'linear-gradient(155deg,#13b48c,#0b4f6b)', color: '#fff', animation: 'kp-up .45s both' }}>
            <Globe style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, color: 'rgba(255,255,255,.12)', animation: 'kp-float 6s ease-in-out infinite' }} strokeWidth={2} />
            <p style={{ ...eyebrow, position: 'relative', opacity: 0.85 }}>PRAY FOR THE WORLD</p>
            <p style={{ position: 'relative', margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 34, lineHeight: 1, letterSpacing: '-.03em' }}>
              {country.name} <span aria-hidden>{flagEmoji(country.code)}</span>
            </p>
            <p style={{ position: 'relative', margin: '4px 0 0', fontSize: 14, fontWeight: 700, opacity: 0.85 }}>{wPlace}</p>
            <p style={{ position: 'relative', margin: '16px 0 0', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5 }}>
              <Heart style={{ flexShrink: 0, marginTop: 3, width: 14, height: 14, color: '#ffd84d' }} strokeWidth={2} />
              {country.focus}
            </p>
            <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={prayWorld}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: 'none', background: didWorld ? 'rgba(255,255,255,.2)' : '#fff', color: didWorld ? '#fff' : '#0b4f6b', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: didWorld ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {didWorld ? 'Prayed ✓' : 'I prayed for ' + country.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick()
                  setWi((i) => i + 1)
                }}
                aria-label="Next country"
                style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.35)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Next →
              </button>
            </div>
            <p style={{ position: 'relative', margin: '12px 0 0', fontSize: 12, fontWeight: 800, opacity: 0.8 }}>
              {world.length} {world.length === 1 ? 'country' : 'countries'} prayed for
            </p>
          </div>

          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <p style={{ ...eyebrow, color: 'var(--muted)' }}>My Answered Prayers Jar</p>
            <div style={{ position: 'relative', marginTop: 18, width: 170, height: 210 }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 96, height: 22, borderRadius: 8, background: 'linear-gradient(180deg,#c86be0,#7a2bd6)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: 18, bottom: 0, borderRadius: '36px 36px 46px 46px', border: '3px solid var(--hair2)', background: 'linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.14) 30%,rgba(255,255,255,.04))', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.min(100, ans.length * 12)}%`, background: 'linear-gradient(180deg,rgba(255,216,77,.25),rgba(255,201,60,.5))', transition: 'height 1s cubic-bezier(.34,1.56,.64,1)' }} />
                {JARPOS.slice(0, Math.min(ans.length, 24)).map((j, i) => (
                  <Star
                    key={i}
                    style={{ position: 'absolute', left: `${j.x}%`, bottom: `${j.y}%`, width: 22, height: 22, color: '#ffd84d', filter: 'drop-shadow(0 2px 4px rgba(160,100,0,.5))', animation: 'kp-fall .9s cubic-bezier(.3,1.4,.6,1) both', animationDelay: `${(i * 0.08).toFixed(2)}s` }}
                    strokeWidth={2}
                  />
                ))}
              </div>
            </div>
            <p style={{ margin: '16px 0 0', fontFamily: display, fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'var(--ink)' }}>{ans.length}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted)' }}>prayers answered so far</p>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 28, background: 'linear-gradient(150deg,#4f7bff,#2a1f7a)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <p style={{ ...eyebrow, opacity: 0.85 }}>Quiet Minute</p>
            <div style={{ position: 'relative', margin: '20px 0', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,.18)', animation: quiet ? 'kp-breathe 8s ease-in-out infinite' : 'none' }} />
              <span style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: 'rgba(255,255,255,.22)' }} />
              <span style={{ position: 'relative', fontFamily: display, fontWeight: 800, fontSize: 34 }}>{quiet ? `${quiet}s` : '1:00'}</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5, opacity: 0.9, maxWidth: 260 }}>
              {quiet ? 'Breathe in as the circle grows, out as it shrinks. Tell God what’s on your heart.' : 'Take one quiet minute to sit still and listen to God.'}
            </p>
            <button type="button" onClick={toggleQuiet} style={{ padding: '12px 22px', borderRadius: 999, border: 'none', background: '#fff', color: '#2a1f7a', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {quiet ? 'Stop' : 'Start'}
            </button>
          </div>
        </aside>
      </div>
    </KidsPage>
  )
}
