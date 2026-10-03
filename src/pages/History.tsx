import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { AnswerRecord } from '../db/types'
import type { QuizHistoryRow } from '../lib/ministry'
import PublicShell from '../components/public/PublicShell'
import { card, display, field, label } from '../components/public/kit'

interface MatchRow {
  key: string
  teams: HistoryEntry[]
  mode: string
  finishedAt: number
}

interface HistoryEntry {
  key: string
  localId?: number
  matchId?: number
  teamIndex?: number
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
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? []
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
      matchId: s.matchId,
      teamIndex: s.teamIndex,
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

  // The design lists matches, not single turns: one row per match with every
  // team's score, the winner crowned. Turns from the same match on this
  // device share a matchId; games synced from other devices carry no match
  // link, so each of those stays a row of its own.
  const groups = useMemo<MatchRow[]>(() => {
    const byKey = new Map<string, HistoryEntry[]>()
    for (const e of merged) {
      const k = e.matchId !== undefined ? `match-${e.matchId}` : e.key
      byKey.set(k, [...(byKey.get(k) ?? []), e])
    }
    return [...byKey.entries()]
      .map(([key, teams]) => {
        const m = teams[0].matchId !== undefined ? matches.find((x) => x.id === teams[0].matchId) : undefined
        const ordered = [...teams].sort((a, b) => (a.teamIndex ?? 0) - (b.teamIndex ?? 0))
        const mode = !m ? (teams[0].synced && teams[0].localId === undefined ? 'Another device' : 'Single game') : m.mode === 'rotational' ? (m.teamNames.length === 2 ? '1 v 1' : 'Rotational') : 'Marathon'
        return { key, teams: ordered, mode, finishedAt: Math.max(...teams.map((t) => t.finishedAt)) }
      })
      .sort((a, b) => b.finishedAt - a.finishedAt)
  }, [merged, matches])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => g.teams.some((s) => s.playerName.toLowerCase().includes(q) || s.setName.toLowerCase().includes(q)))
  }, [groups, search])

  const leaderboard = useMemo(() => {
    const bestByPlayer = new Map<string, number>()
    for (const s of merged) {
      const current = bestByPlayer.get(s.playerName) ?? 0
      if (s.pointsWon > current) bestByPlayer.set(s.playerName, s.pointsWon)
    }
    return [...bestByPlayer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [merged])

  const handleDelete = async (ids: number[]) => {
    if (!confirm("Delete this game record from this device? (If it already synced, it stays visible on others' History.)")) return
    await db.gameSessions.bulkDelete(ids)
    haptics.tap()
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL game history on this device? This cannot be undone, and already-synced games stay visible on other devices.')) return
    await db.gameSessions.clear()
    haptics.tap()
  }

  const pillBtn = { padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(255,138,150,.4)', background: 'transparent', color: '#ff8a96', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' as const }

  return (
    <PublicShell eyebrow="History" title="Match history" sub="Every quiz match played, with the final scores." accent="#4f9bff">
      {leaderboard.length > 0 && (
        <div style={{ ...card, marginTop: 30 }}>
          <p style={label}>TOP SCORES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {leaderboard.map(([name, points], i) => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: i === 0 ? 'rgba(255,216,77,.14)' : 'rgba(255,255,255,.05)', border: `1px solid ${i === 0 ? 'rgba(255,216,77,.45)' : 'rgba(255,255,255,.1)'}`, fontWeight: 800, fontSize: 14, color: '#fff' }}>
                <span style={{ fontFamily: display, color: i === 0 ? '#ffd84d' : 'rgba(236,230,250,.6)' }}>{i + 1}</span>
                {name} · <span style={{ color: '#ffd84d' }}>{points.toLocaleString()}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: leaderboard.length > 0 ? 16 : 30 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by child’s name or question set…" className="pb-field" style={{ ...field, flex: '1 1 260px' }} />
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              playClick()
              handleClearAll()
            }}
            style={pillBtn}
          >
            Clear this device’s history
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {filtered.length === 0 && <p style={{ margin: 0, color: 'rgba(236,230,250,.55)' }}>{search.trim() ? `No matches for "${search.trim()}".` : 'No games played yet.'}</p>}
        {filtered.map((g) => {
          const isOpen = expandedKey === g.key
          const top = Math.max(...g.teams.map((t) => t.pointsWon))
          const crowned = g.teams.length > 1 && g.teams.filter((t) => t.pointsWon === top).length < g.teams.length
          const localIds = g.teams.map((t) => t.localId).filter((x): x is number => x !== undefined)
          const local = g.teams.some((t) => !t.synced)
          const t0 = g.teams[0]
          return (
            <div key={g.key} className="pb-row" style={{ borderRadius: 22, background: 'rgba(255,255,255,.05)', border: `1px solid ${isOpen ? 'rgba(255,216,77,.45)' : 'rgba(255,255,255,.1)'}`, overflow: 'hidden' }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  playClick()
                  setExpandedKey(isOpen ? null : g.key)
                }}
                style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '18px 22px', border: 'none', background: 'transparent', color: 'inherit', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(236,230,250,.55)' }}>
                    {fmtDate(g.finishedAt)} · {g.mode}
                    {local ? ' · this device only' : ''}
                  </p>
                  <p style={{ margin: '4px 0 0', fontFamily: display, fontWeight: 800, fontSize: 20, color: '#fff', overflowWrap: 'anywhere' }}>
                    {t0.setName}
                    {t0.seasonName ? <span style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: 'rgba(236,230,250,.55)' }}> · {t0.seasonName}</span> : null}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {g.teams.map((t) => {
                    const win = crowned && t.pointsWon === top
                    return (
                      <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: win ? 'rgba(255,216,77,.14)' : 'rgba(255,255,255,.05)', border: `1px solid ${win ? 'rgba(255,216,77,.45)' : 'rgba(255,255,255,.1)'}`, fontWeight: 800, fontSize: 14, color: '#fff', whiteSpace: 'nowrap' }}>
                        {t.playerPhoto && <img src={t.playerPhoto} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />}
                        {win ? '👑 ' : ''}
                        {t.playerName} · {t.pointsWon}
                      </span>
                    )
                  })}
                  <span aria-hidden="true" style={{ color: 'rgba(236,230,250,.5)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 22px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
                  {g.teams.map((t) => (
                    <div key={t.key}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#fff' }}>{t.playerName}</p>
                        <OutcomeBadge outcome={t.outcome} correctCount={t.correctCount} totalLevels={t.totalLevels} />
                        <span style={{ fontSize: 13, color: 'rgba(236,230,250,.55)' }}>
                          {t.correctCount}/{t.totalLevels} correct · {new Date(t.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        {t.answers.map((a, qi) => (
                          <div key={qi} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,.2)', fontSize: 14 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(236,230,250,.5)' }}>QUESTION {a.level}</p>
                            <p style={{ margin: '3px 0 0', fontWeight: 700, color: '#fff' }}>{a.questionText}</p>
                            <p style={{ margin: '4px 0 0', color: a.correct ? '#5cf0c8' : '#ff8a96', fontWeight: 700 }}>
                              {a.correct ? '✓ Correct' : a.timedOut ? '⏰ Timed out' : '✗ Wrong'}
                              {a.selectedIndex !== null && ` - answered: ${a.options[a.selectedIndex]}`}
                            </p>
                            {!a.correct && <p style={{ margin: '3px 0 0', color: '#5cf0c8' }}>Correct answer: <b>{a.options[a.correctIndex]}</b></p>}
                            {a.funFact && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(236,230,250,.55)' }}>💡 {a.funFact}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {localIds.length > 0 && (
                    <button type="button" onClick={() => handleDelete(localIds)} style={{ ...pillBtn, alignSelf: 'flex-start', padding: '9px 14px', fontSize: 12 }}>
                      Delete (this device)
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </PublicShell>
  )
}

const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function OutcomeBadge({ outcome, correctCount, totalLevels }: { outcome: string; correctCount: number; totalLevels: number }) {
  const [text, bg, fg] =
    outcome === 'ended_early'
      ? ['Ended early', 'rgba(79,155,255,.16)', '#9db8ff']
      : correctCount === totalLevels
        ? ['👑 Perfect!', 'rgba(255,216,77,.16)', '#ffd84d']
        : ['Completed', 'rgba(255,255,255,.08)', 'rgba(236,230,250,.7)']
  return <span style={{ padding: '4px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 800 }}>{text}</span>
}
