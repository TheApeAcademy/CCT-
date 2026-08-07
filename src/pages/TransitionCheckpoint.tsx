import { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import QuizRunner, { type QuizAnswer } from '../components/QuizRunner'
import CountUp from '../components/CountUp'
import { playWin, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function TransitionCheckpoint() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const player = searchParams.get('player') ?? 'Guest'
  const lectureId = Number(id)

  const lecture = useLiveQuery(() => db.transitionLectures.get(lectureId), [lectureId])
  const questions = useLiveQuery(() => db.transitionQuestions.where('lectureId').equals(lectureId).toArray(), [lectureId])

  const [result, setResult] = useState<{ correct: number; total: number } | null>(null)

  const handleComplete = async (answers: QuizAnswer[]) => {
    const correct = answers.filter((a) => a.correct).length
    await db.transitionCheckpointResults.add({
      playerName: player,
      lectureId,
      score: correct,
      total: answers.length,
      passedAt: Date.now(),
    })
    if (correct === answers.length) {
      playWin()
      haptics.win()
    }
    setResult({ correct, total: answers.length })
  }

  if (!lecture || !questions) return <div className="py-20 text-center text-xl">Loading…</div>

  if (result) {
    const pct = Math.round((result.correct / result.total) * 100)
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="text-6xl">{pct === 100 ? '👑' : pct >= 70 ? '🌟' : '💪'}</p>
        <h1 className="font-display text-3xl font-extrabold">Checkpoint Complete!</h1>
        <p className="text-white/60">{lecture.title}</p>
        <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-wide text-white/60">Score</p>
          <p className="font-display text-5xl font-extrabold text-amber-300">
            <CountUp value={pct} />%
          </p>
          <p className="mt-2 text-white/70">
            {result.correct} of {result.total} correct
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              playClick()
              navigate(0)
            }}
            className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
          >
            🔁 Try Again
          </button>
          <Link
            to="/transition"
            onClick={() => playClick()}
            className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold transition hover:scale-105 hover:bg-white/20"
          >
            🎓 Back to Transition Class
          </Link>
        </div>
      </div>
    )
  }

  if (questions.length === 0) return <div className="py-20 text-center text-xl">No questions in this checkpoint.</div>

  return (
    <QuizRunner
      title={`Checkpoint: ${lecture.title}`}
      questions={questions.map((q) => ({ id: q.id!, text: q.text, options: q.options, correctIndex: q.correctIndex, funFact: q.funFact }))}
      onComplete={handleComplete}
      onExit={() => navigate(`/transition/lecture/${lectureId}?player=${encodeURIComponent(player)}`)}
    />
  )
}
