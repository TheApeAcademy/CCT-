import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData } from '../db/db'
import { playClick, playToggle, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { GameConfig } from '../db/types'

const TIMER_OPTIONS = [15, 20, 30, 45, 60]

export default function GameSetup() {
  const navigate = useNavigate()
  useEffect(() => {
    ensureSeedData()
  }, [])

  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const recentPlayers = useLiveQuery(() => db.players.orderBy('createdAt').reverse().limit(8).toArray(), []) ?? []

  const [playerName, setPlayerName] = useState('')
  const [setId, setSetId] = useState<number | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [fiftyFifty, setFiftyFifty] = useState(true)
  const [askChurch, setAskChurch] = useState(true)
  const [phoneFriend, setPhoneFriend] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (setId === null && sets.length > 0) setSetId(sets[0].id!)
  }, [sets, setId])

  const questionCount = useLiveQuery(
    () => (setId ? db.questions.where('setId').equals(setId).count() : Promise.resolve(0)),
    [setId]
  ) ?? 0

  const handleStart = () => {
    if (!playerName.trim()) {
      setError("Please enter the kid's or team's name.")
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
    const config: GameConfig = {
      playerName: playerName.trim(),
      setId,
      setName: selectedSet.name,
      timerSecondsPerQuestion: timerSeconds,
      lifelines: { fiftyFifty, askChurch, phoneFriend },
    }
    navigate('/play', { state: config })
  }

  const [errorShake, setErrorShake] = useState(false)
  const shakeError = () => {
    haptics.error()
    setErrorShake(true)
    window.setTimeout(() => setErrorShake(false), 500)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-extrabold">🎮 New Game Setup</h1>

      <div className="space-y-2 rounded-2xl bg-white/5 p-5 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">Player / Team Name</label>
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="e.g. Ellie, or Team Rainbow"
          className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
        />
        {recentPlayers.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {recentPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPlayerName(p.name)
                  playClick()
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-xs transition hover:scale-105 hover:bg-white/20"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-2xl bg-white/5 p-5 transition hover:bg-white/[0.07]">
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

      <div className="space-y-2 rounded-2xl bg-white/5 p-5 transition hover:bg-white/[0.07]">
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

      <div className="space-y-3 rounded-2xl bg-white/5 p-5 transition hover:bg-white/[0.07]">
        <label className="block text-sm font-semibold text-white/80">Lifelines</label>
        <LifelineToggle label="50/50 — remove two wrong answers" checked={fiftyFifty} onChange={setFiftyFifty} />
        <LifelineToggle label="Ask the Church — poll the room" checked={askChurch} onChange={setAskChurch} />
        <LifelineToggle label="Phone a Friend — get a hint" checked={phoneFriend} onChange={setPhoneFriend} />
      </div>

      {error && <p className={`text-sm text-red-400 ${errorShake ? 'animate-screen-shake' : ''}`}>{error}</p>}

      <button
        onClick={handleStart}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
      >
        Start Game →
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
