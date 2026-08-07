import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../db/db'
import type { GameSession, Match, GameConfig } from '../db/types'
import Confetti from '../components/Confetti'
import Fireworks from '../components/Fireworks'
import CountUp from '../components/CountUp'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function Results() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<GameSession | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    db.gameSessions.get(Number(sessionId)).then(async (s) => {
      if (!s) return
      setSession(s)
      const isPerfect = s.correctCount === s.totalLevels
      if (isPerfect) {
        setShowFireworks(true)
        sound.playWin()
        haptics.win()
        window.setTimeout(() => setShowFireworks(false), 4200)
      } else if (s.correctCount > 0) {
        setShowConfetti(true)
        haptics.success()
        window.setTimeout(() => setShowConfetti(false), 3000)
      }
      if (s.matchId) {
        const m = await db.matches.get(s.matchId)
        if (m) setMatch(m)
      }
    })
  }, [sessionId])

  if (!session) return <div className="py-20 text-center text-xl">Loading results…</div>

  const isPerfect = session.correctCount === session.totalLevels
  const endedEarly = session.outcome === 'ended_early'
  const emoji = isPerfect ? '👑' : endedEarly ? '🚪' : session.correctCount >= session.totalLevels / 2 ? '🌟' : '💫'
  const title = isPerfect ? 'PERFECT SCORE!' : endedEarly ? 'Turn Ended' : "Turn Complete!"
  const encouragement = isPerfect
    ? 'Every single question, nailed it. Legendary run!'
    : endedEarly
      ? 'No worries, every point earned still counts.'
      : session.correctCount >= session.totalLevels / 2
        ? 'Great job! Solid round of trivia.'
        : 'Nice try! Every question is a chance to learn something new.'

  const hasNextTeam = !!match && session.teamIndex !== undefined && session.teamIndex < match.teamNames.length - 1

  const durationSec = Math.max(0, Math.round((session.finishedAt - session.startedAt) / 1000))
  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60

  const handleNextTeam = () => {
    if (!match || session.teamIndex === undefined) return
    sound.playNav()
    haptics.tap()
    const nextIndex = session.teamIndex + 1
    const config: GameConfig = {
      matchId: match.id!,
      teamNames: match.teamNames,
      teamIndex: nextIndex,
      setId: match.setId,
      setName: match.setName,
      timerSecondsPerQuestion: match.timerSecondsPerQuestion,
      lifelines: match.lifelines,
    }
    navigate('/play', { state: config })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-center">
      <Confetti active={showConfetti} />
      <Fireworks active={showFireworks} />

      <div>
        <p className="animate-crown-bounce text-6xl drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]">{emoji}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          {isPerfect ? (
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
              {title}
            </span>
          ) : (
            title
          )}
        </h1>
        <p className="mt-1 text-xl text-white/80">{session.playerName}</p>
        {match && (
          <p className="text-sm text-white/40">
            Team {(session.teamIndex ?? 0) + 1} of {match.teamNames.length}
          </p>
        )}
        <p className="mt-1 text-sm text-white/50">{encouragement}</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-wide text-white/60">Score</p>
        <p className="font-display text-5xl font-extrabold text-amber-300">
          <CountUp value={session.pointsWon} /> 👑
        </p>
        <p className="mt-2 text-white/70">
          {session.correctCount} of {session.totalLevels} correct
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Correct" value={session.correctCount} />
        <Stat label="Wrong" value={session.wrongCount} />
        <Stat label="Time Played" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
        <Stat label="Lifelines Used" value={Object.values(session.lifelinesUsed).filter(Boolean).length} />
      </div>

      <div className="rounded-2xl bg-white/5 p-5 text-left">
        <h2 className="mb-3 text-center text-lg font-bold">Question Recap</h2>
        <div className="space-y-2">
          {session.answers.map((a, i) => (
            <div
              key={i}
              className="animate-page-in rounded-xl bg-black/20 p-3 text-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white/50">Q{a.level}</p>
                  <p className="font-medium">{a.questionText}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-bold ${a.correct ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}
                >
                  {a.correct ? '✓ Correct' : a.timedOut ? '⏰ Timed out' : '✗ Wrong'}
                </span>
              </div>
              {!a.correct && (
                <p className="mt-2 text-green-300/90">
                  ✓ Correct answer: <span className="font-semibold">{a.options[a.correctIndex]}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {hasNextTeam ? (
          <button
            onClick={handleNextTeam}
            className="animate-pulse-glow rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
          >
            ▶ Next: {match!.teamNames[(session.teamIndex ?? 0) + 1]}
          </button>
        ) : match ? (
          <Link
            to={`/match-results/${match.id}`}
            onClick={() => sound.playClick()}
            className="animate-pulse-glow rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
          >
            🏆 View Match Results
          </Link>
        ) : null}
        <Link
          to="/setup"
          onClick={() => sound.playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
        >
          🎮 New Game
        </Link>
        <Link
          to="/history"
          onClick={() => sound.playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
        >
          📜 History
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-lg shadow-black/20 transition hover:bg-white/10">
      <div className="font-display text-2xl font-extrabold text-amber-300">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}
