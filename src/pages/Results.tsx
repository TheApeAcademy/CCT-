import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../db/db'
import type { GameSession } from '../db/types'
import Confetti from '../components/Confetti'
import Fireworks from '../components/Fireworks'
import CountUp from '../components/CountUp'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'

const OUTCOME_COPY: Record<GameSession['outcome'], { title: string; emoji: string; encouragement: string }> = {
  won: { title: 'TRIVIA CHAMPION!', emoji: '👑', encouragement: 'Every level, nailed it. Legendary run!' },
  walked_away: { title: 'Walked Away a Winner!', emoji: '🚪', encouragement: 'Smart move — banking those points like a pro.' },
  lost: { title: 'Game Over', emoji: '💫', encouragement: 'Great effort! Every question is a chance to learn something new.' },
}

export default function Results() {
  const { sessionId } = useParams()
  const [session, setSession] = useState<GameSession | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    db.gameSessions.get(Number(sessionId)).then((s) => {
      if (!s) return
      setSession(s)
      if (s.outcome === 'won') {
        setShowFireworks(true)
        sound.playWin()
        haptics.win()
        window.setTimeout(() => setShowFireworks(false), 4200)
      } else if (s.outcome === 'walked_away') {
        setShowConfetti(true)
        haptics.success()
        window.setTimeout(() => setShowConfetti(false), 3500)
      }
    })
  }, [sessionId])

  if (!session) return <div className="py-20 text-center text-xl">Loading results…</div>

  const copy = OUTCOME_COPY[session.outcome]
  const durationSec = Math.max(0, Math.round((session.finishedAt - session.startedAt) / 1000))
  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-center">
      <Confetti active={showConfetti} />
      <Fireworks active={showFireworks} />

      <div>
        <p className="animate-crown-bounce text-6xl drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]">{copy.emoji}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          {session.outcome === 'won' ? (
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
              {copy.title}
            </span>
          ) : (
            copy.title
          )}
        </h1>
        <p className="mt-1 text-xl text-white/80">{session.playerName}</p>
        <p className="mt-1 text-sm text-white/50">{copy.encouragement}</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-wide text-white/60">Points Won</p>
        <p className="font-display text-5xl font-extrabold text-amber-300">
          <CountUp value={session.pointsWon} /> 👑
        </p>
        <p className="mt-2 text-white/70">Reached Level {session.levelReached} of {session.totalLevels}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Correct" value={session.correctCount} />
        <Stat label="Wrong" value={session.wrongCount} />
        <Stat label="Time Played" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
        <Stat
          label="Lifelines Used"
          value={Object.values(session.lifelinesUsed).filter(Boolean).length}
        />
      </div>

      <div className="rounded-2xl bg-white/5 p-5 text-left">
        <h2 className="mb-3 text-center text-lg font-bold">Question Recap</h2>
        <div className="space-y-2">
          {session.answers.map((a, i) => (
            <div
              key={i}
              className="animate-page-in flex items-start justify-between gap-3 rounded-xl bg-black/20 p-3 text-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <p className="text-white/50">Level {a.level}</p>
                <p className="font-medium">{a.questionText}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 font-bold ${a.correct ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                {a.correct ? '✓ Correct' : a.timedOut ? '⏰ Timed out' : '✗ Wrong'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/setup"
          onClick={() => sound.playClick()}
          className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
        >
          🎮 Play Again
        </Link>
        <Link
          to="/history"
          onClick={() => sound.playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
        >
          🏆 View History
        </Link>
        <Link
          to="/"
          onClick={() => sound.playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
        >
          🏠 Home
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
      <div className="font-display text-2xl font-extrabold text-amber-300">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}
