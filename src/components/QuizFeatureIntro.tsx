import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

type Phase = 'question' | 'selected' | 'revealed'

const SAMPLE_QUESTIONS = [
  { q: 'Who built the ark?', options: ['Noah', 'Moses', 'David', 'Abraham'], correct: 0 },
  { q: 'Where was Jesus born?', options: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Egypt'], correct: 2 },
  { q: 'Who led the Israelites out of Egypt?', options: ['Joshua', 'Moses', 'Aaron', 'Samuel'], correct: 1 },
]

// A visitor who taps gets an immediate response; one who just scrolls past
// still sees the demo play itself out after a short idle window, so the
// section is never frozen waiting on an interaction that never comes.
const AUTO_TAP_MS = 4200
const REVEAL_MS = 1500

/**
 * A tap-to-answer preview of what the actual quiz feels like (design
 * spec's Quiz Introduction model: tap an answer, get an immediate visual
 * response, see it revealed, watch the score move). Purely presentational
 * - no real scoring, no link to the live question bank.
 */
export default function QuizFeatureIntro() {
  const reduced = useReducedMotion()
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('question')
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const current = SAMPLE_QUESTIONS[qIndex]

  const answer = (i: number) => {
    if (phase !== 'question') return
    setPicked(i)
    setPhase('selected')
  }

  useEffect(() => {
    if (phase !== 'question') return
    if (reduced) {
      setPhase('revealed')
      return
    }
    // Nobody tapped - the demo answers for itself so the preview keeps moving.
    const t = window.setTimeout(() => answer(current.correct), AUTO_TAP_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, reduced])

  useEffect(() => {
    if (phase !== 'selected') return
    const t = window.setTimeout(() => {
      setPhase('revealed')
      setScore((s) => s + 10)
    }, 500)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'revealed') return
    if (reduced) return
    const t = window.setTimeout(() => {
      const next = (qIndex + 1) % SAMPLE_QUESTIONS.length
      if (next === 0) setScore(0)
      setQIndex(next)
      setPicked(null)
      setPhase('question')
    }, REVEAL_MS)
    return () => window.clearTimeout(t)
  }, [phase, qIndex, reduced])

  return (
    <div className="lp-panel relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="lp-eyebrow">Sample Round</span>
        <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--lp-accent-compete)_16%,transparent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--lp-accent-compete)]">
          Score
          <motion.span
            key={score}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
            className="text-sm"
            style={{ fontFamily: 'Fredoka, var(--font-body)' }}
          >
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
          {phase === 'question' && (
            <p className="mt-1 text-xs font-semibold text-[var(--lp-faint)]">Tap an answer</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {current.options.map((option, i) => {
              const isCorrect = i === current.correct
              const isPicked = i === picked
              const showReveal = phase === 'revealed' && isCorrect
              const showWrongPick = phase !== 'question' && isPicked && !isCorrect
              return (
                <motion.button
                  key={option}
                  type="button"
                  onClick={() => answer(i)}
                  disabled={phase !== 'question'}
                  whileTap={reduced || phase !== 'question' ? undefined : { scale: 0.96 }}
                  animate={
                    reduced
                      ? undefined
                      : {
                          scale: isPicked && phase === 'selected' ? 1.03 : 1,
                        }
                  }
                  transition={{ duration: 0.25 }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    phase === 'question' ? 'cursor-pointer hover:border-[var(--lp-accent-compete)]' : 'cursor-default'
                  } ${
                    showReveal
                      ? 'border-[var(--lp-accent-training)] bg-[color-mix(in_srgb,var(--lp-accent-training)_14%,transparent)] text-[var(--lp-heading)]'
                      : showWrongPick
                        ? 'border-[#e0576b] bg-[color-mix(in_srgb,#e0576b_12%,transparent)] text-[var(--lp-heading)]'
                        : isPicked
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
                </motion.button>
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
