import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function History() {
  const sessions = useLiveQuery(() => db.gameSessions.orderBy('finishedAt').reverse().toArray(), []) ?? []
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) => s.playerName.toLowerCase().includes(q) || s.setName.toLowerCase().includes(q))
  }, [sessions, search])

  const leaderboard = useMemo(() => {
    const bestByPlayer = new Map<string, number>()
    for (const s of sessions) {
      const current = bestByPlayer.get(s.playerName) ?? 0
      if (s.pointsWon > current) bestByPlayer.set(s.playerName, s.pointsWon)
    }
    return [...bestByPlayer.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [sessions])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this game record?')) return
    await db.gameSessions.delete(id)
    haptics.tap()
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL game history? This cannot be undone.')) return
    await db.gameSessions.clear()
    haptics.tap()
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-extrabold">🏆 History</h1>

      {leaderboard.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
          <h2 className="mb-3 font-display text-lg font-bold">Top Scores</h2>
          <div className="space-y-1">
            {leaderboard.map(([name, points], i) => (
              <div
                key={name}
                className="animate-page-in flex items-center justify-between rounded-lg bg-black/20 px-4 py-2 transition hover:scale-[1.01] hover:bg-black/30"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="font-semibold">
                  {['🥇', '🥈', '🥉', '4.', '5.'][i]} {name}
                </span>
                <span className="font-bold text-amber-300">{points.toLocaleString()} 👑</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by kid's name or question set…"
          className="flex-1 rounded-lg bg-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-400"
        />
        {sessions.length > 0 && (
          <button
            onClick={() => {
              playClick()
              handleClearAll()
            }}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:scale-105 hover:bg-red-500/30"
          >
            Clear all history
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-white/50">No games played yet.</p>}
        {filtered.map((s, i) => (
          <div
            key={s.id}
            className="animate-page-in flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-4 transition hover:bg-white/[0.08]"
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
          >
            <div>
              <p className="font-bold">{s.playerName}</p>
              <p className="text-sm text-white/60">
                {new Date(s.finishedAt).toLocaleString()} · {s.setName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OutcomeBadge outcome={s.outcome} correctCount={s.correctCount} totalLevels={s.totalLevels} />
              <div className="text-right">
                <p className="font-bold text-amber-300">{s.pointsWon.toLocaleString()} 👑</p>
                <p className="text-xs text-white/50">{s.correctCount}/{s.totalLevels} correct</p>
              </div>
              <button
                onClick={() => handleDelete(s.id!)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs transition hover:scale-105 hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutcomeBadge({ outcome, correctCount, totalLevels }: { outcome: string; correctCount: number; totalLevels: number }) {
  if (outcome === 'ended_early') {
    return <span className="rounded-full bg-blue-400/30 px-3 py-1 text-xs font-bold text-blue-300">🚪 Ended Early</span>
  }
  if (correctCount === totalLevels) {
    return <span className="rounded-full bg-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300">👑 Perfect!</span>
  }
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">✓ Completed</span>
}
