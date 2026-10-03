import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { getChildBibleStreak, listChildAchievements, listChildAttendance, listChildQuizzes, type ChildQuizRow, type ChildRow, type EarnedAchievement } from '../../lib/ministry'
import { getJourneyProgressForStudent } from '../../lib/journey'
import { totalLessonCount } from '../../content/bibleJourney'
import { achievementIcon } from '../../lib/achievementIcons'
import { playClick } from '../../lib/sound'
import { BackToPortal, KidAvatar } from './shared'
import { BADGE_COLOURS, display, firstName, useLinkedChildren } from './kit'

// Progress Report - Claude Design handoff, Progress Report.dc.html. A
// printable report for this term for each linked child, built only from what
// the ministry records: attendance, points, badges, the Bible streak, quiz
// scores and Bible Journey lessons. There is no teacher's comment or skills
// grading in the system, so the report does not invent one.

const LV = (p: number): [string, string] => (p >= 85 ? ['Excellent', '#0e9a80'] : p >= 65 ? ['Growing well', '#8a1fb0'] : p >= 45 ? ['Developing', '#d9731f'] : ['Needs support', '#d6334a'])
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** Terms run Sep-Nov, Dec-Feb, Mar-May and Jun-Aug. */
function currentTerm(now = new Date()) {
  const m = now.getMonth()
  const startM = m >= 8 && m <= 10 ? 8 : m === 11 || m <= 1 ? 11 : m <= 4 ? 2 : 5
  const startY = startM === 11 && m <= 1 ? now.getFullYear() - 1 : now.getFullYear()
  const start = new Date(startY, startM, 1)
  const endM = (startM + 2) % 12
  const endY = startM === 11 ? startY + 1 : startY
  return { start, label: `${MON[startM]} – ${MON[endM]} ${endY}` }
}

interface Report {
  streak: number | null
  att: { p: number; t: number }
  badges: EarnedAchievement[]
  badgeTotal: number
  quizzes: ChildQuizRow[]
  lessons: number
}

