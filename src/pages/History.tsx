import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

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
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL game history? This cannot be undone.')) return
    await db.gameSessions.clear()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">🏆 History</h1>

      {leaderboard.length > 0 && (
        <div className="rounded-2xl bg-white/5 p-5">
          <h2 className="mb-3 text-lg font-bold">Top Scores</h2>
          <div className="space-y-1">
            {leaderboard.map(([name, points], i) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-2">
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
          <button onClick={handleClearAll} className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/30">
            Clear all history
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-white/50">No games played yet.</p>}
        {filtered.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-4">
            <div>
              <p className="font-bold">{s.playerName}</p>
              <p className="text-sm text-white/60">
                {new Date(s.finishedAt).toLocaleString()} · {s.setName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OutcomeBadge outcome={s.outcome} />
              <div className="text-right">
                <p className="font-bold text-amber-300">{s.pointsWon.toLocaleString()} 👑</p>
                <p className="text-xs text-white/50">Level {s.levelReached}/{s.totalLevels}</p>
              </div>
              <button
                onClick={() => handleDelete(s.id!)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-red-500/30"
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

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    won: { label: '👑 Champion', classes: 'bg-amber-400/30 text-amber-300' },
    walked_away: { label: '🚪 Walked Away', classes: 'bg-blue-400/30 text-blue-300' },
    lost: { label: '💫 Game Over', classes: 'bg-white/10 text-white/60' },
  }
  const { label, classes } = map[outcome] ?? map.lost
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}>{label}</span>
}
