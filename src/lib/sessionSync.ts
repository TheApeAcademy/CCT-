// Flushes locally-played quiz sessions (the full per-question record, not
// just the ministry leaderboard's aggregate points - see leaderboardSync.ts
// for that one) up to Supabase once there's a connection, so History reads
// the same match list on every device instead of just the one that played
// it. A match always finishes and saves locally first; this is purely a
// best-effort background push, never a blocker for gameplay.
import { db } from '../db/db'
import { recordQuizSession } from './ministry'

let syncing = false

export async function syncPendingSessions() {
  if (syncing) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  syncing = true
  try {
    const pending = await db.gameSessions.where('synced').equals(0).toArray()
    for (const s of pending) {
      try {
        const remoteId = await recordQuizSession({
          studentId: s.studentId ?? null,
          playerName: s.playerName,
          setName: s.setName,
          seasonName: s.seasonName,
          outcome: s.outcome,
          pointsWon: s.pointsWon,
          correctCount: s.correctCount,
          totalLevels: s.totalLevels,
          startedAt: s.startedAt,
          finishedAt: s.finishedAt,
          answers: s.answers,
        })
        await db.gameSessions.update(s.id!, { synced: 1, remoteId })
      } catch {
        // Leave it queued - could be offline mid-batch, or a transient
        // error. Either way, don't lose the record; just retry next time.
      }
    }
  } finally {
    syncing = false
  }
}
