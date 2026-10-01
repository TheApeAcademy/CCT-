// Notifications.
//
// Nothing in this app used to tell anyone that anything had happened. The one
// that mattered was Ears for You: a child writes to a trusted adult that
// something is wrong, and whether an adult ever saw it depended on a teacher
// happening to open the right tab.
//
// Rows are written entirely by database triggers (see the notifications
// migration), never from here. This file only reads them and marks them read.
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export type NotificationKind =
  | 'ears_new'
  | 'ears_reply'
  | 'ears_escalated'
  | 'message'
  | 'assignment_new'
  | 'assignment_graded'
  | 'lesson_done'
  | 'avatar_pending'

export interface NotificationRow {
  id: string
  kind: NotificationKind | string
  title: string
  body: string | null
  link: string | null
  severity: 'normal' | 'urgent'
  read_at: string | null
  created_at: string
}

export async function listNotifications(limit = 30): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, severity, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as NotificationRow[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
}

/**
 * Everything the bell needs. Polls rather than holding a realtime channel
 * open: a Sunday school teacher has this tab open for an hour at a time on a
 * phone, and a socket that has to be torn down and rebuilt on every sleep is
 * more to go wrong than a request every half minute is to pay for.
 */
export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(enabled)
  const timer = useRef<number | undefined>(undefined)

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      setItems(await listNotifications())
    } catch {
      // Offline, or signed out mid-poll. The bell keeps whatever it last had
      // rather than blanking out or throwing into the portal around it.
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setItems([])
      setLoading(false)
      return
    }
    refresh()
    const tick = () => {
      // Only while the tab is actually in front of someone.
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refresh()
    }
    timer.current = window.setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer.current)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [enabled, refresh])

  const unread = items.filter((n) => !n.read_at)

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    try {
      await markNotificationRead(id)
    } catch {
      refresh()
    }
  }, [refresh])

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    try {
      await markAllNotificationsRead()
    } catch {
      refresh()
    }
  }, [refresh])

  return {
    items,
    loading,
    unreadCount: unread.length,
    /** Anything from the safeguarding path, which the bell shows in red. */
    hasUrgent: unread.some((n) => n.severity === 'urgent'),
    refresh,
    markRead,
    markAllRead,
  }
}

/** "3 minutes ago", for a child as much as for a teacher. */
export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString()
}
