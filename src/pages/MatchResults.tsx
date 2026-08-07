import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db, getMatchSessions } from '../db/db'
import type { GameSession, Match } from '../db/types'
import Fireworks from '../components/Fireworks'
import CountUp from '../components/CountUp'
import { playClick, playWin } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function MatchResults() {
  const { matchId } = useParams()
  const [match, setMatch] = useState<Match | null>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (!matchId) return
    const id = Number(matchId)
    Promise.all([db.matches.get(id), getMatchSessions(id)]).then(([m, s]) => {
      if (m) setMatch(m)
      setSessions(s)
      if (s.length > 1 && s.some((sess) => sess.correctCount === sess.totalLevels)) {
        setShowFireworks(true)
        playWin()
        haptics.win()
        window.setTimeout(() => setShowFireworks(false), 4200)
      }
    })
  }, [matchId])

  if (!match || sessions.length === 0) return <div className="py-20 text-center text-xl">Loading match results…</div>

  const ranked = [...sessions].sort((a, b) => b.pointsWon - a.pointsWon)
  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-center">
      <Fireworks active={showFireworks} />

      <div>
        <img src="/mfm-logo.webp" alt="" className="mx-auto mb-3 h-16 w-16 rounded-full shadow-lg shadow-black/40 ring-2 ring-amber-400/50" />
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
            Match Complete!
          </span>
        </h1>
        <p className="mt-1 text-white/60">{match.setName}</p>
      </div>

      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-6 shadow-2xl">
        <h2 className="mb-4 font-display text-lg font-bold text-white/90">🏆 Final Standings</h2>
        <div className="space-y-2">
          {ranked.map((s, i) => (
            <div
              key={s.id}
              className={`animate-page-in flex items-center justify-between rounded-xl px-4 py-3 transition ${
                i === 0 ? 'bg-amber-400/20 ring-1 ring-amber-400/40' : 'bg-black/20'
              }`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{medal(i)}</span>
                <span className="font-display text-lg font-bold">{s.playerName}</span>
                {s.correctCount === s.totalLevels && <span className="text-sm text-amber-300">Perfect!</span>}
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-300">
                  <CountUp value={s.pointsWon} durationMs={900} /> 👑
                </p>
                <p className="text-xs text-white/50">
                  {s.correctCount}/{s.totalLevels} correct
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-5 text-left">
        <h2 className="mb-4 text-center font-display text-lg font-bold">Full Question Recap</h2>
        <div className="space-y-4">
          {match.questionIds.map((_qid, qIndex) => {
            const sampleAnswer = sessions[0]?.answers[qIndex]
            if (!sampleAnswer) return null
            return (
              <div key={qIndex} className="animate-page-in rounded-xl bg-black/20 p-4" style={{ animationDelay: `${qIndex * 40}ms` }}>
                <p className="text-xs text-white/50">Question {qIndex + 1}</p>
                <p className="font-medium">{sampleAnswer.questionText}</p>
                <p className="mt-1 text-sm text-green-300/90">
                  ✓ Correct answer: <span className="font-semibold">{sampleAnswer.options[sampleAnswer.correctIndex]}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sessions.map((s) => {
                    const a = s.answers[qIndex]
                    if (!a) return null
                    return (
                      <span
                        key={s.id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          a.correct ? 'bg-green-500/25 text-green-300' : 'bg-red-500/25 text-red-300'
                        }`}
                      >
                        {a.correct ? '✓' : '✗'} {s.playerName}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/setup"
          onClick={() => playClick()}
          className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
        >
          🎮 New Match
        </Link>
        <Link
          to="/history"
          onClick={() => playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
        >
          📜 History
        </Link>
        <Link
          to="/"
          onClick={() => playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
        >
          🏠 Home
        </Link>
      </div>
    </div>
  )
}
