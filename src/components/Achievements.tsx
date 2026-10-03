import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import KidsPage from './KidsPage'
import { achievementIcon } from '../lib/achievementIcons'
import { getMyBadgeStats, getMyBibleStreak, listAllAchievements, type AchievementRow, type EarnedAchievement, type MyBadgeStats } from '../lib/ministry'
import { playClick } from '../lib/sound'

// Achievements - Claude Design handoff, Achievements.dc.html. Every badge in
// the ministry's catalog, lit up when earned. Progress bars count the child's
// real readings, lessons, quizzes, streak and heroes where a badge has a
// number to reach; Bible Heroes have their own page, so their badges stay out.

type Cat = 'read' | 'play' | 'learn'
const CATS: Record<Cat, [string, string]> = { read: ['Reading', '#ff8a3d'], play: ['Games', '#ff4fa3'], learn: ['Journey', '#c13bff'] }
const display = "'Bricolage Grotesque', sans-serif"

type Stats = MyBadgeStats & { streak: number | null; heroes: number; heroTotal: number }

/** Which shelf a badge sits on and, where the catalog has one, the number it counts towards. */
function measure(code: string, s: Stats | null): { cat: Cat; v: number | null; goal: number } {
  const n = (x: number | null | undefined) => (s && x != null ? x : null)
  switch (code) {
    case 'first_bible_reading':
      return { cat: 'read', v: n(s?.readings), goal: 1 }
    case 'bible_streak_3':
      return { cat: 'read', v: n(s?.streak), goal: 3 }
    case 'bible_streak_7':
      return { cat: 'read', v: n(s?.streak), goal: 7 }
    case 'first_quiz':
      return { cat: 'play', v: n(s?.quizzes), goal: 1 }
    case 'five_quizzes':
      return { cat: 'play', v: n(s?.quizzes), goal: 5 }
    case 'perfect_score':
      return { cat: 'play', v: null, goal: 1 }
    case 'first_journey_lesson':
      return { cat: 'learn', v: n(s?.lessons), goal: 1 }
    case 'journey_10_lessons':
      return { cat: 'learn', v: n(s?.lessons), goal: 10 }
    case 'journey_25_lessons':
      return { cat: 'learn', v: n(s?.lessons), goal: 25 }
    case 'scripture_master':
      return { cat: 'learn', v: n(s?.heroes), goal: Math.max(1, s?.heroTotal ?? 1) }
    default:
      return { cat: /quiz|game|match/.test(code) ? 'play' : /read|streak|bible/.test(code) ? 'read' : 'learn', v: null, goal: 1 }
  }
}