export default function ProgressReport() {
  const { kids, error, reload } = useLinkedChildren()
  const [params, setParams] = useSearchParams()
  const pick = params.get('child')
  const i = Math.max(0, kids?.findIndex((k) => k.id === pick) ?? 0)
  const kid = kids?.[i]

  return (
    <div data-dc-screen="parent" data-page="report" style={{ minHeight: '100vh', background: '#ece6f5', color: '#160b2a', padding: '20px clamp(10px,2vw,24px) 60px' }}>
      <div className="pp-noprint" style={{ maxWidth: 860, margin: '0 auto 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <BackToPortal solid />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(kids ?? []).length > 1 &&
            kids!.map((k) => {
              const on = k.id === kid?.id
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    playClick()
                    setParams({ child: k.id }, { replace: true })
                  }}
                  style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${on ? '#8a1fb0' : 'rgba(22,11,42,.14)'}`, background: on ? '#8a1fb0' : '#fff', color: on ? '#fff' : '#160b2a', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {firstName(k.full_name)}
                </button>
              )
            })}
          {kid && (
            <button
              type="button"
              onClick={() => {
                playClick()
                window.print()
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, border: 'none', background: '#8a1fb0', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <Printer style={{ width: 16, height: 16 }} strokeWidth={2.25} />
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {kids === null && <p style={{ maxWidth: 860, margin: '40px auto', textAlign: 'center', color: 'rgba(22,11,42,.55)' }}>Loading…</p>}
      {kids !== null && !kid && (
        <div style={{ maxWidth: 860, margin: '40px auto', padding: 30, borderRadius: 24, background: '#fff', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800 }}>{error ? 'We could not load your children.' : 'No children linked yet.'}</p>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(22,11,42,.55)' }}>{error || 'Link a child on the Parent Portal to see their report.'}</p>
          {error && (
            <button type="button" onClick={() => reload()} style={{ marginTop: 14, padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(22,11,42,.14)', background: '#fff', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer' }}>
              Try again
            </button>
          )}
        </div>
      )}
      {kid && <ReportCard key={kid.id} kid={kid} i={i} />}
    </div>
  )
}

function ReportCard({ kid, i }: { kid: ChildRow; i: number }) {
  const term = currentTerm()
  const [r, setR] = useState<Report | null>(null)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    const since = term.start.toISOString()
    const sinceDay = `${term.start.getFullYear()}-${String(term.start.getMonth() + 1).padStart(2, '0')}-01`
    Promise.all([getChildBibleStreak(kid.id).catch(() => null), listChildAttendance(kid.id, 60), listChildAchievements(kid.id), listChildQuizzes(kid.id, since), getJourneyProgressForStudent(kid.id)])
      .then(([streak, att, ach, quizzes, jp]) => {
        const inTerm = att.filter((a) => a.date >= sinceDay)
        setR({
          streak,
          att: { p: inTerm.filter((a) => a.present).length, t: inTerm.length },
          badges: ach.filter((a) => a.earned_at >= since),
          badgeTotal: ach.length,
          quizzes,
          lessons: jp.length,
        })
      })
      .catch((e) => setFailed(e instanceof Error ? e.message : 'Something went wrong.'))
    // term.start is fixed for the life of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid.id])

  const stats: [string, string, string][] = r
    ? [
        ['ATTENDANCE', r.att.t ? `${r.att.p} / ${r.att.t}` : 'None yet', '#0e9a80'],
        ['TOTAL POINTS', kid.total_points.toLocaleString(), '#8a1fb0'],
        ['BADGES', String(r.badgeTotal), '#b37a00'],
        ['BIBLE STREAK', r.streak == null ? 'Not shown' : `${r.streak} day${r.streak === 1 ? '' : 's'}`, '#d9731f'],
      ]
    : []

  const right = r?.quizzes.reduce((n, q) => n + q.correct_count, 0) ?? 0
  const asked = r?.quizzes.reduce((n, q) => n + q.total_questions, 0) ?? 0
  const lessonTotal = totalLessonCount()
  const growth: [string, number][] = r
    ? [
        ...(asked ? [['Quiz accuracy', Math.round((right / asked) * 100)] as [string, number]] : []),
        ...(r.att.t ? [['Sunday attendance', Math.round((r.att.p / r.att.t) * 100)] as [string, number]] : []),
        ['Bible Journey lessons', lessonTotal ? Math.round((r.lessons / lessonTotal) * 100) : 0],
      ]
    : []

  const h2 = { margin: '0 0 14px', fontFamily: display, fontWeight: 800, fontSize: 20, color: '#160b2a' } as const

  return (
    <article style={{ maxWidth: 860, margin: '0 auto', background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 70px -40px rgba(60,30,110,.5)' }}>
      <div style={{ position: 'relative', overflow: 'hidden', padding: '32px clamp(20px,4vw,40px)', background: 'linear-gradient(140deg,#6d1b8f,#2a0d4a)', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ display: 'flex', background: '#fff', borderRadius: 12, padding: '5px 10px' }}>
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 34, display: 'block' }} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: '#ffd84d' }}>TERM REPORT · {term.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 26 }}>
          <KidAvatar child={kid} i={i} size={76} radius={24} font={34} ring />
          <div>
            <h1 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 'clamp(30px,4vw,42px)', lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>{kid.full_name}</h1>
            <p style={{ margin: '6px 0 0', fontSize: 15, opacity: 0.85 }}>{kid.class_name ?? 'MFM Children’s Ministry'}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: 'clamp(20px,4vw,40px)', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {!r && !failed && <p style={{ margin: 0, color: 'rgba(22,11,42,.55)' }}>Loading {firstName(kid.full_name)}’s report…</p>}
        {failed && <p style={{ margin: 0, color: '#d6334a', fontWeight: 700 }}>We could not load this report. {failed}</p>}
        {r && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
              {stats.map(([label, val, col]) => (
                <div key={label} style={{ padding: 16, borderRadius: 18, background: '#f6f2fd' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(22,11,42,.55)' }}>{label}</p>
                  <p style={{ margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 30, lineHeight: 1, color: col }}>{val}</p>
                </div>
              ))}
            </div>

            <section>
              <h2 style={h2}>Areas of growth</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {growth.map(([t, pct]) => {
                  const [label, col] = LV(pct)
                  return (
                    <div key={t}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                        <span style={{ fontWeight: 800 }}>{t}</span>
                        <span style={{ fontWeight: 800, color: col }}>
                          {pct}% · {label}
                        </span>
                      </div>
                      <div style={{ marginTop: 7, height: 10, borderRadius: 9, background: '#f0eaf8', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9, background: col, transformOrigin: 'left', animation: 'pp-grow .9s cubic-bezier(.34,1.2,.64,1) both' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 style={{ ...h2, margin: '0 0 6px' }}>Quiz scores</h2>
              {r.quizzes.length === 0 && <p style={{ margin: '8px 0 0', fontSize: 15, color: 'rgba(22,11,42,.55)' }}>No quizzes played this term yet.</p>}
              {r.quizzes.slice(0, 10).map((q) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderTop: '1px solid rgba(22,11,42,.08)', fontSize: 15 }}>
                  <span style={{ fontWeight: 700 }}>{q.set_name?.trim() || 'Bible quiz'}</span>
                  <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {q.correct_count} / {q.total_questions}
                  </span>
                </div>
              ))}
            </section>

            <section>
              <h2 style={{ ...h2, margin: '0 0 10px' }}>Badges earned this term</h2>
              {r.badges.length === 0 && <p style={{ margin: 0, fontSize: 15, color: 'rgba(22,11,42,.55)' }}>No new badges this term yet.</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {r.badges.map((b, j) => {
                  const Icon = achievementIcon(b.icon)
                  return (
                    <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 8px', borderRadius: 999, background: '#f6f2fd', fontWeight: 800, fontSize: 13 }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', background: BADGE_COLOURS[j % BADGE_COLOURS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 14, height: 14, color: '#fff' }} strokeWidth={2.25} />
                      </span>
                      {b.name}
                    </span>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </article>
  )
}
