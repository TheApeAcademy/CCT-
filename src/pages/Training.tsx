import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, getOrCreatePlayer } from '../db/db'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'
import CountUp from '../components/CountUp'
import { useKidProfile, KidSignupCard, KidProfileBar } from '../components/KidProfile'
import type { Question } from '../db/types'

type Phase = 'setup' | 'question' | 'feedback' | 'summary'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Training() {
  useEffect(() => {
    ensureSeedData()
  }, [])

  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const { profile, save: saveProfile, clear: clearProfile } = useKidProfile()
  const playerName = profile?.name ?? ''

  const [phase, setPhase] = useState<Phase>('setup')
  const [setId, setSetId] = useState<number | null>(null)
  const [pool, setPool] = useState<Question[]>([])
  const [queue, setQueue] = useState<Question[]>([])
  const [current, setCurrent] = useState<Question | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)
  const [shake, setShake] = useState(false)

  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [startedAt, setStartedAt] = useState(0)

  useEffect(() => {
    if (setId === null && sets.length > 0) setSetId(sets[0].id!)
  }, [sets, setId])

  const nextFromQueue = useCallback(
    (fromQueue: Question[], fromPool: Question[]) => {
      let q = fromQueue
      if (q.length === 0) q = shuffle(fromPool)
      const [head, ...rest] = q
      setCurrent(head)
      setQueue(rest)
      setSelectedIndex(null)
      setRevealed(false)
      setPhase('question')
    },
    []
  )

  const handleStart = async () => {
    if (!setId || !profile) return
    const qs = await db.questions.where('setId').equals(setId).toArray()
    if (qs.length < 4) return
    await getOrCreatePlayer(profile.name, profile.className)
    sound.playNav()
    haptics.success()
    const shuffled = shuffle(qs)
    setPool(qs)
    setAnswered(0)
    setCorrect(0)
    setStreak(0)
    setBestStreak(0)
    setStartedAt(Date.now())
    nextFromQueue(shuffled, qs)
  }

  const handleSelect = (index: number) => {
    if (phase !== 'question' || !current) return
    setSelectedIndex(index)
    haptics.select()
    sound.playDrumroll(0.5)
    window.setTimeout(() => {
      setRevealed(true)
      const isCorrect = index === current.correctIndex
      setAnswered((a) => a + 1)
      if (isCorrect) {
        setCorrect((c) => c + 1)
        setStreak((s) => {
          const next = s + 1
          setBestStreak((b) => Math.max(b, next))
          return next
        })
        sound.playCorrect()
        sound.playApplause()
        haptics.success()
        setFlash('green')
        setShowConfetti(true)
        window.setTimeout(() => setShowConfetti(false), 1500)
      } else {
        setStreak(0)
        sound.playWrong()
        sound.playOops()
        haptics.error()
        setFlash('red')
        setShake(true)
        window.setTimeout(() => setShake(false), 500)
      }
      window.setTimeout(() => setFlash(null), 600)
      window.setTimeout(() => setPhase('feedback'), 250)
    }, 500)
  }

  const handleNext = () => {
    sound.playWhoosh()
    nextFromQueue(queue, pool)
  }

  const handleEnd = async () => {
    sound.playClick()
    haptics.tap()
    if (answered > 0 && setId) {
      const selectedSet = sets.find((s) => s.id === setId)
      await db.practiceSessions.add({
        playerName: profile?.name ?? 'Guest',
        setId,
        setName: selectedSet?.name ?? '',
        startedAt,
        finishedAt: Date.now(),
        questionsAnswered: answered,
        correctCount: correct,
        bestStreak,
      })
    }
    setPhase('summary')
  }

  const handleTrainAgain = () => {
    setPhase('setup')
  }

  const optionLabel = (i: number) => String.fromCharCode(65 + i)
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

  if (phase === 'setup') {
    if (!profile) {
      return <KidSignupCard subtitle="Sign up once and Training will remember you next time." onDone={saveProfile} />
    }
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="text-center">
          <p className="text-4xl">🏋️</p>
          <h1 className="font-display text-3xl font-extrabold">Training Mode</h1>
          <p className="mt-2 text-white/60">
            Practice as many times as you want. No teams, no timer, no pressure. Just train, train, train, train.
          </p>
        </div>

        <KidProfileBar profile={profile} onSwitch={clearProfile} />

        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
          <label className="block text-sm font-semibold text-white/80">Question Set</label>
          <select
            value={setId ?? ''}
            onChange={(e) => {
              setSetId(Number(e.target.value))
              sound.playClick()
            }}
            className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          >
            {sets.map((s) => (
              <option key={s.id} value={s.id} className="text-black">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleStart}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
        >
          Start Training →
        </button>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-center">
        <p className="text-6xl">🎉</p>
        <h1 className="font-display text-4xl font-extrabold">Nice Training Session!</h1>
        <p className="text-white/60">
          {playerName || 'Guest'}
          {profile?.className && <span className="text-white/40"> · {profile.className}</span>}
        </p>

        <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-wide text-white/60">Accuracy</p>
          <p className="font-display text-5xl font-extrabold text-amber-300">
            <CountUp value={accuracy} /> %
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Answered" value={answered} />
          <Stat label="Correct" value={correct} />
          <Stat label="Best Streak" value={bestStreak} />
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button
            onClick={handleTrainAgain}
            className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
          >
            🏋️ Train Again
          </button>
        </div>
      </div>
    )
  }

  if (!current) return <div className="py-20 text-center text-xl">Loading…</div>

  const showResult = revealed
  const suspense = selectedIndex !== null && !revealed

  return (
    <div className="relative mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Confetti active={showConfetti} />
      {flash && <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />}

      <div className={`space-y-4 ${shake ? 'animate-screen-shake' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-white/60">Training as</p>
            <p className="font-display text-xl font-bold">{playerName || 'Guest'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white/60">Streak</p>
              <p className="text-lg font-bold text-amber-300">{streak} 🔥</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Accuracy</p>
              <p className="text-lg font-bold text-amber-300">{accuracy}%</p>
            </div>
            <button onClick={handleEnd} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              End Training
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <img
            src="/children-ministry-logo-splash.png"
            alt=""
            aria-hidden="true"
            className="relative z-10 -mb-8 h-14 w-14 rounded-full object-contain shadow-lg shadow-black/40 ring-2 ring-amber-400/60"
          />
        </div>
        <div className="hex-frame mx-auto w-full">
          <div className="hex-fill flex min-h-[100px] flex-col items-center justify-center gap-2 px-10 py-6 text-center">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-black/30 px-3 py-1">{current.category}</span>
              <span className="rounded-full bg-black/30 px-3 py-1">Difficulty {current.difficulty}</span>
            </div>
            <p className="font-display text-xl font-bold leading-snug sm:text-2xl">{current.text}</p>
          </div>
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {current.options.map((opt, i) => {
            const isSelected = selectedIndex === i
            const isCorrectAnswer = i === current.correctIndex
            let fillClasses = 'from-indigo-800/80 to-indigo-950/80'
            let borderClass = 'border-white/20'
            if (suspense && isSelected) {
              fillClasses = 'from-amber-500/70 to-amber-600/70'
              borderClass = 'border-amber-200'
            }
            if (showResult) {
              if (isCorrectAnswer) {
                fillClasses = 'from-green-600/90 to-green-800/90'
                borderClass = 'border-green-200'
              } else if (isSelected) {
                fillClasses = 'from-red-600/90 to-red-800/90'
                borderClass = 'border-red-200'
              } else {
                fillClasses = 'from-slate-800/40 to-slate-900/40'
                borderClass = 'border-white/10'
              }
            }
            return (
              <button
                key={i}
                disabled={phase !== 'question'}
                onClick={() => handleSelect(i)}
                className={`hex-pill flex items-center gap-3 border-2 bg-gradient-to-br px-6 py-4 text-left text-lg font-semibold text-white transition-all duration-300 ${fillClasses} ${borderClass} ${
                  phase === 'question' ? 'cursor-pointer hover:scale-[1.02] hover:brightness-110' : ''
                }`}
              >
                <span className="shrink-0 text-amber-300">◆</span>
                <span className="shrink-0 font-bold">{optionLabel(i)}:</span>
                <span className="truncate">{opt}</span>
                {showResult && isCorrectAnswer && <span className="ml-auto shrink-0 text-xl">✅</span>}
                {showResult && isSelected && !isCorrectAnswer && <span className="ml-auto shrink-0 text-xl">❌</span>}
              </button>
            )
          })}
        </div>

        {phase === 'feedback' && (
          <div
            className={`animate-page-in rounded-2xl p-5 text-center ring-1 ${
              selectedIndex === current.correctIndex ? 'bg-green-900/40 ring-green-400/30' : 'bg-red-900/30 ring-red-400/30'
            }`}
          >
            <p className="mb-2 font-display text-lg font-bold">
              {selectedIndex === current.correctIndex
                ? '✅ Correct!'
                : `❌ Not quite. The correct answer was ${optionLabel(current.correctIndex)}: ${current.options[current.correctIndex]}`}
            </p>
            {current.funFact && <p className="mb-3 text-sm text-white/70">💡 {current.funFact}</p>}
            <button
              onClick={handleNext}
              className="animate-pulse-glow rounded-xl bg-amber-400 px-6 py-3 font-bold text-purple-950 transition hover:scale-105"
            >
              Next Question →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-lg shadow-black/20">
      <div className="font-display text-2xl font-extrabold text-amber-300">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}
