import { useEffect, useState } from 'react'
import { listMinistryEvents, type MinistryEventRow } from '../lib/ministry'

/**
 * Read-only view of the shared ministry calendar - the same table an admin
 * edits from the Admin Control Centre. Used by both the Teacher Portal's
 * Calendar tab and the kids' Home phone's Calendar app; neither can edit,
 * they can only follow it.
 */
export default function MinistryCalendarReadOnly({ dark = false }: { dark?: boolean }) {
  const [events, setEvents] = useState<MinistryEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Without the catch a refused or dropped read left this on "Loading…"
    // for ever, which reads as a broken page rather than an empty one.
    listMinistryEvents()
      .then((e) => {
        setEvents(e)
        setLoading(false)
      })
      .catch(() => {
        setFailed(true)
        setLoading(false)
      })
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = events.filter((e) => new Date(e.event_date) >= today)
  const past = events.filter((e) => new Date(e.event_date) < today)

  const textMain = dark ? 'text-white' : ''
  const textMuted = dark ? 'text-white/60' : 'text-[var(--ink-muted)]'
  const textFaint = dark ? 'text-white/40' : 'text-[var(--ink-faint)]'
  const cardClass = dark ? 'rounded-2xl border border-white/10 bg-white/5 p-3' : 'panel p-3'

  return (
    <div className="space-y-4">
      {loading && <p className={`text-sm ${textMuted}`}>Loading…</p>}

      {!loading && failed && <p className={`text-sm ${textMuted}`}>The calendar could not be loaded. Check your connection and reopen this tab.</p>}

      {!loading && !failed && upcoming.length === 0 && past.length === 0 && (
        <p className={`text-sm ${textMuted}`}>No ministry events yet. Children's Days, camps and parties appear here as soon as an admin adds them.</p>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow">Upcoming</p>
          {upcoming.map((event) => (
            <div key={event.id} className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className={`font-semibold ${textMain}`}>{event.title}</p>
              {event.description && <p className={`mt-1 text-sm ${textMuted}`}>{event.description}</p>}
            </div>
          ))}
        </div>
      )}

      {!loading && past.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow">Past</p>
          {past.map((event) => (
            <div key={event.id} className={`${cardClass} opacity-60`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${textFaint}`}>
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className={`font-semibold ${textMain}`}>{event.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
