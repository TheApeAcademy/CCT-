import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../db/db'
import type { GameSession } from '../db/types'
import Confetti from '../components/Confetti'
import * as sound from '../lib/sound'

const OUTCOME_COPY: Record<GameSession['outcome'], { title: string; emoji: string }> = {
  won: { title: 'TRIVIA CHAMPION!', emoji: '👑' },
  walked_away: { title: 'Walked Away a Winner!', emoji: '🚪' },
  lost: { title: 'Game Over', emoji: '💫' },
}

export default function Results() {
  const { sessionId } = useParams()
  const [session, setSession] = useState<GameSession | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    db.gameSessions.get(Number(sessionId)).then((s) => {
      if (!s) return
      setSession(s)
      if (s.outcome !== 'lost') {
        setShowConfetti(true)
        if (s.outcome === 'won') sound.playWin()
        window.setTimeout(() => setShowConfetti(false), 4000)
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

      <div>
        <p className="text-6xl">{copy.emoji}</p>
        <h1 className="mt-2 text-4xl font-extrabold">{copy.title}</h1>
        <p className="mt-1 text-xl text-white/80">{session.playerName}</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-8">
        <p className="text-sm uppercase tracking-wide text-white/60">Points Won</p>
        <p className="text-5xl font-extrabold text-amber-300">{session.pointsWon.toLocaleString()} 👑</p>
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
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-black/20 p-3 text-sm">
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
        <Link to="/setup" className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 hover:scale-105 transition">
          🎮 Play Again
        </Link>
        <Link to="/history" className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold hover:bg-white/20 transition">
          🏆 View History
        </Link>
        <Link to="/" className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold hover:bg-white/20 transition">
          🏠 Home
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-2xl font-extrabold text-amber-300">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}
