import { useEffect, useState } from 'react'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'

export interface QuizQuestion {
  id: number
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  funFact?: string
}

export interface QuizAnswer {
  questionId: number
  questionText: string
  options: [string, string, string, string]
  selectedIndex: number | null
  correctIndex: number
  correct: boolean
  timedOut: boolean
}

interface QuizRunnerProps {
  questions: QuizQuestion[]
  title: string
  timerSeconds?: number
  onComplete: (answers: QuizAnswer[]) => void
  onExit?: () => void
}

type Phase = 'question' | 'locked' | 'feedback'

export default function QuizRunner({ questions, title, timerSeconds, onComplete, onExit }: QuizRunnerProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('question')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timerSeconds ?? 0)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)
  const [shake, setShake] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])

  const current = questions[index]
  const isLast = index >= questions.length - 1

  useEffect(() => {
    setTimeLeft(timerSeconds ?? 0)
  }, [index, timerSeconds])

  useEffect(() => {
    if (!timerSeconds || phase !== 'question') return
    if (timeLeft <= 0) {
      reveal(null, true)
      return
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, timerSeconds])

  const reveal = (selIndex: number | null, wasTimeout: boolean) => {
    if (!current) return
    setPhase('locked')
    setSelectedIndex(selIndex)
    setTimedOut(wasTimeout)
    setRevealed(false)
    haptics.select()
    const correct = selIndex === current.correctIndex
    const record: QuizAnswer = {
      questionId: current.id,
      questionText: current.text,
      options: current.options,
      selectedIndex: selIndex,
      correctIndex: current.correctIndex,
      correct,
      timedOut: wasTimeout,
    }
    const nextAnswers = [...answers, record]
    setAnswers(nextAnswers)
    sound.playDrumroll(0.6)

    window.setTimeout(() => {
      setRevealed(true)
      if (correct) {
        sound.playCorrect()
        haptics.success()
        setFlash('green')
        setShowConfetti(true)
        window.setTimeout(() => setShowConfetti(false), 1400)
      } else {
        sound.playWrong()
        haptics.error()
        setFlash('red')
        setShake(true)
        window.setTimeout(() => setShake(false), 500)
      }
      window.setTimeout(() => setFlash(null), 600)
      window.setTimeout(() => setPhase('feedback'), 250)
    }, 600)
  }

  const handleSelect = (i: number) => {
    if (phase !== 'question') return
    reveal(i, false)
  }

  const handleNext = () => {
    if (isLast) {
      onComplete(answers)
      return
    }
    sound.playWhoosh()
    setIndex((i) => i + 1)
    setSelectedIndex(null)
    setRevealed(false)
    setTimedOut(false)
    setPhase('question')
  }

  if (!current) return null

  const optionLabel = (i: number) => String.fromCharCode(65 + i)
  const showResult = revealed

  return (
    <div className="relative mx-auto max-w-3xl space-y-4">
      <Confetti active={showConfetti} />
      {flash && <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />}

      <div className={`space-y-4 ${shake ? 'animate-screen-shake' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-white/60">{title}</p>
            <p className="font-display text-lg font-bold">
              Question {index + 1} of {questions.length}
            </p>
          </div>
          {onExit && (
            <button onClick={onExit} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              Exit
            </button>
          )}
        </div>

        {timerSeconds !== undefined && phase === 'question' && (
          <div className="space-y-1">
            <div className="h-4 w-full overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 6 ? 'bg-red-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.max(0, (timeLeft / timerSeconds) * 100)}%` }}
              />
            </div>
            <p className={`text-center text-sm font-bold ${timeLeft <= 6 ? 'animate-pulse text-red-400' : 'text-white/60'}`}>{timeLeft}s</p>
          </div>
        )}

        <div className="hex-frame mx-auto w-full">
          <div className="hex-fill flex min-h-[100px] flex-col items-center justify-center gap-2 px-10 py-6 text-center">
            <p className="font-display text-xl font-bold leading-snug sm:text-2xl">{current.text}</p>
          </div>
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {current.options.map((opt, i) => {
            const isSelected = selectedIndex === i
            const isCorrectAnswer = i === current.correctIndex
            let fillClasses = 'from-indigo-800/80 to-indigo-950/80'
            let borderClass = 'border-white/20'
            if (phase === 'locked' && !revealed && isSelected) {
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
              answers[answers.length - 1]?.correct ? 'bg-green-900/40 ring-green-400/30' : 'bg-red-900/30 ring-red-400/30'
            }`}
          >
            <p className="mb-2 font-display text-lg font-bold">
              {timedOut
                ? "⏰ Time's up!"
                : answers[answers.length - 1]?.correct
                  ? '✅ Correct!'
                  : `❌ Not quite. The correct answer was ${optionLabel(current.correctIndex)}: ${current.options[current.correctIndex]}`}
            </p>
            {current.funFact && <p className="mb-3 text-sm text-white/70">💡 {current.funFact}</p>}
            <button
              onClick={handleNext}
              className="animate-pulse-glow rounded-xl bg-amber-400 px-6 py-3 font-bold text-purple-950 transition hover:scale-105"
            >
              {isLast ? 'Finish →' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
