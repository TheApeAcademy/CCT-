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
    <div data-landing-theme="light" className="site-light-theme lp-page full-bleed px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">🗓️ Seasons</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Run the Bible quiz in seasons, e.g. "Season 1: Junior Church 2026". Question sets and matches are tagged
          with whichever season is active when they're created, so History and results can be grouped by season.
        </p>
      </div>

      <div className="panel space-y-3 p-5">
        {seasons.length === 0 && <p className="text-sm text-[var(--ink-faint)]">Setting up your first season…</p>}
        {seasons.map((season) => {
          const counts = countsFor(season.id)
          return (
            <div
              key={season.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 transition ${
                season.isActive ? 'bg-[var(--gold)]/15 ring-1 ring-[var(--gold)]/40' : 'bg-[var(--ink-raised)]'
              }`}
            >
              <div>
                <p className="font-display text-lg font-bold">
                  {season.name} {season.isActive && <span className="ml-1 text-xs font-semibold text-[var(--gold)]">● ACTIVE</span>}
                </p>
                <p className="text-xs text-[var(--ink-faint)]">
                  {counts.sets} question set{counts.sets === 1 ? '' : 's'} · {counts.matches} match{counts.matches === 1 ? '' : 'es'}
                </p>
              </div>
              {!season.isActive && (
                <button onClick={() => handleActivate(season.id!)} className="btn-outline px-4 py-2 text-sm">
                  Make active
                </button>
              )}
            </div>
          )
        })}
      </div>

      {creating ? (
        <div className="panel space-y-2 p-5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='e.g. "Season 2: Summer 2026"'
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-solid flex-1 py-2">
              Create &amp; make active
            </button>
            <button onClick={() => setCreating(false)} className="btn-outline flex-1 py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full rounded-2xl border border-dashed border-[var(--hairline-strong)] py-3 text-sm text-[var(--ink-muted)] transition hover:scale-[1.01] hover:bg-[var(--ink-panel)]"
        >
          + Start a new season
        </button>
      )}
      </div>
    </div>
  )
}
