import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, FileText, Home as HomeIcon, Sparkles, Star } from 'lucide-react'
import { signOut } from '../../lib/supabase'
import {
  getChildBibleStreak,
  linkChildByCode,
  listChildAchievements,
  listChildAttendance,
  listChildBibleBuddy,
  listChildQuizzes,
  type AiCompanionMessageRow,
  type AttendanceRow,
  type ChildQuizRow,
  type ChildRow,
  type EarnedAchievement,
} from '../../lib/ministry'
import { getJourneyProgressForStudent, type JourneyProgressRow } from '../../lib/journey'
import { JOURNEY_BOOKS, lessonKeysInOrder } from '../../content/bibleJourney'
import { achievementIcon } from '../../lib/achievementIcons'
import { playClick } from '../../lib/sound'
import { haptics } from '../../lib/haptics'
import { KidAvatar } from './shared'
import { BADGE_COLOURS, display, firstName, useLinkedChildren } from './kit'

// Parent Portal (/parent) - Claude Design handoff, Parent Portal.dc.html.
// Every number is the child's own record. Where the design shows something
// the ministry does not keep for parents (a leaderboard place, the teacher,
// assignment marks), the card shows the nearest real thing instead: badges,
// the class, quiz scores.

const card = { padding: 22, borderRadius: 24, background: '#fff', border: '1px solid rgba(22,11,42,.08)' } as const
const h2 = { margin: 0, fontFamily: display, fontWeight: 800, fontSize: 19, color: '#160b2a' } as const
const navLink = { padding: '7px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12 } as const

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const isoDay = (iso: string) => dayKey(new Date(iso))

function startOfWeek() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export default function ParentHome({ name }: { name: string }) {
  const { kids, error, reload } = useLinkedChildren()
  const [open, setOpen] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<string, { streak: number | null; badges: number }>>({})
  const [code, setCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    for (const k of kids ?? []) {
      Promise.all([getChildBibleStreak(k.id).catch(() => null), listChildAchievements(k.id).catch(() => [] as EarnedAchievement[])]).then(([streak, ach]) =>
        setSummary((s) => ({ ...s, [k.id]: { streak, badges: ach.length } })),
      )
    }
  }, [kids])

  const link = async () => {
    if (!code.trim() || linking) return
    setLinking(true)
    setLinkError('')
    try {
      const result = await linkChildByCode(code)
      setCode('')
      haptics.success()
      playClick()
      await reload()
      window.scrollTo({ top: 0 })
      setOpen(result.student_id)
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Could not find a child with that code.')
      haptics.error()
    } finally {
      setLinking(false)
    }
  }

  const idx = kids?.findIndex((k) => k.id === open) ?? -1
  const kid = idx >= 0 ? kids![idx] : null

  return (
    <div data-dc-screen="parent" data-page="portal" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(193,59,255,.12),transparent 60%),#f6f3fb', color: 'rgba(22,11,42,.78)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px clamp(12px,2.5vw,32px)', background: 'rgba(246,243,251,.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(22,11,42,.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', background: '#fff', borderRadius: 12, padding: '4px 8px', border: '1px solid rgba(22,11,42,.08)' }}>
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 30, display: 'block' }} />
          </Link>
          <nav style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 999, border: '1px solid rgba(22,11,42,.12)', background: '#fff' }}>
            <Link to="/" className="pp-navlink" style={navLink}>
              Home
            </Link>
            <span style={{ ...navLink, background: '#160b2a', color: '#fff' }}>Parent</span>
            <button type="button" className="pp-navlink" onClick={() => signOut()} style={{ ...navLink, border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,3.5vw,44px) clamp(12px,2.5vw,32px) 80px' }}>
        {!kid && (
          <div style={{ animation: 'pp-up .45s both' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'rgba(22,11,42,.55)' }}>{name.trim() ? `Welcome, ${name.trim()}` : 'Welcome'}</p>
            <h1 style={{ margin: '6px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(36px,5vw,60px)', lineHeight: 0.95, letterSpacing: '-.04em', color: '#160b2a' }}>Your children</h1>
            {kids === null && <p style={{ margin: '26px 0 0' }}>Loading…</p>}
            {error && (
              <div style={{ ...card, marginTop: 26, textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 800, color: '#160b2a' }}>We could not load your children.</p>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(22,11,42,.55)' }}>{error}</p>
                <button type="button" onClick={() => reload()} style={{ marginTop: 14, padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(22,11,42,.14)', background: '#fff', color: '#160b2a', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer' }}>
                  Try again
                </button>
              </div>
            )}
            {kids !== null && !error && kids.length === 0 && <p style={{ margin: '14px 0 0', fontSize: 16 }}>No children linked yet. Ask your child for the Parent Link Code on their My Card, then enter it below.</p>}
            {kids !== null && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 16, marginTop: 26 }}>
                {kids.map((k, i) => {
                  const s = summary[k.id]
                  const stats: [string, string, string][] = [
                    ['POINTS', k.total_points.toLocaleString(), '#8a1fb0'],
                    ['STREAK', s ? (s.streak == null ? '-' : `${s.streak}d`) : '…', '#d9731f'],
                    ['BADGES', s ? String(s.badges) : '…', '#b37a00'],
                  ]
                  return (
                    <button
                      key={k.id}
                      type="button"
                      className="pp-kid"
                      onClick={() => {
                        playClick()
                        window.scrollTo({ top: 0 })
                        setOpen(k.id)
                      }}
                      style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16, padding: 22, borderRadius: 28, border: '1px solid rgba(22,11,42,.08)', background: '#fff', color: '#160b2a', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', boxShadow: '0 20px 40px -30px rgba(60,30,110,.4)' }}
                    >
                      <span style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: ['#c13bff', '#ff8a3d', '#2fe0b5', '#4f7bff'][i % 4], opacity: 0.12 }} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <KidAvatar child={k} i={i} size={60} radius={20} font={26} />
                        <span>
                          <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 22 }}>{k.full_name}</span>
                          <span style={{ display: 'block', fontSize: 13, color: 'rgba(22,11,42,.55)' }}>{k.class_name ?? 'MFM Children’s Ministry'}</span>
                        </span>
                      </span>
                      <span style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
                        {stats.map(([l, v, col]) => (
                          <span key={l} style={{ padding: 12, borderRadius: 16, background: '#f6f2fd' }}>
                            <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(22,11,42,.5)' }}>{l}</span>
                            <span style={{ display: 'block', marginTop: 4, fontFamily: display, fontWeight: 800, fontSize: 22, color: col }}>{v}</span>
                          </span>
                        ))}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#8a1fb0' }}>View details →</span>
                    </button>
                  )
                })}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: 22, borderRadius: 28, border: '2px dashed rgba(22,11,42,.14)' }}>
                  <p style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 18, color: '#160b2a' }}>{kids.length ? 'Link another child' : 'Link your child'}</p>
                  <input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase())
                      setLinkError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && link()}
                    placeholder="Their Parent Link Code"
                    aria-label="Parent Link Code"
                    className="pp-field"
                    style={{ padding: '13px 15px', borderRadius: 14, border: '1px solid rgba(22,11,42,.14)', background: '#fff', color: '#160b2a', fontFamily: 'inherit', fontSize: 15, letterSpacing: '.08em', textTransform: 'uppercase', outline: 'none' }}
                  />
                  <button type="button" onClick={link} disabled={linking} style={{ padding: 13, borderRadius: 14, border: 'none', background: '#8a1fb0', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: linking ? 0.7 : 1 }}>
                    {linking ? 'Linking…' : 'Link child'}
                  </button>
                  {linkError ? <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#d6334a' }}>{linkError}</p> : <p style={{ margin: 0, fontSize: 12, color: 'rgba(22,11,42,.5)' }}>It starts with FAM and is on your child’s My Card.</p>}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 12, marginTop: 28 }}>
              <FamilyLink to="/parent/sunday" icon={<HomeIcon style={{ width: 20, height: 20 }} strokeWidth={2.25} />} col="#8a1fb0" t="Take-Home Sunday" s="This week’s lesson for home" />
              <FamilyLink to="/parent/calendar" icon={<CalendarDays style={{ width: 20, height: 20 }} strokeWidth={2.25} />} col="#0e9a80" t="Church Calendar" s="Sundays, events and birthdays" />
              {!!kids?.length && <FamilyLink to="/parent/report" icon={<FileText style={{ width: 20, height: 20 }} strokeWidth={2.25} />} col="#d9731f" t="Progress Report" s="This term, ready to print" />}
            </div>
          </div>
        )}

        {kid && <Detail key={kid.id} kid={kid} i={idx} onBack={() => setOpen(null)} />}
      </main>
    </div>
  )
}

