import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

type Phase = 'question' | 'selected' | 'revealed'

const SAMPLE_QUESTIONS = [
  { q: 'Who built the ark?', options: ['Noah', 'Moses', 'David', 'Abraham'], correct: 0 },
  { q: 'Where was Jesus born?', options: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Egypt'], correct: 2 },
  { q: 'Who led the Israelites out of Egypt?', options: ['Joshua', 'Moses', 'Aaron', 'Samuel'], correct: 1 },
]

const PHASE_MS = { question: 1100, selected: 700, revealed: 1400 } as const

/**
 * A self-playing preview of what the actual quiz feels like - question,
 * an answer getting picked, the reveal, the score ticking up - so a
 * visitor sees the feature before ever entering it (design spec's Quiz
 * Introduction model). Purely presentational: no real scoring, no link
 * to the live question bank.
 */
export default function QuizFeatureIntro() {
  const reduced = useReducedMotion()
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('question')
  const [score, setScore] = useState(0)

  const current = SAMPLE_QUESTIONS[qIndex]

  useEffect(() => {
    if (reduced) {
      setPhase('revealed')
      return
    }
    const delay = PHASE_MS[phase]
    const t = window.setTimeout(() => {
      if (phase === 'question') setPhase('selected')
      else if (phase === 'selected') {
        setPhase('revealed')
        setScore((s) => s + 10)
      } else {
        const next = (qIndex + 1) % SAMPLE_QUESTIONS.length
        if (next === 0) setScore(0)
        setQIndex(next)
        setPhase('question')
      }
    }, delay)
    return () => window.clearTimeout(t)
  }, [phase, qIndex, reduced])

  return (
    <div className="lp-panel relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="lp-eyebrow">Sample Round</span>
        <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--lp-accent-compete)_16%,transparent)] px-3 py-1 text-xs font-extrabold text-[var(--lp-accent-compete)]">
          Score
          <motion.span key={score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}>
            {score}
          </motion.span>
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4"
        >
          <p className="lp-heading text-lg font-bold leading-snug sm:text-xl">{current.q}</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {current.options.map((option, i) => {
              const isCorrect = i === current.correct
              const isSelected = phase !== 'question' && isCorrect
              const showReveal = phase === 'revealed' && isCorrect
              return (
                <motion.div
                  key={option}
                  animate={
                    reduced
                      ? undefined
                      : {
                          scale: isSelected && phase === 'selected' ? 1.03 : 1,
                          borderColor: showReveal ? 'var(--lp-accent-training)' : undefined,
                        }
                  }
                  transition={{ duration: 0.25 }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    showReveal
                      ? 'border-[var(--lp-accent-training)] bg-[color-mix(in_srgb,var(--lp-accent-training)_14%,transparent)] text-[var(--lp-heading)]'
                      : isSelected
                        ? 'border-[var(--lp-accent-compete)] text-[var(--lp-heading)]'
                        : 'border-[var(--lp-hairline)] text-[var(--lp-body)]'
                  }`}
                >
                  {option}
                  {showReveal && (
                    <motion.span
                      initial={reduced ? undefined : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--lp-accent-training)] text-white"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-1.5">
        {SAMPLE_QUESTIONS.map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i <= qIndex ? 'var(--lp-accent-compete)' : 'var(--lp-hairline)' }}
          />
        ))}
      </div>
    </div>
  )
}
