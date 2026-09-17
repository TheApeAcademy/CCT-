import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Check, ArrowLeft, Sparkles, BookOpen } from 'lucide-react'
import {
  BIBLE_BOOK_ORDER,
  getJourneyBook,
  lessonKeysInOrder,
  slugifyBookTitle,
  findLesson,
  type JourneyBook,
  type JourneyCheckCard,
} from '../content/bibleJourney'
import { bibleComUrl } from '../lib/bibleLink'
import { getMyJourneyProgress, completeJourneyLesson, type JourneyProgressRow } from '../lib/journey'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from './Confetti'

const ACCENT = 'var(--lp-accent-bible)'

type JourneyView = { screen: 'books' } | { screen: 'path'; bookKey: string } | { screen: 'lesson'; bookKey: string; lessonKey: string }

/**
 * The Bible Journey - a Duolingo-style self-paced curriculum living inside
 * the Sunday School tab (see StudentPortal.tsx). Content is static app
 * code (src/content/bibleJourney*.ts); this component is purely the
 * player: book map -> a book's path of micro-lessons -> the lesson runner.
 */
export default function BibleJourneyPanel({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<JourneyView>({ screen: 'books' })
  const [progress, setProgress] = useState<JourneyProgressRow[] | null>(null)

  const reload = () => getMyJourneyProgress().then(setProgress)
  useEffect(() => {
    reload()
  }, [])

  const completedKeys = useMemo(() => new Set((progress ?? []).map((p) => p.lesson_key)), [progress])

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          playClick()
          if (view.screen === 'books') onExit()
          else if (view.screen === 'path') setView({ screen: 'books' })
          else setView({ screen: 'path', bookKey: view.bookKey })
        }}
        className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink-muted)] transition hover:text-[var(--lp-heading)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {progress === null ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
      ) : view.screen === 'books' ? (
        <BookMap completedKeys={completedKeys} onOpenBook={(bookKey) => setView({ screen: 'path', bookKey })} />
      ) : view.screen === 'path' ? (
        <UnitPath
          bookKey={view.bookKey}
          completedKeys={completedKeys}
          onOpenLesson={(lessonKey) => setView({ screen: 'lesson', bookKey: view.bookKey, lessonKey })}
        />
      ) : (
        <LessonRunner
          bookKey={view.bookKey}
          lessonKey={view.lessonKey}
          onDone={() => {
            reload()
            setView({ screen: 'path', bookKey: view.bookKey })
          }}
        />
      )}
    </div>
  )
}

function bookProgressCount(book: JourneyBook, completedKeys: Set<string>): number {
  return lessonKeysInOrder(book).filter((k) => completedKeys.has(k)).length
}

