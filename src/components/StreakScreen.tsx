import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Moon, Sun } from 'lucide-react'
import { getMyBibleStreak, listMyReadingDays } from '../lib/ministry'
import { playClick } from '../lib/sound'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** The four rewards the screen counts toward. */
const TIERS = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
]

const THEME_KEY = 'mfm-streak-theme'

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Sunday through Saturday of the week today falls in. */
function thisWeek(today: Date): Date[] {
  const sunday = new Date(today)
  sunday.setDate(sunday.getDate() - sunday.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

/**
 * The streak, on its own screen.
 *
 * One structure with two skins: light is the screen Banks approved, dark is
 * the image he sent after it. The toggle is on the screen rather than global
 * because the kids' surface itself is always light.
 */
export default function StreakScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [streak, setStreak] = useState(0)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_KEY) === 'dark'
    } catch {
      return false
    }
  })

  useEffect(() => {
    Promise.all([getMyBibleStreak(), listMyReadingDays(14)])
      .then(([n, days]) => {
        setStreak(n)
        setDone(days)
      })
      .catch(() => {
        /* the screen still draws, with nothing ticked */
      })
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()
  const todayIso = isoDay(today)
  const week = thisWeek(today)
  const doneCount = week.filter((d) => done.has(isoDay(d))).length
  // The bar covers the run of days read without a gap, starting at Sunday, so
  // a day missed mid-week breaks it rather than being painted over. Each
  // column is a seventh wide, so its centre sits at (i + 0.5)/7.
  let streakInWeek = 0
  while (streakInWeek < 7 && done.has(isoDay(week[streakInWeek]))) streakInWeek++
  const run = streakInWeek === 0 ? 0 : ((streakInWeek - 1 + 0.5) / 7) * 100 - 4

  const nextTier = TIERS.find((t) => streak < t.days) ?? null
  const toGo = nextTier ? nextTier.days - streak : 0

  const setTheme = (next: boolean) => {
    setDark(next)
    try {
      window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch {
      /* storage unavailable - the choice still holds for this visit */
    }
  }

  // Fixed over the tab area, the way the class page and the journey are, so the
  // dark ground covers the whole screen instead of stopping where the content
  // ends and letting the light shell show underneath.
  return (
    <div className={`st-screen ${dark ? 'is-dark' : ''} fixed inset-0 z-20 overflow-y-auto px-[18px] pb-8 pt-3`}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 py-2 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
          Home
        </button>
        <button
          type="button"
          onClick={() => {
            playClick()
            setTheme(!dark)
          }}
          aria-label={dark ? 'Switch this screen to light' : 'Switch this screen to dark'}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: '1px solid var(--sk-card-line)' }}
        >
          {dark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>

      <div className="sk-main">
      <div className="sk-stage">
        <span className="sk-halo" aria-hidden />
        <span className="sk-halo is-2" aria-hidden />
        <img className="sk-flame" src="/icons/streak-flame.png" alt="" />
      </div>
      <p className="sk-num">{loading ? '–' : streak}</p>
      <p className="sk-lbl">day{streak === 1 ? '' : 's'} streak</p>
      <p className="sk-said">
        {streak === 0
          ? 'Read today and your streak starts.'
          : nextTier
            ? `${toGo} more day${toGo === 1 ? '' : 's'} and you reach ${nextTier.label}.`
            : 'Every reward on this screen is yours.'}
      </p>

      <div className="sk-body">
        <div className="sk-card">
          <div className="sk-dow">
            {week.map((d, i) => (
              <span key={i} className={done.has(isoDay(d)) ? 'is-on' : ''}>
                {DOW[i]}
              </span>
            ))}
          </div>
          <div className="sk-dots" style={{ '--sk-run': `${run}%` } as React.CSSProperties}>
            {week.map((d, i) => {
              const iso = isoDay(d)
              const isDone = done.has(iso)
              const isToday = iso === todayIso
              if (!isDone) {
                return (
                  <span key={i} className="sk-off" aria-label={`${DOW_FULL[i]}, not read yet`}>
                    {d.getDate()}
                  </span>
                )
              }
              return (
                <span key={i} className={`sk-dot${isToday ? ' is-now' : ''}`} aria-label={`${DOW_FULL[i]}, read`}>
                  <Check className={isToday ? 'h-[15px] w-[15px]' : 'h-3 w-3'} strokeWidth={3.2} />
                </span>
              )
            })}
          </div>
        </div>

        <div className="sk-rw">
          <p className="sk-rw-top">
            {doneCount} of 7 days this week
          </p>
          <div className="sk-tiers">
            {TIERS.map((t) => {
              const state = streak >= t.days ? 'is-done' : nextTier?.days === t.days ? 'is-now' : ''
              return (
                <div key={t.days} className={`sk-tier ${state}`}>
                  <b>{t.label}</b>
                  <span>{streak >= t.days ? 'Earned' : `${t.days - streak} to go`}</span>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="sk-cta"
          onClick={() => {
            playClick()
            onContinue()
          }}
        >
          {done.has(todayIso) ? 'Read ahead' : "Read today's verse"}
        </button>
      </div>
      </div>
    </div>
  )
}