export default function AchievementsPage({ achievements, points, heroTotal, onExit }: { achievements: EarnedAchievement[]; points: number; heroTotal: number; onExit: () => void }) {
  const [catalog, setCatalog] = useState<AchievementRow[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'won' | Cat>('all')

  useEffect(() => {
    listAllAchievements()
      .then(setCatalog)
      .catch(() => setCatalog([]))
    Promise.all([getMyBadgeStats(), getMyBibleStreak().catch(() => null)])
      .then(([b, streak]) => setStats({ ...b, streak: streak == null ? null : Number(streak) || 0, heroes: achievements.filter((a) => a.code.startsWith('character_')).length, heroTotal }))
      .catch(() => {})
  }, [achievements, heroTotal])

  const earned = new Set(achievements.map((a) => a.code))
  // Badges the child holds show even if the catalog could not be read.
  const rows: AchievementRow[] = [...(catalog ?? [])]
  for (const a of achievements) if (!rows.some((r) => r.code === a.code)) rows.push(a)
  const all = rows
    .filter((r) => !r.code.startsWith('character_'))
    .map((r) => {
      const m = measure(r.code, stats)
      const on = earned.has(r.code)
      const v = on ? m.goal : Math.min(m.goal, m.v ?? 0)
      return { ...r, cat: m.cat, goal: m.goal, known: m.v != null, on, v, col: CATS[m.cat][1] }
    })
  const list = all.filter((b) => filter === 'all' || (filter === 'won' ? b.on : b.cat === filter))
  const won = all.filter((b) => b.on).length

  const p = Math.max(0, points)
  const level = Math.floor(p / 100) + 1
  const into = p % 100
  const filters: ['all' | 'won' | Cat, string][] = [['all', 'All'], ['won', 'Unlocked'], ...(Object.entries(CATS) as [Cat, [string, string]][]).map(([k, v]) => [k, v[0]] as [Cat, string])]

  return (
    <KidsPage label="Achievements" page="trophy" glow="rgba(255,201,60,.22)" starSeed={61} starCount={30} celestial={false} onExit={onExit}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 28 }}>
        <div style={{ maxWidth: 560 }}>
          <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid var(--hair2)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e0a400' }}>Trophy Room</span>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 'clamp(44px,6vw,76px)', lineHeight: 0.92, letterSpacing: '-.045em', color: 'var(--ink)', margin: '16px 0 0' }}>Achievements</h1>
          <p style={{ margin: '14px 0 0', fontSize: 17, lineHeight: 1.6 }}>Badges unlock as you read, play and learn. Keep going to fill your trophy room.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 28, background: 'var(--card)', border: '1px solid var(--hair)' }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--track)" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#kp-lv)" strokeWidth="12" strokeLinecap="round" strokeDasharray="339" strokeDashoffset={Math.round(339 - (339 * into) / 100)} style={{ animation: 'kp-ring 1.4s cubic-bezier(.2,.9,.2,1) both' }} />
              <defs>
                <linearGradient id="kp-lv" x1="0" x2="1">
                  <stop offset="0" stopColor="#c13bff" />
                  <stop offset="1" stopColor="#ffd84d" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'var(--muted)' }}>LEVEL</span>
              <span style={{ fontFamily: display, fontWeight: 800, fontSize: 40, lineHeight: 1, color: 'var(--ink)' }}>{level}</span>
            </div>
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 28, color: 'var(--ink)' }}>{p.toLocaleString()} points</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted)' }}>
              {100 - into} to level {level + 1}
            </p>
            <p style={{ margin: '12px 0 0', fontWeight: 800, color: '#e0a400' }}>
              {won} / {all.length} badges
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32 }}>
        {filters.map(([k, label]) => {
          const on = filter === k
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => {
                playClick()
                setFilter(k)
              }}
              style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${on ? 'var(--ink)' : 'var(--hair2)'}`, background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--bg)' : 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {catalog && list.length === 0 && (
        <p style={{ margin: '22px 0 0', padding: 30, borderRadius: 24, border: '1px dashed var(--hair2)', textAlign: 'center', color: 'var(--muted)' }}>{filter === 'won' ? 'No badges yet. Your first one is closer than you think!' : 'No badges here yet.'}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginTop: 22 }}>
        {list.map((b, i) => {
          const Icon = b.on ? achievementIcon(b.icon) : Lock
          const dl = `${(i * 0.03).toFixed(2)}s`
          return (
            <div key={b.code} style={{ position: 'relative', overflow: 'hidden', padding: '22px 20px', borderRadius: 26, background: 'var(--card)', border: `1px solid ${b.on ? b.col + '66' : 'var(--hair)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'kp-rise20 .45s both', animationDelay: dl }}>
              <div style={{ position: 'relative', width: 96, height: 96 }}>
                <span style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: `conic-gradient(from 0deg,transparent,${b.col},transparent 40%)`, opacity: b.on ? 1 : 0, animation: 'kp-spin 4s linear infinite' }} />
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: b.on ? `radial-gradient(circle at 35% 30%,#fff8,transparent 45%),linear-gradient(150deg,${b.col},${b.col}aa)` : 'var(--lockbg)',
                    boxShadow: b.on ? `0 14px 30px -10px ${b.col}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Icon style={{ width: 44, height: 44, color: b.on ? '#fff' : 'var(--faint)' }} strokeWidth={2} />
                  <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)', opacity: b.on ? 1 : 0, animation: 'kp-shine 3s ease-in-out infinite', animationDelay: dl }} />
                </span>
              </div>
              <p style={{ margin: '16px 0 0', fontFamily: display, fontWeight: 800, fontSize: 19, color: 'var(--ink)' }}>{b.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)', minHeight: 38 }}>{b.description}</p>
              <div style={{ marginTop: 12, width: '100%', height: 8, borderRadius: 9, background: 'var(--track)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((b.v / b.goal) * 100)}%`, borderRadius: 9, background: b.col, transition: 'width .8s' }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 800, color: b.on ? b.col : 'var(--muted)' }}>{b.on ? 'Unlocked' : b.known ? `${b.v.toLocaleString()} / ${b.goal.toLocaleString()}` : 'Not yet'}</p>
            </div>
          )
        })}
      </div>
    </KidsPage>
  )
}
