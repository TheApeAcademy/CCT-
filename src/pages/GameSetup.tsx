import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, createMatch } from '../db/db'
import { playClick, playToggle, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { selectQuestionsForGame } from '../lib/selectQuestions'
import type { GameConfig } from '../db/types'

const TIMER_OPTIONS = [15, 20, 30, 45, 60]
const MAX_TEAMS = 10

export default function GameSetup() {
  const navigate = useNavigate()
  useEffect(() => {
    ensureSeedData()
  }, [])

  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const recentPlayers = useLiveQuery(() => db.players.orderBy('createdAt').reverse().limit(10).toArray(), []) ?? []

  const [teamNames, setTeamNames] = useState<string[]>([''])
  const [setId, setSetId] = useState<number | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [fiftyFifty, setFiftyFifty] = useState(true)
  const [askChurch, setAskChurch] = useState(true)
  const [phoneFriend, setPhoneFriend] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (setId === null && sets.length > 0) setSetId(sets[0].id!)
  }, [sets, setId])

  const questionCount = useLiveQuery(
    () => (setId ? db.questions.where('setId').equals(setId).count() : Promise.resolve(0)),
    [setId]
  ) ?? 0

  const updateTeamName = (index: number, value: string) => {
    setTeamNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  const addTeamSlot = (prefill?: string) => {
    if (teamNames.length >= MAX_TEAMS) return
    setTeamNames((prev) => [...prev, prefill ?? ''])
    playClick()
  }

  const removeTeamSlot = (index: number) => {
    setTeamNames((prev) => prev.filter((_, i) => i !== index))
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
    playNav()
    haptics.success()
    setStarting(true)

    const pool = await db.questions.where('setId').equals(setId).toArray()
    const questionIds = selectQuestionsForGame(pool).map((q) => q.id!)

    const lifelines = { fiftyFifty, askChurch, phoneFriend }
    const matchId = await createMatch({
      setId,
      setName: selectedSet.name,
      questionIds,
      timerSecondsPerQuestion: timerSeconds,
      lifelines,
      teamNames: cleanTeams,
    })

    const config: GameConfig = {
      matchId,
      teamNames: cleanTeams,
      teamIndex: 0,
      setId,
      setName: selectedSet.name,
      timerSecondsPerQuestion: timerSeconds,
      lifelines,
    }
    navigate('/play', { state: config })
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-sm font-bold text-amber-300">
                {i + 1}
              </span>
              <input
                value={name}
                onChange={(e) => updateTeamName(i, e.target.value)}
                placeholder={i === 0 ? 'e.g. Ellie, or Team Rainbow' : `Team ${i + 1}`}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
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

      <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">Question Set</label>
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
        <p className="text-xs text-white/50">{questionCount} question{questionCount === 1 ? '' : 's'} available in this set (10 needed).</p>
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
        <LifelineToggle label="50/50 — remove two wrong answers" checked={fiftyFifty} onChange={setFiftyFifty} />
        <LifelineToggle label="Ask the Church — poll the room" checked={askChurch} onChange={setAskChurch} />
        <LifelineToggle label="Phone a Friend — get a hint" checked={phoneFriend} onChange={setPhoneFriend} />
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
