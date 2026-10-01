import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, ClipboardCheck, Ear, GraduationCap, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { useNotifications, timeAgo, type NotificationRow } from '../lib/notifications'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const ICONS: Record<string, LucideIcon> = {
  ears_new: Ear,
  ears_reply: Ear,
  ears_escalated: Ear,
  message: MessageCircle,
  assignment_new: ClipboardCheck,
  assignment_graded: GraduationCap,
  lesson_done: BookOpen,
  avatar_pending: Sparkles,
}

/**
 * The bell in every portal header. Its whole job is that nobody has to
 * remember to go and look: an Ears for You message turns it red, and red is
 * reserved for that path alone so it never becomes something a teacher learns
 * to ignore.
 *
 * Renders nothing at all when signed out, so the shells can mount it
 * unconditionally. It reads its own auth state rather than taking it as a
 * prop because both shells lazy-load this file: keeping the Supabase client
 * and the icon set behind that boundary is what stops them landing in the
 * entry chunk the offline quiz has to download.
 */
export default function NotificationBell() {
  const { session } = useMinistryAuth()
  const enabled = !!session
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { items, loading, unreadCount, hasUrgent, markRead, markAllRead } = useNotifications(enabled)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', escape)
    }
  }, [open])

  if (!enabled) return null

  const openNotification = (n: NotificationRow) => {
    if (!n.read_at) markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        onClick={() => {
          setOpen((v) => !v)
          playClick()
          haptics.tap()
        }}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--lp-hairline-strong)] text-[var(--lp-heading)] transition hover:border-[var(--lp-accent-fill)]"
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white"
            style={{ background: hasUrgent ? '#d8344b' : 'var(--lp-accent-fill)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="lp-panel absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden p-0 shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--lp-hairline)] px-4 py-3">
            <p className="font-display text-sm font-extrabold text-[var(--lp-heading)]">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} className="text-xs font-bold text-[var(--lp-accent-text)] underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading && <p className="px-4 py-6 text-center text-sm text-[var(--lp-muted)]">Loading…</p>}
            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[var(--lp-muted)]">Nothing yet. You are all caught up.</p>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.kind] ?? Bell
              const urgent = n.severity === 'urgent'
              return (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`flex w-full items-start gap-3 border-b border-[var(--lp-hairline)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--lp-bg-panel)] ${
                    n.read_at ? '' : 'bg-[color-mix(in_srgb,var(--lp-accent-fill)_6%,transparent)]'
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: urgent ? 'color-mix(in srgb, #d8344b 16%, transparent)' : 'var(--lp-bg-panel)',
                      color: urgent ? '#d8344b' : 'var(--lp-accent-text)',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-snug text-[var(--lp-heading)]">{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-xs leading-snug text-[var(--lp-muted)]">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-[var(--lp-faint)]">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read_at && (
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: urgent ? '#d8344b' : 'var(--lp-accent-fill)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