function BookMap({ completedKeys, onOpenBook }: { completedKeys: Set<string>; onOpenBook: (bookKey: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">Bible Journey</p>
      <p className="text-sm text-[var(--ink-muted)]">
        Walk through the Bible one book at a time, learning the stories, the people, and what they teach - at your own pace.
      </p>
      <div className="space-y-2">
        {BIBLE_BOOK_ORDER.map((title) => {
          const key = slugifyBookTitle(title)
          const book = getJourneyBook(key)
          if (!book) {
            return (
              <div key={key} className="panel flex items-center justify-between p-4 opacity-50">
                <p className="font-bold">{title}</p>
                <span className="text-xs font-bold text-[var(--ink-muted)]">Coming soon</span>
              </div>
            )
          }
          const total = lessonKeysInOrder(book).length
          const done = bookProgressCount(book, completedKeys)
          return (
            <button
              key={key}
              onClick={() => {
                playClick()
                onOpenBook(key)
              }}
              className="panel flex w-full items-center justify-between p-4 text-left transition hover:scale-[1.01]"
              style={{ borderColor: done > 0 ? ACCENT : undefined }}
            >
              <div>
                <p className="font-display font-bold">{book.title}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {done}/{total} lessons complete
                </p>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                style={{ background: `color-mix(in srgb, ${ACCENT} 18%, transparent)` }}
              >
                {done === total ? '👑' : '📖'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// A flat-design, code-drawn path (no external art needed): stops zigzag
// left-right down a fixed-width track, connected by a dashed line, each
// rendered as a chunky flat "button" stone in the Duolingo mold rather
// than a photoreal image - stays crisp at any size and scales to however
// many stops a book actually has.
const TRACK_WIDTH = 260
const TRACK_CENTER_X = TRACK_WIDTH / 2
const WAVE_AMPLITUDE = 66
const ROW_HEIGHT = 112
const NODE_SIZE = 64

function waveX(idx: number): number {
  return TRACK_CENTER_X + Math.sin((idx * Math.PI) / 2) * WAVE_AMPLITUDE
}

function UnitPath({
  bookKey,
  completedKeys,
  onOpenLesson,
}: {
  bookKey: string
  completedKeys: Set<string>
  onOpenLesson: (lessonKey: string) => void
}) {
  const book = getJourneyBook(bookKey)
  if (!book) return null
  const stops = book.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })))
  let firstIncompleteIdx = stops.findIndex(({ lesson }) => !completedKeys.has(lesson.key))
  if (firstIncompleteIdx === -1) firstIncompleteIdx = stops.length
  const trackHeight = stops.length * ROW_HEIGHT

  const pathD = stops.map((_, i) => `${i === 0 ? 'M' : 'L'} ${waveX(i)} ${i * ROW_HEIGHT + NODE_SIZE / 2}`).join(' ')

  return (
    <div className="space-y-3">
      <p className="eyebrow">{book.title}</p>
      <div className="relative mx-auto" style={{ width: TRACK_WIDTH, height: trackHeight }}>
        <svg className="absolute inset-0" width={TRACK_WIDTH} height={trackHeight} viewBox={`0 0 ${TRACK_WIDTH} ${trackHeight}`}>
          <path d={pathD} fill="none" stroke="var(--lp-hairline-strong)" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 14" />
        </svg>
        {stops.map(({ unit, lesson }, i) => {
          const isDone = completedKeys.has(lesson.key)
          const isNext = i === firstIncompleteIdx
          const isLocked = !isDone && !isNext
          const fill = isLocked ? 'var(--lp-hairline-strong)' : ACCENT
          return (
            <div
              key={lesson.key}
              className="absolute flex flex-col items-center"
              style={{ left: waveX(i), top: i * ROW_HEIGHT + NODE_SIZE / 2, transform: 'translate(-50%, -50%)', width: 150 }}
            >
              <button
                disabled={isLocked}
                onClick={() => {
                  playClick()
                  onOpenLesson(lesson.key)
                }}
                className="relative flex shrink-0 items-center justify-center rounded-full text-2xl transition disabled:cursor-not-allowed"
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  background: fill,
                  boxShadow: isLocked
                    ? 'inset 0 -4px 0 rgba(0,0,0,0.18)'
                    : `0 4px 0 color-mix(in srgb, ${ACCENT} 55%, black), inset 0 3px 0 rgba(255,255,255,0.35)`,
                }}
              >
                {isDone ? (
                  <Check className="h-7 w-7 text-white" strokeWidth={3} />
                ) : isLocked ? (
                  <Lock className="h-6 w-6 text-white/70" />
                ) : (
                  <span>{unit.emoji}</span>
                )}
                {lesson.image && (
                  <img
                    src={lesson.image}
                    alt=""
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-[var(--ink)] object-cover"
                  />
                )}
              </button>
              <p className={`mt-2 text-center text-[11px] font-bold leading-tight ${isLocked ? 'text-[var(--ink-muted)]' : ''}`}>
                {unit.title}
                {unit.kind === 'topical' && <span className="ml-1 text-[9px] uppercase text-[var(--ink-muted)]">Big Truths</span>}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type LearnStep = { kind: 'card'; text: string; emoji: string; ref: string; image?: string } | { kind: 'groupcheck'; check: JourneyCheckCard }

/**
 * cards -> groupCheck (the "3-4 pages, then a question" pass), then a
 * mastery round over every masteryQuestions entry: answering one wrong
 * doesn't skip it - it shows the explanation and requeues that question to
 * the back of the line, so the lesson can't complete until every single
 * one has been answered right at least once.
 */
function LessonRunner({ bookKey, lessonKey, onDone }: { bookKey: string; lessonKey: string; onDone: () => void }) {
  const found = findLesson(lessonKey)
  const lesson = found?.lesson
  const [phase, setPhase] = useState<'learn' | 'mastery' | 'celebrate'>('learn')
  const [stepIndex, setStepIndex] = useState(0)
  const [queue, setQueue] = useState<number[]>([])
  const [wrongOnce, setWrongOnce] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const learnSteps: LearnStep[] = useMemo(() => {
    if (!lesson) return []
    return lesson.sections.flatMap((section) => [
      ...section.cards.map((c) => ({ kind: 'card' as const, text: c.text, emoji: c.emoji, ref: c.ref, image: section.image })),
      ...section.checkQuestions.map((q) => ({ kind: 'groupcheck' as const, check: q })),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.key])

  if (!lesson) return <p className="text-sm text-[var(--ink-muted)]">This lesson couldn&apos;t be found.</p>

  const totalMastery = lesson.masteryQuestions.length
  const masteredCount = totalMastery - queue.length

  const chooseLearn = (idx: number) => {
    if (showResult) return
    playClick()
    setSelected(idx)
    setShowResult(true)
    if (idx === (learnSteps[stepIndex] as { kind: 'groupcheck'; check: JourneyCheckCard }).check.correctIndex) haptics.success()
    else haptics.error()
  }

  const advanceLearn = () => {
    playClick()
    setSelected(null)
    setShowResult(false)
    if (stepIndex + 1 < learnSteps.length) {
      setStepIndex(stepIndex + 1)
      return
    }
    setQueue(lesson.masteryQuestions.map((_, i) => i))
    setPhase('mastery')
  }

  const chooseMastery = (idx: number) => {
    if (showResult) return
    playClick()
    setSelected(idx)
    setShowResult(true)
    const currentQ = lesson.masteryQuestions[queue[0]]
    if (idx === currentQ.correctIndex) haptics.success()
    else {
      haptics.error()
      setWrongOnce((prev) => new Set(prev).add(queue[0]))
    }
  }

  const advanceMastery = async () => {
    playClick()
    const currentIdx = queue[0]
    const wasCorrect = selected === lesson.masteryQuestions[currentIdx].correctIndex
    setSelected(null)
    setShowResult(false)
    const rest = queue.slice(1)
    const nextQueue = wasCorrect ? rest : [...rest, currentIdx]
    if (nextQueue.length === 0) {
      haptics.success()
      await completeJourneyLesson(bookKey, lesson.key, totalMastery - wrongOnce.size)
      setPhase('celebrate')
      return
    }
    setQueue(nextQueue)
  }

  if (phase === 'celebrate') {
    return (
      <div className="relative space-y-4 py-6 text-center">
        <Confetti active />
        <div className="text-6xl">🎉</div>
        <p className="font-display text-2xl font-extrabold">Lesson Complete!</p>
        <p className="text-sm text-[var(--ink-muted)]">
          {totalMastery}/{totalMastery} mastered · {totalMastery - wrongOnce.size} right on the first try · +15 points
        </p>
        <button onClick={onDone} className="btn-solid w-full py-3">
          Continue
        </button>
      </div>
    )
  }

  const progressPct =
    phase === 'learn' ? ((stepIndex + 1) / learnSteps.length) * 60 : 60 + (masteredCount / totalMastery) * 40

  return (
    <div className="space-y-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lp-hairline)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: ACCENT }} />
      </div>
      {phase === 'mastery' && (
        <p className="text-center text-xs font-bold text-[var(--ink-muted)]">
          Mastery round · {masteredCount}/{totalMastery} answered right
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'learn' ? (
          <LearnStepView
            key={`learn-${stepIndex}`}
            step={learnSteps[stepIndex]}
            selected={selected}
            showResult={showResult}
            onChoose={chooseLearn}
            onAdvance={advanceLearn}
          />
        ) : (
          <MasteryStepView
            key={`mastery-${queue[0]}-${masteredCount}`}
            check={lesson.masteryQuestions[queue[0]]}
            selected={selected}
            showResult={showResult}
            onChoose={chooseMastery}
            onAdvance={advanceMastery}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function LearnStepView({
  step,
  selected,
  showResult,
  onChoose,
  onAdvance,
}: {
  step: LearnStep
  selected: number | null
  showResult: boolean
  onChoose: (idx: number) => void
  onAdvance: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
      {step.kind === 'card' ? (
        <div className="panel space-y-4 p-6 text-center">
          {step.image ? (
            <img src={step.image} alt="" className="mx-auto h-40 w-full rounded-lg object-cover" />
          ) : (
            <div className="text-5xl">{step.emoji}</div>
          )}
          <p className="text-base leading-relaxed">{step.text}</p>
          <a
            href={bibleComUrl(step.ref)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--lp-hairline)] px-3 py-1 text-xs font-bold text-[var(--ink-muted)] transition hover:text-[var(--lp-heading)]"
          >
            <BookOpen className="h-3 w-3" /> {step.ref}
          </a>
          <button onClick={onAdvance} className="btn-solid w-full py-3">
            Got it, next
          </button>
        </div>
      ) : (
        <CheckCard
          check={step.check}
          selected={selected}
          showResult={showResult}
          onChoose={onChoose}
          onAdvance={onAdvance}
          heading="Quick check"
        />
      )}
    </motion.div>
  )
}

function MasteryStepView({
  check,
  selected,
  showResult,
  onChoose,
  onAdvance,
}: {
  check: JourneyCheckCard
  selected: number | null
  showResult: boolean
  onChoose: (idx: number) => void
  onAdvance: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
      <CheckCard check={check} selected={selected} showResult={showResult} onChoose={onChoose} onAdvance={onAdvance} heading="Mastery round" />
    </motion.div>
  )
}

function CheckCard({
  check,
  selected,
  showResult,
  onChoose,
  onAdvance,
  heading,
}: {
  check: JourneyCheckCard
  selected: number | null
  showResult: boolean
  onChoose: (idx: number) => void
  onAdvance: () => void
  heading: string
}) {
  const isWrong = showResult && selected !== check.correctIndex
  return (
    <div className="panel space-y-3 p-6">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--ink-muted)]">
        <Sparkles className="h-3.5 w-3.5" /> {heading}
      </p>
      <p className="font-display text-lg font-bold">{check.question}</p>
      <div className="space-y-2">
        {check.options.map((opt, idx) => {
          const isCorrect = idx === check.correctIndex
          const isPicked = idx === selected
          return (
            <button
              key={idx}
              onClick={() => onChoose(idx)}
              disabled={showResult}
              className="w-full rounded-md border-2 p-3 text-left text-sm font-bold transition"
              style={{
                borderColor: showResult && isCorrect ? '#4caf6d' : showResult && isPicked ? '#e05f5f' : 'var(--lp-hairline-strong)',
                background: showResult && isCorrect ? 'color-mix(in srgb, #4caf6d 14%, transparent)' : showResult && isPicked ? 'color-mix(in srgb, #e05f5f 14%, transparent)' : 'transparent',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {isWrong && check.explanation && (
        <p className="rounded-md bg-[var(--lp-hairline)] p-3 text-sm text-[var(--ink-muted)]">{check.explanation}</p>
      )}
      {isWrong && (
        <p className="text-center text-xs font-bold text-[var(--ink-muted)]">Not quite - this one will come back around.</p>
      )}
      {showResult && (
        <button onClick={onAdvance} className="btn-solid w-full py-3">
          Continue
        </button>
      )}
    </div>
  )
}
