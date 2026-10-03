import { useState } from 'react'
import { Check } from 'lucide-react'
import { SUNDAY_LESSON_THEMES, SUNDAYS_2026, sundayDateKey } from '../../content/sundaySchoolCalendar'
import { TAKE_HOME_SHEETS, type HomeTaskKind } from '../../content/takeHomeSunday'
import { playClick } from '../../lib/sound'
import { SkyPage } from './shared'
import { display } from './kit'

// Take-Home Sunday - Claude Design handoff, Take-Home Sunday.dc.html. The last
// four Sundays on the ministry's lesson calendar, each with the theme the
// child's Sunday room shows for that date and its sheet for home. The family's
// ticks stay on this device.

const KIND: Record<HomeTaskKind, [string, string]> = { talk: ['TALK ABOUT IT', '#8a1fb0'], do: ['DO TOGETHER', '#0e9a80'], read: ['READ', '#d9731f'], verse: ['PRACTISE', '#d12a7a'] }
const STORE = 'mfm-take-home'
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

type Done = Record<string, number[]>
function loadDone(): Done {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE) ?? '{}')
    return v && typeof v === 'object' ? (v as Done) : {}
  } catch {
    return {}
  }
}

/** The most recent Sundays up to today, newest first. */
function recentSundays(count: number) {
  const now = new Date()
  const out: { date: Date; i: number }[] = []
  SUNDAYS_2026.forEach((date, i) => {
    if (date <= now) out.push({ date, i })
  })
  return out.reverse().slice(0, count)
}

export default function TakeHomeSunday() {
  const weeks = recentSundays(4)
  const [w, setW] = useState(0)
  const [done, setDone] = useState<Done>(loadDone)

  const sheetFor = (i: number) => ({ theme: SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length], sheet: TAKE_HOME_SHEETS[i % TAKE_HOME_SHEETS.length] })
  const week = weeks[w]

  const toggle = (key: string, j: number) => {
    playClick()
    setDone((d) => {
      const cur = d[key] ?? []
      const next = { ...d, [key]: cur.includes(j) ? cur.filter((x) => x !== j) : [...cur, j] }
      try {
        window.localStorage.setItem(STORE, JSON.stringify(next))
      } catch {
        // storage unavailable - the ticks still work until the page closes
      }
      return next
    })
  }

  return (
    <SkyPage page="sunday">
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>Keep Sunday’s lesson going at home</p>
      <h1 style={{ margin: '6px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(36px,4.6vw,58px)', lineHeight: 0.95, letterSpacing: '-.04em', color: 'var(--ink)' }}>Take-Home Sunday</h1>

      {!week && <p style={{ margin: '22px 0 0', padding: 30, borderRadius: 24, border: '1px dashed var(--hair2)', textAlign: 'center', color: 'var(--muted)' }}>The first Sunday’s sheet will be here after the first Sunday of the year.</p>}

      {week && (
        <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', marginTop: 22 }}>
            {weeks.map((wk, i) => {
              const { theme, sheet } = sheetFor(wk.i)
              const c = (done[sundayDateKey(wk.date)] ?? []).filter((j) => j < sheet.tasks.length).length
              const all = c === sheet.tasks.length
              const on = i === w
              return (
                <button
                  key={wk.i}
                  type="button"
                  onClick={() => {
                    playClick()
                    setW(i)
                  }}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 16px', borderRadius: 16, border: `2px solid ${on ? '#8a1fb0' : 'var(--hair)'}`, background: on ? 'rgba(193,59,255,.08)' : 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{wk.date.getDate()} {MON[wk.date.getMonth()]}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>{theme.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: all ? '#0e9a80' : 'var(--muted)', whiteSpace: 'nowrap' }}>{all ? 'All done ✓' : `${c}/${sheet.tasks.length} done`}</span>
                </button>
              )
            })}
          </div>
          <Week key={week.i} date={week.date} {...sheetFor(week.i)} ticked={done[sundayDateKey(week.date)] ?? []} onToggle={(j) => toggle(sundayDateKey(week.date), j)} />
        </>
      )}
    </SkyPage>
  )
}

function Week({ date, theme, sheet, ticked, onToggle }: { date: Date; theme: { title: string; image: string }; sheet: (typeof TAKE_HOME_SHEETS)[number]; ticked: number[]; onToggle: (j: number) => void }) {
  const count = sheet.tasks.filter((_, j) => ticked.includes(j)).length
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 18, marginTop: 18, alignItems: 'start', animation: 'pp-up .4s both' }}>
      <div style={{ overflow: 'hidden', borderRadius: 28, background: '#2a0d4a', color: '#fff' }}>
        <div style={{ height: 220, background: `linear-gradient(180deg,transparent 35%,#2a0d4a),url(${theme.image}) center/cover` }} />
        <div style={{ padding: '0 26px 26px', marginTop: -40, position: 'relative' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ffd84d' }}>{date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p>
          <h2 style={{ margin: '6px 0 0', fontFamily: display, fontWeight: 800, fontSize: 32, lineHeight: 1.02, letterSpacing: '-.02em', color: '#fff' }}>{theme.title}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.8 }}>{sheet.ref}</p>
          <p style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.65, opacity: 0.92 }}>{sheet.summary}</p>
          <div style={{ marginTop: 18, padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: '#ffd84d' }}>MEMORY VERSE · {sheet.verseRef}</p>
            <p style={{ margin: '6px 0 0', fontSize: 17, lineHeight: 1.5, fontStyle: 'italic' }}>“{sheet.verse}”</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div style={{ padding: 22, borderRadius: 26, background: 'var(--card)', border: '1px solid var(--hair)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>This week at home</h3>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)' }}>
              {count} of {sheet.tasks.length}
            </span>
          </div>
          <div style={{ marginTop: 12, height: 8, borderRadius: 9, background: 'var(--track)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((count / sheet.tasks.length) * 100)}%`, borderRadius: 9, background: 'linear-gradient(90deg,#c13bff,#2fe0b5)', transition: 'width .5s' }} />
          </div>
          {sheet.tasks.map(([k, t], j) => {
            const on = ticked.includes(j)
            return (
              <button
                key={j}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(j)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '14px 0', border: 'none', borderTop: '1px solid var(--hair)', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginTop: j ? 0 : 12 }}
              >
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, border: `2px solid ${on ? '#0e9a80' : 'var(--hair2)'}`, background: on ? '#0e9a80' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                  <Check style={{ width: 14, height: 14, color: '#fff', opacity: on ? 1 : 0 }} strokeWidth={3} />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: KIND[k][1] }}>{KIND[k][0]}</span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 15, lineHeight: 1.5, color: 'var(--ink)', opacity: on ? 0.55 : 1 }}>{t}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: 22, borderRadius: 26, background: 'var(--card)', border: '1px solid var(--hair)' }}>
          <h3 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>Family prayer</h3>
          <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.65 }}>{sheet.prayer}</p>
        </div>
      </div>
    </div>
  )
}
