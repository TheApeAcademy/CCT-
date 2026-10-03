import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureActiveSeason, createSeason, setActiveSeason } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import PublicShell from '../components/public/PublicShell'
import { display, field, grid } from '../components/public/kit'

const monthYear = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

export default function Seasons() {
  const seasons = useLiveQuery(() => db.seasons.orderBy('createdAt').reverse().toArray(), []) ?? []
  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? []
  const sessions = useLiveQuery(() => db.gameSessions.toArray(), []) ?? []

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    ensureActiveSeason()
  }, [])

  // The design's top three per season, from the matches actually played on
  // this device: each team's points added up across the season's matches.
  const topBySeason = useMemo(() => {
    const seasonOfMatch = new Map(matches.map((m) => [m.id, m.seasonId]))
    const out = new Map<number, [string, number][]>()
    for (const season of seasons) {
      const totals = new Map<string, number>()
      for (const s of sessions) {
        const inSeason = s.matchId !== undefined ? seasonOfMatch.get(s.matchId) === season.id : s.seasonName === season.name
        if (inSeason) totals.set(s.playerName, (totals.get(s.playerName) ?? 0) + s.pointsWon)
      }
      out.set(season.id!, [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3))
    }
    return out
  }, [seasons, sessions, matches])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const id = await createSeason(name)
    await setActiveSeason(id)
    playClick()
    haptics.success()
    setNewName('')
    setCreating(false)
  }

  const handleActivate = async (id: number) => {
    await setActiveSeason(id)
    playClick()
    haptics.tap()
  }

  const btn = (solid: boolean) => ({ padding: '11px 18px', borderRadius: 999, border: solid ? 'none' : '1px solid rgba(255,255,255,.25)', background: solid ? '#ffd84d' : 'transparent', color: solid ? '#1a0f2e' : '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' as const })

  return (
    <PublicShell eyebrow="Seasons" title="Quiz seasons" sub="Seasons run for a few months. Question sets and matches are tagged with whichever season is live when they are made." accent="#ff4fa3">
      <div style={grid(320)}>
        {seasons.length === 0 && <p style={{ margin: 0, color: 'rgba(236,230,250,.55)' }}>Setting up your first season…</p>}
        {seasons.map((season) => {
          const live = season.isActive
          const top = topBySeason.get(season.id!) ?? []
          const setCount = sets.filter((s) => s.seasonId === season.id).length
          const matchCount = matches.filter((m) => m.seasonId === season.id).length
          return (
            <div key={season.id} style={{ position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 28, background: live ? 'linear-gradient(160deg,rgba(255,79,163,.28),rgba(40,10,60,.9))' : 'rgba(255,255,255,.05)', border: `1px solid ${live ? 'rgba(255,79,163,.5)' : 'rgba(255,255,255,.1)'}` }}>
              <span style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: 999, background: live ? '#ff4fa3' : 'rgba(255,255,255,.1)', color: live ? '#fff' : 'rgba(236,230,250,.7)', fontSize: 11, fontWeight: 800, letterSpacing: '.1em' }}>{live ? 'LIVE' : 'FINISHED'}</span>
              <p style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 26, color: '#fff', overflowWrap: 'anywhere' }}>{season.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(236,230,250,.65)' }}>
                Started {monthYear(season.createdAt)} · {setCount} set{setCount === 1 ? '' : 's'} · {matchCount} match{matchCount === 1 ? '' : 'es'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
                {top.length === 0 && <p style={{ margin: 0, padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,.2)', fontSize: 14, color: 'rgba(236,230,250,.55)' }}>No matches played yet.</p>}
                {top.map(([n, p], i) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,.2)' }}>
                    <span style={{ width: 22, fontFamily: display, fontWeight: 800, color: i === 0 ? '#ffd84d' : 'rgba(236,230,250,.6)' }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{n}</span>
                    <span style={{ fontWeight: 800, color: '#ffd84d' }}>{p}</span>
                  </div>
                ))}
              </div>
              {!live && (
                <button type="button" onClick={() => handleActivate(season.id!)} style={{ ...btn(false), marginTop: 16 }}>
                  Make live
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        {creating ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='e.g. "Season 2: Summer 2026"'
              className="pb-field"
              style={{ ...field, flex: '1 1 260px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button type="button" onClick={handleCreate} style={btn(true)}>
              Create and make live
            </button>
            <button type="button" onClick={() => setCreating(false)} style={btn(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setCreating(true)} style={{ ...btn(false), borderStyle: 'dashed' }}>
            + Start a new season
          </button>
        )}
      </div>
    </PublicShell>
  )
}
