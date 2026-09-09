import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureActiveSeason, createSeason, setActiveSeason } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function Seasons() {
  const seasons = useLiveQuery(() => db.seasons.orderBy('createdAt').reverse().toArray(), []) ?? []
  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? []

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    ensureActiveSeason()
  }, [])

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

  const countsFor = (seasonId?: number) => ({
    sets: sets.filter((s) => s.seasonId === seasonId).length,
    matches: matches.filter((m) => m.seasonId === seasonId).length,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">🗓️ Seasons</h1>
        <p className="mt-1 text-sm text-white/60">
          Run the Bible quiz in seasons, e.g. "Season 1: Junior Church 2026". Question sets and matches are tagged
          with whichever season is active when they're created, so History and results can be grouped by season.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        {seasons.length === 0 && <p className="text-sm text-white/50">Setting up your first season…</p>}
        {seasons.map((season) => {
          const counts = countsFor(season.id)
          return (
            <div
              key={season.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 transition ${
                season.isActive ? 'bg-amber-400/15 ring-1 ring-amber-400/40' : 'bg-black/20'
              }`}
            >
              <div>
                <p className="font-display text-lg font-bold">
                  {season.name} {season.isActive && <span className="ml-1 text-xs font-semibold text-amber-300">● ACTIVE</span>}
                </p>
                <p className="text-xs text-white/50">
                  {counts.sets} question set{counts.sets === 1 ? '' : 's'} · {counts.matches} match{counts.matches === 1 ? '' : 'es'}
                </p>
              </div>
              {!season.isActive && (
                <button
                  onClick={() => handleActivate(season.id!)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:scale-105 hover:bg-white/20"
                >
                  Make active
                </button>
              )}
            </div>
          )
        })}
      </div>

      {creating ? (
        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='e.g. "Season 2: Summer 2026"'
            className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 rounded-lg bg-amber-400 py-2 font-semibold text-purple-950">
              Create & make active
            </button>
            <button onClick={() => setCreating(false)} className="flex-1 rounded-lg bg-white/10 py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full rounded-2xl border border-dashed border-white/30 py-3 text-sm text-white/70 transition hover:scale-[1.01] hover:bg-white/5"
        >
          + Start a new season
        </button>
      )}
    </div>
  )
}