function FamilyLink({ to, icon, col, t, s }: { to: string; icon: ReactNode; col: string; t: string; s: string }) {
  return (
    <Link to={to} onClick={() => playClick()} className="pp-kid" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, background: '#fff', border: '1px solid rgba(22,11,42,.08)', color: '#160b2a' }}>
      <span style={{ width: 44, height: 44, borderRadius: 14, background: col + '14', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span>
        <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 17 }}>{t}</span>
        <span style={{ display: 'block', fontSize: 13, color: 'rgba(22,11,42,.55)' }}>{s}</span>
      </span>
    </Link>
  )
}

interface DetailData {
  streak: number | null
  badges: EarnedAchievement[]
  att: AttendanceRow[]
  journey: JourneyProgressRow[]
  quizzes: ChildQuizRow[]
  buddy: AiCompanionMessageRow[]
}

function Detail({ kid, i, onBack }: { kid: ChildRow; i: number; onBack: () => void }) {
  const [d, setD] = useState<DetailData | null>(null)
  const [failed, setFailed] = useState('')

  const week = startOfWeek()
  const month = new Date()
  month.setDate(1)
  month.setHours(0, 0, 0, 0)
  const since = new Date(Math.min(week.getTime(), month.getTime(), Date.now() - 30 * 864e5))

  useEffect(() => {
    Promise.all([
      getChildBibleStreak(kid.id).catch(() => null),
      listChildAchievements(kid.id),
      listChildAttendance(kid.id, 30),
      getJourneyProgressForStudent(kid.id),
      listChildQuizzes(kid.id, since.toISOString()),
      // A parent still gets the rest of the page if this one fails.
      listChildBibleBuddy(kid.id).catch(() => [] as AiCompanionMessageRow[]),
    ])
      .then(([streak, badges, att, journey, quizzes, buddy]) => setD({ streak, badges, att, journey, quizzes, buddy }))
      .catch((e) => setFailed(e instanceof Error ? e.message : 'Something went wrong loading this.'))
    // since is worked out from today and does not change while the page is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid.id])

  const first = firstName(kid.full_name)
  const att12 = d?.att.slice(0, 12) ?? []
  const stats: [string, string, string][] = [
    ['POINTS', kid.total_points.toLocaleString(), '#8a1fb0'],
    ['DAY STREAK', d ? (d.streak == null ? '-' : String(d.streak)) : '…', '#d9731f'],
    ['BADGES', d ? String(d.badges.length) : '…', '#b37a00'],
    ['ATTENDANCE', d ? (att12.length ? `${att12.filter((a) => a.present).length}/${att12.length}` : '-') : '…', '#0e9a80'],
  ]

  // Things done each day this week: quizzes played, Journey lessons finished, Sundays present.
  const days = Array.from({ length: 7 }, (_, j) => {
    const date = new Date(week)
    date.setDate(week.getDate() + j)
    const k = dayKey(date)
    const v = d ? d.quizzes.filter((q) => isoDay(q.created_at) === k).length + d.journey.filter((x) => isoDay(x.completed_at) === k).length + d.att.filter((a) => a.present && a.date === k).length : 0
    return { k, v, d: 'MTWTFSS'[j] }
  })
  const top = Math.max(1, ...days.map((x) => x.v))

  // One star for every 3 things done this month, up to 5 - the same simple rule as before.
  const monthKey = dayKey(month)
  const monthActivity = d ? d.journey.filter((x) => isoDay(x.completed_at) >= monthKey).length + d.quizzes.filter((q) => isoDay(q.created_at) >= monthKey).length + d.att.filter((a) => a.present && a.date >= monthKey).length : 0
  const stars = Math.min(5, Math.ceil(monthActivity / 3))

  const book = JOURNEY_BOOKS[0]
  const total = book ? lessonKeysInOrder(book).length : 0
  const jDone = d && book ? d.journey.filter((x) => x.book === book.key).length : 0

  return (
    <div style={{ animation: 'pp-up .45s both' }}>
      <button
        type="button"
        onClick={() => {
          playClick()
          onBack()
        }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px 10px 12px', borderRadius: 999, border: '1px solid rgba(22,11,42,.14)', background: '#fff', color: '#160b2a', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} strokeWidth={2.25} />
        All children
      </button>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <KidAvatar child={kid} i={i} size={76} radius={24} font={34} />
          <div>
            <h1 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1, letterSpacing: '-.03em', color: '#160b2a' }}>{kid.full_name}</h1>
            <p style={{ margin: '6px 0 0', fontSize: 15, color: 'rgba(22,11,42,.55)' }}>
              {kid.class_name ? `${kid.class_name} · ` : ''}Student Code {kid.student_code ?? kid.username}
            </p>
          </div>
        </div>
        <Link to={`/parent/report?child=${kid.id}`} onClick={() => playClick()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, background: '#8a1fb0', color: '#fff', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>
          <FileText style={{ width: 16, height: 16 }} strokeWidth={2.25} />
          Progress report
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,160px),1fr))', gap: 12, marginTop: 22 }}>
        {stats.map(([l, v, col]) => (
          <div key={l} style={{ padding: 18, borderRadius: 20, background: '#fff', border: '1px solid rgba(22,11,42,.08)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(22,11,42,.5)' }}>{l}</p>
            <p style={{ margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 32, lineHeight: 1, color: col }}>{v}</p>
          </div>
        ))}
      </div>

      {failed && (
        <div style={{ ...card, marginTop: 16 }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#160b2a' }}>We could not load {first}’s progress.</p>
          <p style={{ margin: '6px 0 0', fontSize: 14 }}>{failed}</p>
        </div>
      )}

      {d && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
          <div style={card}>
            <h2 style={h2}>Activity this week</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, marginTop: 16 }}>
              {days.map((w, j) => (
                <div key={w.k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#160b2a' }}>{w.v}</span>
                  <div style={{ width: '100%', maxWidth: 30, height: `${Math.max(4, (w.v / top) * 100)}%`, borderRadius: '8px 8px 4px 4px', background: w.v ? 'linear-gradient(180deg,#c13bff,#8a1fb0)' : '#ece6f5', transformOrigin: 'bottom', animation: 'pp-rise .7s cubic-bezier(.34,1.3,.64,1) both', animationDelay: `${(j * 0.06).toFixed(2)}s` }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(22,11,42,.5)' }}>{w.d}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(22,11,42,.5)' }}>Quizzes, Bible Journey lessons and Sundays present.</p>
          </div>

          <div style={card}>
            <h2 style={{ ...h2, margin: '0 0 6px' }}>Recent quizzes</h2>
            {d.quizzes.length === 0 && <p style={{ margin: '8px 0 0', fontSize: 14 }}>No quizzes in the last month.</p>}
            {d.quizzes.slice(0, 5).map((q) => {
              const pct = q.total_questions ? q.correct_count / q.total_questions : 0
              return (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '12px 0', borderTop: '1px solid rgba(22,11,42,.07)', fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#160b2a' }}>{q.set_name?.trim() || 'Bible quiz'}</span>
                  <span style={{ fontWeight: 800, whiteSpace: 'nowrap', color: pct >= 0.5 ? '#0e9a80' : '#d9731f' }}>
                    {q.correct_count} / {q.total_questions}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={card}>
            <h2 style={{ ...h2, margin: '0 0 12px' }}>Badges</h2>
            {d.badges.length === 0 && <p style={{ margin: 0, fontSize: 14 }}>No badges earned yet.</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {d.badges.map((b, j) => {
                const Icon = achievementIcon(b.icon)
                return (
                  <span key={b.id} title={b.description} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 8px', borderRadius: 999, background: '#f6f2fd', fontWeight: 800, fontSize: 13, color: '#160b2a' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: BADGE_COLOURS[j % BADGE_COLOURS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: 14, height: 14, color: '#fff' }} strokeWidth={2.25} />
                    </span>
                    {b.name}
                  </span>
                )
              })}
            </div>
          </div>

          <div style={card}>
            <h2 style={{ ...h2, margin: '0 0 6px' }}>Bible Journey</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(22,11,42,.55)' }}>
              {book?.title ?? 'Genesis'} · {jDone} of {total} lessons
            </p>
            <div style={{ marginTop: 12, height: 10, borderRadius: 9, background: '#f0eaf8', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${total ? Math.round((jDone / total) * 100) : 0}%`, borderRadius: 9, background: 'linear-gradient(90deg,#ff8a3d,#ffd84d)', transformOrigin: 'left', animation: 'pp-grow .9s both' }} />
            </div>
          </div>

          <div style={card}>
            <h2 style={{ ...h2, margin: '0 0 10px' }}>This month</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 5 }, (_, j) => (
                <Star key={j} style={{ width: 26, height: 26, color: '#e0a400' }} fill={j < stars ? '#e0a400' : 'none'} strokeWidth={2} />
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'rgba(22,11,42,.55)' }}>{stars === 0 ? 'No activity recorded yet this month.' : 'One star for every three lessons, quizzes or Sundays present this month.'}</p>
          </div>

          <div style={card}>
            <h2 style={{ ...h2, margin: '0 0 6px' }}>Bible Buddy</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgba(22,11,42,.55)' }}>What {first} asked the Bible helper, and what it said. Questions {first} chose to ask privately are not shown here, to anyone.</p>
            {d.buddy.length === 0 && <p style={{ margin: '12px 0 0', fontSize: 14 }}>Nothing asked yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
              {d.buddy.map((m) => (
                <div key={m.id} style={{ padding: 14, borderRadius: 16, background: '#f6f2fd' }}>
                  <p style={{ margin: 0, display: 'flex', gap: 8, fontWeight: 800, fontSize: 14, color: '#160b2a' }}>
                    <Sparkles style={{ width: 14, height: 14, flexShrink: 0, marginTop: 3, color: '#8a1fb0' }} strokeWidth={2.25} />
                    {m.question}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55 }}>{m.answer}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(22,11,42,.4)' }}>{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
