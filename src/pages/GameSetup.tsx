import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, ensureActiveSeason, createMatch } from '../db/db'
import { playClick, playToggle, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { selectQuestionsForGame } from '../lib/selectQuestions'
import { fileToResizedDataUrl } from '../lib/image'
import type { GameConfig } from '../db/types'

const TIMER_OPTIONS = [15, 20, 30, 45, 60]
const MAX_TEAMS = 10

const emptyQuestionForm = {
  text: '',
  category: '',
  difficulty: 1 as 1 | 2 | 3 | 4 | 5,
  options: ['', '', '', ''] as [string, string, string, string],
  correctIndex: 0 as 0 | 1 | 2 | 3,
  funFact: '',
}

export default function GameSetup() {
  const navigate = useNavigate()
  useEffect(() => {
    ensureSeedData()
  }, [])

  const seasons = useLiveQuery(() => db.seasons.orderBy('createdAt').reverse().toArray(), []) ?? []
  const allSets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const recentPlayers = useLiveQuery(() => db.players.orderBy('createdAt').reverse().limit(10).toArray(), []) ?? []

  const [teamNames, setTeamNames] = useState<string[]>([''])
  const [teamPhotos, setTeamPhotos] = useState<(string | undefined)[]>([undefined])
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all')
  const [setId, setSetId] = useState<number | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [fiftyFifty, setFiftyFifty] = useState(true)
  const [askChurch, setAskChurch] = useState(true)
  const [phoneFriend, setPhoneFriend] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    ensureActiveSeason().then((season) => setSeasonFilter((v) => (v === 'all' ? season.id! : v)))
  }, [])

  const sets = useMemo(
    () => (seasonFilter === 'all' ? allSets : allSets.filter((s) => s.seasonId === seasonFilter)),
    [allSets, seasonFilter]
  )

  useEffect(() => {
    if (sets.length > 0 && !sets.some((s) => s.id === setId)) setSetId(sets[0].id!)
    if (sets.length === 0) setSetId(null)
  }, [sets, setId])

  const questionCount = useLiveQuery(
    () => (setId ? db.questions.where('setId').equals(setId).count() : Promise.resolve(0)),
    [setId]
  ) ?? 0

  // ---------- quick "add a question" panel, right here on the game setup page ----------
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickForm, setQuickForm] = useState(emptyQuestionForm)
  const [quickError, setQuickError] = useState('')
  const [quickSaved, setQuickSaved] = useState(false)

  const handleQuickAddQuestion = async () => {
    if (!setId) return
    if (!quickForm.text.trim()) return setQuickError('Question text is required.')
    if (quickForm.options.some((o) => !o.trim())) return setQuickError('All four options are required.')
    await db.questions.add({
      setId,
      category: quickForm.category.trim() || 'General',
      difficulty: quickForm.difficulty,
      text: quickForm.text.trim(),
      options: quickForm.options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex: quickForm.correctIndex,
      funFact: quickForm.funFact.trim() || undefined,
    })
    setQuickForm(emptyQuestionForm)
    setQuickError('')
    setQuickSaved(true)
    playClick()
    haptics.success()
    window.setTimeout(() => setQuickSaved(false), 1800)
  }

  // ---------- contestant photos ----------
  const handlePhotoPick = async (index: number, file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setTeamPhotos((prev) => {
        const next = [...prev]
        next[index] = dataUrl
        return next
      })
      haptics.tap()
    } catch {
      setError('Could not use that photo. Try a different image.')
    }
  }

  const removePhoto = (index: number) => {
    setTeamPhotos((prev) => {
      const next = [...prev]
      next[index] = undefined
      return next
    })
  }

  const updateTeamName = (index: number, value: string) => {
    setTeamNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  const addTeamSlot = (prefill?: string) => {
    if (teamNames.length >= MAX_TEAMS) return
    setTeamNames((prev) => [...prev, prefill ?? ''])
    setTeamPhotos((prev) => [...prev, undefined])
    playClick()
  }

  const removeTeamSlot = (index: number) => {
    setTeamNames((prev) => prev.filter((_, i) => i !== index))
    setTeamPhotos((prev) => prev.filter((_, i) => i !== index))
    haptics.tap()
  }

  const quickAddPlayer = (name: string) => {
    const emptyIndex = teamNames.findIndex((n) => !n.trim())
    if (emptyIndex >= 0) {
      updateTeamName(emptyIndex, name)
    } else {
      addTeamSlot(name)
    }
    playClick()
  }

  const [errorShake, setErrorShake] = useState(false)
  const shakeError = () => {
    haptics.error()
    setErrorShake(true)
    window.setTimeout(() => setErrorShake(false), 500)
  }

  const handleStart = async () => {
    const cleanTeams = teamNames.map((n) => n.trim()).filter(Boolean)
    if (cleanTeams.length === 0) {
      setError('Enter at least one team or player name.')
      return shakeError()
    }
    if (!setId) {
      setError('Please choose a question set.')
      return shakeError()
    }
    if (questionCount < 10) {
      setError('This set needs at least 10 questions to fill all 10 levels. Add more in the Question Bank.')
      return shakeError()
    }

    const selectedSet = sets.find((s) => s.id === setId)!
    const season = seasons.find((s) => s.id === selectedSet.seasonId)
    playNav()
    haptics.success()
    setStarting(true)

    const pool = await db.questions.where('setId').equals(setId).toArray()
    const questionIds = selectQuestionsForGame(pool).map((q) => q.id!)

    // Photos are aligned to the original team slots; keep only the ones for teams that ended up with a name.
    const cleanPhotos = teamNames.map((n, i) => (n.trim() ? teamPhotos[i] : undefined)).filter((_, i) => teamNames[i].trim())

    const lifelines = { fiftyFifty, askChurch, phoneFriend }
    const matchId = await createMatch({
      setId,
      setName: selectedSet.name,
      seasonId: selectedSet.seasonId,
      seasonName: season?.name,
      questionIds,
      timerSecondsPerQuestion: timerSeconds,
      lifelines,
      teamNames: cleanTeams,
      teamPhotos: cleanPhotos,
    })

    const config: GameConfig = {
      matchId,
      teamNames: cleanTeams,
      teamPhotos: cleanPhotos,
      teamIndex: 0,
      setId,
      setName: selectedSet.name,
      seasonName: season?.name,
      timerSecondsPerQuestion: timerSeconds,
      lifelines,
    }
    navigate('/ground-rules', { state: config })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-extrabold">🎮 New Game Setup</h1>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">
          Teams / Players <span className="font-normal text-white/40">(each takes a turn, in order)</span>
        </label>
        <div className="space-y-2">
          {teamNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <label className="relative shrink-0 cursor-pointer" title="Add a contestant photo">
                {teamPhotos[i] ? (
                  <img
                    src={teamPhotos[i]}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-400/60"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-sm font-bold text-amber-300">
                    {i + 1}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoPick(i, e.target.files?.[0])}
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-950 text-[9px] ring-1 ring-white/30">
                  📷
                </span>
              </label>
              <input
                value={name}
                onChange={(e) => updateTeamName(i, e.target.value)}
                placeholder={i === 0 ? 'e.g. Ellie, or Team Rainbow' : `Team ${i + 1}`}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
              {teamPhotos[i] && (
                <button
                  onClick={() => removePhoto(i)}
                  className="shrink-0 rounded-lg bg-white/10 px-2 py-3 text-xs text-white/60 transition hover:scale-105 hover:bg-white/20"
                  title="Remove photo"
                >
                  🚫📷
                </button>
              )}
              {teamNames.length > 1 && (
                <button
                  onClick={() => removeTeamSlot(i)}
                  className="shrink-0 rounded-lg bg-white/10 px-3 py-3 text-sm text-white/60 transition hover:scale-105 hover:bg-red-500/30 hover:text-red-300"
                  title="Remove team"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {teamNames.length < MAX_TEAMS && (
          <button
            onClick={() => addTeamSlot()}
            className="w-full rounded-lg border border-dashed border-white/30 py-2 text-sm text-white/70 transition hover:scale-[1.01] hover:bg-white/5"
          >
            + Add another team
          </button>
        )}

        {recentPlayers.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {recentPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => quickAddPlayer(p.name)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs transition hover:scale-105 hover:bg-white/20"
              >
                + {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {seasons.length > 1 && (
        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:bg-white/[0.07]">
          <label className="block text-sm font-semibold text-white/80">Season</label>
          <select
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              playClick()
            }}
            className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all" className="text-black">
              All seasons
            </option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id} className="text-black">
                {s.name} {s.isActive ? '(active)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">Question Set</label>
        {sets.length === 0 ? (
          <p className="text-sm text-white/50">No question sets in this season yet. Add one in the Question Bank.</p>
        ) : (
          <select
            value={setId ?? ''}
            onChange={(e) => {
              setSetId(Number(e.target.value))
              playClick()
            }}
            className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          >
            {sets.map((s) => (
              <option key={s.id} value={s.id} className="text-black">
                {s.name}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-white/50">{questionCount} question{questionCount === 1 ? '' : 's'} available in this set (10 needed).</p>

        {setId && (
          <div className="pt-1">
            <button
              onClick={() => {
                setShowQuickAdd((v) => !v)
                playClick()
              }}
              className="w-full rounded-lg border border-dashed border-white/30 py-2 text-sm text-white/70 transition hover:scale-[1.01] hover:bg-white/5"
            >
              {showQuickAdd ? '▲ Hide question bank' : '📚 Add a question to this set (admin)'}
            </button>
            {showQuickAdd && (
              <div className="mt-3 space-y-2 rounded-xl bg-black/20 p-4">
                {quickError && <p className="text-sm text-red-400">{quickError}</p>}
                {quickSaved && <p className="text-sm text-green-400">Question added! ✅</p>}
                <textarea
                  value={quickForm.text}
                  onChange={(e) => setQuickForm({ ...quickForm, text: e.target.value })}
                  placeholder="Question text"
                  rows={2}
                  className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input
                    value={quickForm.category}
                    onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })}
                    placeholder="Category"
                    className="col-span-2 rounded-lg bg-white/10 px-3 py-2 text-sm sm:col-span-2 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <select
                    value={quickForm.difficulty}
                    onChange={(e) => setQuickForm({ ...quickForm, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                    className="col-span-2 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 sm:col-span-2"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d} className="text-black">
                        Difficulty {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quickForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickForm({ ...quickForm, correctIndex: i as 0 | 1 | 2 | 3 })}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          quickForm.correctIndex === i ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'
                        }`}
                        title="Mark as correct answer"
                      >
                        {String.fromCharCode(65 + i)}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => {
                          const options = [...quickForm.options] as [string, string, string, string]
                          options[i] = e.target.value
                          setQuickForm({ ...quickForm, options })
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleQuickAddQuestion}
                  className="w-full rounded-lg bg-amber-400 py-2 text-sm font-semibold text-purple-950 transition hover:scale-[1.01]"
                >
                  + Add question to "{sets.find((s) => s.id === setId)?.name}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">Timer per Question</label>
        <div className="flex flex-wrap gap-2">
          {TIMER_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTimerSeconds(t)
                playClick()
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition hover:scale-105 ${
                timerSeconds === t ? 'bg-amber-400 text-purple-950 shadow-lg shadow-amber-400/30' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">Lifelines (per team, per turn)</label>
        <LifelineToggle label="50/50: remove two wrong answers" checked={fiftyFifty} onChange={setFiftyFifty} />
        <LifelineToggle label="Ask the Church: poll the room" checked={askChurch} onChange={setAskChurch} />
        <LifelineToggle label="Phone a Friend: get a hint" checked={phoneFriend} onChange={setPhoneFriend} />
      </div>

      {error && <p className={`text-sm text-red-400 ${errorShake ? 'animate-screen-shake' : ''}`}>{error}</p>}

      <button
        onClick={handleStart}
        disabled={starting}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
      >
        {starting ? 'Starting…' : 'Start Game →'}
      </button>
    </div>
  )
}

function LifelineToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg bg-white/5 px-4 py-3 transition hover:bg-white/10">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked)
          playToggle(e.target.checked)
        }}
        className="h-5 w-5 accent-amber-400"
      />
    </label>
  )
}
