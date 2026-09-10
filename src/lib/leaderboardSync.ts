// Flushes locally-queued quiz results to the ministry leaderboard once
// there's a connection. A match always finishes and saves locally first —
// this is purely a best-effort background push, never a blocker for
// gameplay. Safe to call repeatedly; already-synced rows are skipped.
import { db } from '../db/db'
import { recordQuizAttemptForStudent } from './ministry'

let syncing = false

export async function syncPendingLeaderboard() {
  if (syncing) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  syncing = true
  try {
    const pending = await db.pendingLeaderboardSync.where('synced').equals(0).toArray()
    for (const row of pending) {
      try {
        await recordQuizAttemptForStudent({
          student_id: row.studentId,
          class_id: row.classId,
          set_name: row.setName,
          points: row.points,
          correct_count: row.correctCount,
          total_questions: row.totalQuestions,
        })
        await db.pendingLeaderboardSync.update(row.id!, { synced: 1 })
      } catch {
        // Leave it queued — could be offline mid-batch, or a permissions
        // change (e.g. the student moved to a different teacher's class).
        // Either way, don't lose the record; just retry next time.
      }
    }
  } finally {
    syncing = false
  }
}
