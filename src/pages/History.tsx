import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { AnswerRecord } from '../db/types'
import type { QuizHistoryRow } from '../lib/ministry'

interface HistoryEntry {
  key: string
  localId?: number
  playerName: string
  playerPhoto?: string
  setName: string
  seasonName?: string
  finishedAt: number
  outcome: string
  pointsWon: number
  correctCount: number
  totalLevels: number
  answers: AnswerRecord[]
  synced: boolean
}

export default function History() {
  const sessions = useLiveQuery(() => db.gameSessions.orderBy('finishedAt').reverse().toArray(), []) ?? []
  const [search, setSearch] = useState('')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  // Every synced session ministry-wide, not just this device's local list -
  // best-effort only: offline (or a module load failure) just leaves this
  // empty and History falls back to exactly what it showed before this
  // cross-device sync existed.
  const [remoteRows, setRemoteRows] = useState<QuizHistoryRow[]>([])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    import('../lib/ministry')
      .then((m) => m.getQuizHistory())
      .then(setRemoteRows)
      .catch(() => {})
  }, [])

  const merged = useMemo<HistoryEntry[]>(() => {
    const localRemoteIds = new Set(sessions.filter((s) => s.remoteId).map((s) => s.remoteId))
    const local: HistoryEntry[] = sessions.map((s) => ({
      key: `local-${s.id}`,
      localId: s.id,
      playerName: s.playerName,
      playerPhoto: s.playerPhoto,
      setName: s.setName,
      seasonName: s.seasonName,
      finishedAt: s.finishedAt,
      outcome: s.outcome,
      pointsWon: s.pointsWon,
      correctCount: s.correctCount,
      totalLevels: s.totalLevels,
      answers: s.answers,
      synced: s.synced === 1,
    }))
    // Rows synced from another device/browser - this device's own already-
    // synced rows are excluded here since they're already in `local` above
    // (with richer detail, like the player photo, that never leaves Dexie).
    const remoteOnly: HistoryEntry[] = remoteRows
      .filter((r) => !localRemoteIds.has(r.id))
      .map((r) => ({
        key: `remote-${r.id}`,
        playerName: r.player_name,
        setName: r.set_name,
        seasonName: r.season_name ?? undefined,
        finishedAt: new Date(r.finished_at).getTime(),
        outcome: r.outcome,
        pointsWon: r.points_won,
        correctCount: r.correct_count,
        totalLevels: r.total_levels,
        answers: r.answers,
        synced: true,
      }))
    return [...local, ...remoteOnly].sort((a, b) => b.finishedAt - a.finishedAt)
  }, [sessions, remoteRows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return merged
    return merged.filter((s) => s.playerName.toLowerCase().includes(q) || s.setName.toLowerCase().includes(q))
  }, [merged, search])

  const leaderboard = useMemo(() => {
    const bestByPlayer = new Map<string, number>()
    for (const s of merged) {
      const current = bestByPlayer.get(s.playerName) ?? 0
      if (s.pointsWon > current) bestByPlayer.set(s.playerName, s.pointsWon)
    }
    return [...bestByPlayer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [merged])

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this game record from this device? (If it already synced, it stays visible on others' History.)")) return
    await db.gameSessions.delete(id)
    haptics.tap()
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL game history on this device? This cannot be undone, and already-synced games stay visible on other devices.')) return
    await db.gameSessions.clear()
    haptics.tap()
  }

  return (
    <div data-landing-theme="light" className="site-light-theme lp-page full-bleed px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-display text-3xl font-extrabold">🏆 History</h1>

      {leaderboard.length > 0 && (
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Top Scores</h2>
          <div className="space-y-1">
            {leaderboard.map(([name, points], i) => (
              <div
                key={name}
                className="animate-page-in flex items-center justify-between rounded-lg bg-[var(--ink-raised)] px-4 py-2 transition hover:scale-[1.01]"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="font-semibold">
                  {['🥇', '🥈', '🥉', '4.', '5.'][i]} {name}
                </span>
                <span className="font-bold text-[var(--gold)]">{points.toLocaleString()} 👑</span>
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
          className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 outline-none focus:border-[var(--gold)]"
        />
        {sessions.length > 0 && (
          <button
            onClick={() => {
              playClick()
              handleClearAll()
            }}
            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600 transition hover:scale-105 hover:bg-red-500/20"
          >
            Clear this device's history
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-[var(--ink-faint)]">No games played yet.</p>}
        {filtered.map((s, i) => {
          const isOpen = expandedKey === s.key
          return (
            <div
              key={s.key}
              className="panel animate-page-in overflow-hidden transition"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <button
                onClick={() => {
                  playClick()
                  setExpandedKey(isOpen ? null : s.key)
                }}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition hover:bg-[var(--ink-raised)]"
              >
                <div className="flex items-center gap-3">
                  {s.playerPhoto && (
                    <img src={s.playerPhoto} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[var(--gold)]/50" />
                  )}
                  <div>
                    <p className="font-bold">
                      {s.playerName}
                      {!s.synced && <span className="ml-2 text-[10px] font-normal text-[var(--ink-faint)]">(this device only)</span>}
                    </p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {new Date(s.finishedAt).toLocaleString()} · {s.setName}
                      {s.seasonName ? ` · ${s.seasonName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <OutcomeBadge outcome={s.outcome} correctCount={s.correctCount} totalLevels={s.totalLevels} />
                  <div className="text-right">
                    <p className="font-bold text-[var(--gold)]">{s.pointsWon.toLocaleString()} 👑</p>
                    <p className="text-xs text-[var(--ink-faint)]">
                      {s.correctCount}/{s.totalLevels} correct
                    </p>
                  </div>
                  <span className="text-[var(--ink-faint)]">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-2 border-t border-[var(--hairline)] p-4">
                  {s.answers.map((a, qi) => (
                    <div key={qi} className="rounded-xl bg-[var(--ink-raised)] p-3 text-sm">
                      <p className="text-xs text-[var(--ink-faint)]">Q{a.level}</p>
                      <p className="font-medium">{a.questionText}</p>
                      <p className={`mt-1 ${a.correct ? 'text-green-600' : 'text-red-600'}`}>
                        {a.correct ? '✓ Correct' : a.timedOut ? '⏰ Timed out' : '✗ Wrong'}
                        {a.selectedIndex !== null && ` — answered: ${a.options[a.selectedIndex]}`}
                      </p>
                      {!a.correct && (
                        <p className="mt-1 text-green-600/90">
                          Correct answer: <span className="font-semibold">{a.options[a.correctIndex]}</span>
                        </p>
                      )}
                      {a.funFact && <p className="mt-1 text-xs text-[var(--ink-faint)]">💡 {a.funFact}</p>}
                    </div>
                  ))}
                  {s.localId !== undefined && (
                    <button
                      onClick={() => handleDelete(s.localId!)}
                      className="btn-outline px-3 py-1.5 text-xs hover:border-red-400 hover:text-red-600"
                    >
                      Delete (this device)
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

function OutcomeBadge({ outcome, correctCount, totalLevels }: { outcome: string; correctCount: number; totalLevels: number }) {
  if (outcome === 'ended_early') {
    return <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-600">🚪 Ended Early</span>
  }
  if (correctCount === totalLevels) {
    return <span className="rounded-full bg-[var(--gold)]/15 px-3 py-1 text-xs font-bold text-[var(--gold)]">👑 Perfect!</span>
  }
  return <span className="rounded-full bg-[var(--ink-panel)] px-3 py-1 text-xs font-bold text-[var(--ink-muted)]">✓ Completed</span>
}
