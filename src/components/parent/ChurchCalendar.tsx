import { useEffect, useState } from 'react'
import { Bell, BellRing, ChevronLeft, ChevronRight } from 'lucide-react'
import { SUNDAY_LESSON_THEMES, SUNDAYS_2026, sundayDateKey } from '../../content/sundaySchoolCalendar'
import { listMinistryEvents, type MinistryEventRow } from '../../lib/ministry'
import { playClick } from '../../lib/sound'
import { SkyPage } from './shared'
import { display, firstName, useLinkedChildren } from './kit'

// Church Calendar - Claude Design handoff, Church Calendar.dc.html. Every
// Sunday's Sunday School with its lesson theme, the ministry's own events (the
// admin's calendar), and the birthdays of this parent's linked children.
// "Remind me" hands the event to the phone's own calendar as a file.

type Kind = 'service' | 'quiz' | 'event' | 'birthday'
const TYPES: Record<Kind, [string, string]> = { service: ['Sunday School', '#8a1fb0'], quiz: ['Bible Quiz', '#d12a7a'], event: ['Special event', '#0e9a80'], birthday: ['Birthday', '#e0a400'] }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface Ev {
  id: string
  kind: Kind
  t: string
  line: string
  note: string
}

const navBtn = { width: 42, height: 42, borderRadius: 14, border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' } as const

const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n')

/** One all-day event as a calendar file the phone opens in its own calendar app. */
function downloadIcs(dateKey: string, e: Ev) {
  const d = dateKey.replace(/-/g, '')
  const next = new Date(`${dateKey}T12:00:00`)
  next.setDate(next.getDate() + 1)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//MFM Children's Ministry//Church Calendar//EN",
    'BEGIN:VEVENT',
    `UID:${e.id}-${d}@mfm-childrens-ministry`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${sundayDateKey(next).replace(/-/g, '')}`,
    `SUMMARY:${icsText(e.t)}`,
    ...(e.note || e.line ? [`DESCRIPTION:${icsText([e.line, e.note].filter(Boolean).join('\n'))}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT15H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(e.t)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${e.t.replace(/[^\w ]+/g, '').trim() || 'event'}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ChurchCalendar() {
  const today = new Date()
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [sel, setSel] = useState(today.getDate())
  const [off, setOff] = useState<Partial<Record<Kind, boolean>>>({})
  const [added, setAdded] = useState<Record<string, boolean>>({})
  const [events, setEvents] = useState<MinistryEventRow[]>([])
  const { kids } = useLinkedChildren()

  useEffect(() => {
    listMinistryEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [])

  const { y, m } = ym
  const key = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const eventsOn = (d: number): Ev[] => {
    const k = key(d)
    const out: Ev[] = []
    if (new Date(y, m, d).getDay() === 0) {
      const i = SUNDAYS_2026.findIndex((s) => sundayDateKey(s) === k)
      out.push({ id: `sunday-${k}`, kind: 'service', t: 'Sunday School', line: i >= 0 ? `Lesson: ${SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length].title}` : 'Every Sunday', note: '' })
    }
    for (const e of events) {
      if (e.event_date.slice(0, 10) !== k) continue
      out.push({ id: e.id, kind: /quiz|match/i.test(e.title) ? 'quiz' : 'event', t: e.title, line: '', note: e.description ?? '' })
    }
    for (const c of kids ?? []) {
      if (!c.date_of_birth || c.date_of_birth.slice(5, 10) !== k.slice(5)) continue
      out.push({ id: `birthday-${c.id}`, kind: 'birthday', t: `${firstName(c.full_name)}’s birthday`, line: 'All day', note: '' })
    }
    return out.filter((e) => !off[e.kind])
  }

  const first = new Date(y, m, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()
  const cells: { d: number; out?: boolean }[] = []
  for (let i = 0; i < lead; i++) cells.push({ d: prevDays - lead + 1 + i, out: true })
  for (let d = 1; d <= days; d++) cells.push({ d })
  while (cells.length % 7) cells.push({ d: cells.length - lead - days + 1, out: true })
  const todayD = y === today.getFullYear() && m === today.getMonth() ? today.getDate() : -1
  const dayEvents = eventsOn(sel)

  const move = (by: number) => {
    playClick()
    setYm(({ y, m }) => {
      const n = m + by
      return n < 0 ? { y: y - 1, m: 11 } : n > 11 ? { y: y + 1, m: 0 } : { y, m: n }
    })
    setSel(1)
  }

  return (
    <SkyPage page="calendar">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>MFM Children’s Ministry, Wuye</p>
          <h1 style={{ margin: '6px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(36px,4.6vw,58px)', lineHeight: 0.95, letterSpacing: '-.04em', color: 'var(--ink)' }}>Church Calendar</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" aria-label="Previous month" onClick={() => move(-1)} style={navBtn}>
            <ChevronLeft style={{ width: 18, height: 18 }} strokeWidth={2.25} />
          </button>
          <span style={{ minWidth: 160, textAlign: 'center', fontFamily: display, fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>
            {MONTHS[m]} {y}
          </span>
          <button type="button" aria-label="Next month" onClick={() => move(1)} style={navBtn}>
            <ChevronRight style={{ width: 18, height: 18 }} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22 }}>
        {(Object.entries(TYPES) as [Kind, [string, string]][]).map(([k, [label, col]]) => (
          <button
            key={k}
            type="button"
            aria-pressed={!off[k]}
            onClick={() => {
              playClick()
              setOff((o) => ({ ...o, [k]: !o[k] }))
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 999, border: `1px solid ${off[k] ? 'var(--hair)' : col}`, background: off[k] ? 'transparent' : col + '14', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: col }} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 18, marginTop: 18, alignItems: 'start' }}>
        <div style={{ gridColumn: 'span 2', minWidth: 0, padding: 18, borderRadius: 26, background: 'var(--card)', border: '1px solid var(--hair)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'var(--faint)', textAlign: 'center', paddingBottom: 8 }}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div key={`${y}-${m}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6, animation: 'pp-up14 .35s both' }}>
            {cells.map((c, i) => {
              const ev = c.out ? [] : eventsOn(c.d)
              const isSel = !c.out && c.d === sel
              const isToday = !c.out && c.d === todayD
              return (
                <button
                  key={i}
                  type="button"
                  disabled={c.out}
                  aria-label={c.out ? undefined : `${c.d} ${MONTHS[m]}${ev.length ? `, ${ev.length} event${ev.length > 1 ? 's' : ''}` : ''}`}
                  onClick={() => {
                    playClick()
                    setSel(c.d)
                  }}
                  style={{ minHeight: 'clamp(58px,8vw,92px)', padding: 8, borderRadius: 14, border: `2px solid ${isSel ? '#8a1fb0' : 'transparent'}`, background: isToday ? 'var(--today)' : 'var(--track)', cursor: c.out ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, opacity: c.out ? 0.35 : 1, overflow: 'hidden' }}
                >
                  <span style={{ fontWeight: 800, fontSize: 14, color: isToday ? '#8a1fb0' : 'var(--ink)' }}>{c.d}</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
                    {ev.map((e) => (
                      <span key={e.id} style={{ width: '100%', height: 5, borderRadius: 9, background: TYPES[e.kind][1] }} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: 22, borderRadius: 26, background: 'var(--card)', border: '1px solid var(--hair)', minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', color: 'var(--muted)' }}>{new Date(y, m, sel).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</p>
          {dayEvents.length === 0 && <p style={{ margin: '16px 0 0', color: 'var(--faint)' }}>Nothing on this day.</p>}
          {dayEvents.map((e) => {
            const col = TYPES[e.kind][1]
            const id = `${key(sel)}-${e.id}`
            const on = !!added[id]
            const Icon = on ? BellRing : Bell
            return (
              <div key={id} style={{ marginTop: 14, padding: 16, borderRadius: 18, background: col + '10', border: `1px solid ${col}33`, animation: 'pp-up14 .3s both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: col }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: col }}>{TYPES[e.kind][0].toUpperCase()}</span>
                </div>
                <p style={{ margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>{e.t}</p>
                {e.line && <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted)' }}>{e.line}</p>}
                {e.note && <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--body)', whiteSpace: 'pre-line' }}>{e.note}</p>}
                <button
                  type="button"
                  onClick={() => {
                    playClick()
                    downloadIcs(key(sel), e)
                    setAdded((a) => ({ ...a, [id]: true }))
                  }}
                  style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Icon style={{ width: 14, height: 14 }} strokeWidth={2.25} />
                  {on ? 'Added to your calendar' : 'Remind me'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </SkyPage>
  )
}
