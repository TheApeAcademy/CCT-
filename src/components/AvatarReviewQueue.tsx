import { useEffect, useState } from 'react'
import { Check, X, ImageIcon } from 'lucide-react'
import { listPendingAvatars, reviewChildAvatar, type PendingAvatar } from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

/**
 * Profile pictures waiting on an adult.
 *
 * Text a child writes is screened by the database as it is saved, so it needs
 * no adult. A picture cannot be, so it waits here. Until somebody says yes it
 * is visible to the child who uploaded it and to nobody else, which means an
 * untouched queue fails safe rather than failing open.
 *
 * Rendered on both the teacher's and the admin's home, and it draws nothing
 * when there is nothing waiting. Who sees which children is decided by
 * list_pending_avatars, not here: a teacher sees their own classes, an admin
 * sees everyone - including a child who has not been put in a class yet, whose
 * picture no teacher can reach.
 */
export default function AvatarReviewQueue() {
  const [queue, setQueue] = useState<PendingAvatar[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = () => {
    listPendingAvatars()
      .then(setQueue)
      .catch(() => setQueue([]))
  }

  useEffect(load, [])

  const review = async (studentId: string, approve: boolean) => {
    setBusy(studentId)
    setError('')
    try {
      await reviewChildAvatar(studentId, approve)
      setQueue((q) => q.filter((p) => p.student_id !== studentId))
      haptics.success()
      playClick()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that.')
      haptics.error()
    } finally {
      setBusy(null)
    }
  }

  if (queue.length === 0) return null

  return (
    <div className="panel space-y-4 p-5">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-[var(--gold)]" />
        <p className="font-display font-bold">
          {queue.length} profile {queue.length === 1 ? 'picture' : 'pictures'} to look at
        </p>
      </div>
      <p className="text-sm text-[var(--ink-muted)]">
        Their class cannot see these yet. Say yes and it goes up; say no and it is deleted, and whatever they had before stays.
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {queue.map((p) => (
          <div key={p.student_id} className="flex flex-wrap items-center gap-3 border-b border-[var(--hairline)] pb-3 last:border-b-0 last:pb-0">
            <img src={p.pending_avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[var(--gold)]/50" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.full_name}</p>
              <p className="truncate text-xs text-[var(--ink-muted)]">{p.class_name ?? 'No class yet'}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => review(p.student_id, true)}
                disabled={busy === p.student_id}
                className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/25"
              >
                <Check className="h-3.5 w-3.5" /> Put it up
              </button>
              <button
                onClick={() => review(p.student_id, false)}
                disabled={busy === p.student_id}
                className="flex items-center gap-1.5 rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-500/25"
              >
                <X className="h-3.5 w-3.5" /> Not this one
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
