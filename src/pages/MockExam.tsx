import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import QuizRunner, { type QuizAnswer } from '../components/QuizRunner'
import CountUp from '../components/CountUp'
import { playWin, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const MAX_QUESTIONS = 20
const PASS_THRESHOLD = 70

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function MockExam() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const player = searchParams.get('player') ?? 'Guest'

  const allQuestions = useLiveQuery(() => db.transitionQuestions.toArray(), [])
  const lectures = useLiveQuery(() => db.transitionLectures.toArray(), []) ?? []

  const examQuestions = useMemo(() => {
    if (!allQuestions) return null
    return shuffle(allQuestions).slice(0, Math.min(MAX_QUESTIONS, allQuestions.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allQuestions?.length])

  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null)

  const handleComplete = async (answers: QuizAnswer[]) => {
    const correct = answers.filter((a) => a.correct).length
    const scorePct = Math.round((correct / answers.length) * 100)
    await db.mockExamAttempts.add({
      playerName: player,
      startedAt: Date.now(),
      finishedAt: Date.now(),
      totalQuestions: answers.length,
      correctCount: correct,
      scorePct,
    })
    if (scorePct >= PASS_THRESHOLD) {
      playWin()
      haptics.win()
    }
    setResult({ correct, total: answers.length })
  }

  if (allQuestions === undefined) return <div className="py-20 text-center text-xl">Loading…</div>

  if (allQuestions.length < 5) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <p className="text-4xl">📝</p>
        <h1 className="font-display text-2xl font-bold">Not enough checkpoint questions yet</h1>
        <p className="text-white/60">
          Add at least 5 checkpoint questions across your lectures before a mock exam can be generated.
        </p>
        <Link to="/transition" className="inline-block rounded-2xl bg-white/10 px-8 py-4 font-bold transition hover:scale-105 hover:bg-white/20">
          ← Back to Transition Class
        </Link>
      </div>
    )
  }

  if (result) {
    const pct = Math.round((result.correct / result.total) * 100)
    const passed = pct >= PASS_THRESHOLD
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="text-6xl">{passed ? '🎓' : '💪'}</p>
        <h1 className="font-display text-3xl font-extrabold">{passed ? 'Mock Exam Passed!' : 'Keep Studying!'}</h1>
        <p className="text-white/60">{player}</p>
        <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-wide text-white/60">Score</p>
          <p className="font-display text-5xl font-extrabold text-amber-300">
            <CountUp value={pct} />%
          </p>
          <p className="mt-2 text-white/70">
            {result.correct} of {result.total} correct · Passing score is {PASS_THRESHOLD}%
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

  if (started && examQuestions) {
    return (
      <QuizRunner
        title="Mock Exam"
        questions={examQuestions.map((q) => ({ id: q.id!, text: q.text, options: q.options, correctIndex: q.correctIndex, funFact: q.funFact }))}
        timerSeconds={30}
        onComplete={handleComplete}
        onExit={() => navigate('/transition')}
      />
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <p className="text-5xl">📝</p>
      <h1 className="font-display text-3xl font-extrabold">Mock Exam</h1>
      <p className="text-white/60">
        {examQuestions?.length ?? 0} questions pulled from all {lectures.length} lecture{lectures.length === 1 ? '' : 's'}, 30
        seconds each. Score {PASS_THRESHOLD}% or higher to pass.
      </p>
      <button
        onClick={() => {
          playClick()
          setStarted(true)
        }}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
      >
        Start Exam →
      </button>
    </div>
  )
}
