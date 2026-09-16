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
  const orderedKeys = lessonKeysInOrder(book)
  let firstIncompleteIdx = orderedKeys.findIndex((k) => !completedKeys.has(k))
  if (firstIncompleteIdx === -1) firstIncompleteIdx = orderedKeys.length
  let globalIdx = -1

  return (
    <div className="space-y-6">
      <p className="eyebrow">{book.title}</p>
      {book.units.map((unit) => (
        <div key={unit.key} className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span>{unit.emoji}</span> {unit.title}
            {unit.kind === 'topical' && <span className="text-[10px] font-bold uppercase text-[var(--ink-muted)]">Big Truths</span>}
          </p>
          <div className="space-y-1.5 border-l-2 border-[var(--lp-hairline)] pl-4">
            {unit.lessons.map((lesson) => {
              globalIdx += 1
              const isDone = completedKeys.has(lesson.key)
              const isNext = globalIdx === firstIncompleteIdx
              const isLocked = !isDone && !isNext
              return (
                <button
                  key={lesson.key}
                  disabled={isLocked}
                  onClick={() => {
                    playClick()
                    onOpenLesson(lesson.key)
                  }}
                  className={`flex w-full items-center gap-3 rounded-md p-3 text-left transition ${
                    isLocked ? 'opacity-40' : 'hover:scale-[1.01]'
                  }`}
                  style={{ background: isDone || isNext ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : 'transparent' }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: isDone ? ACCENT : isNext ? `color-mix(in srgb, ${ACCENT} 30%, transparent)` : 'transparent', color: isDone ? '#fff' : undefined }}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : globalIdx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{lesson.title}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{lesson.reference}</p>
                  </div>
                  {lesson.image && <img src={lesson.image} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

type Step = { kind: 'card'; text: string; emoji: string; ref: string } | { kind: 'check'; check: JourneyCheckCard; isEnd: boolean }

function LessonRunner({ bookKey, lessonKey, onDone }: { bookKey: string; lessonKey: string; onDone: () => void }) {
  const found = findLesson(lessonKey)
  const lesson = found?.lesson
  const [stepIndex, setStepIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [celebrating, setCelebrating] = useState(false)
  const [endTotal, setEndTotal] = useState(0)

  const steps: Step[] = useMemo(() => {
    if (!lesson) return []
    const mid = Math.ceil(lesson.cards.length / 2)
    return [
      ...lesson.cards.slice(0, mid).map((c) => ({ kind: 'card' as const, text: c.text, emoji: c.emoji, ref: c.ref })),
      { kind: 'check' as const, check: lesson.midCheck, isEnd: false },
      ...lesson.cards.slice(mid).map((c) => ({ kind: 'card' as const, text: c.text, emoji: c.emoji, ref: c.ref })),
      ...lesson.endCheckpoint.map((c) => ({ kind: 'check' as const, check: c, isEnd: true })),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.key])

  if (!lesson) return <p className="text-sm text-[var(--ink-muted)]">This lesson couldn&apos;t be found.</p>

  const step = steps[stepIndex]

  const advance = async () => {
    playClick()
    setSelected(null)
    setShowResult(false)
    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1)
      return
    }
    const endQuestions = steps.filter((s) => s.kind === 'check' && s.isEnd).length
    setEndTotal(endQuestions)
    haptics.success()
    await completeJourneyLesson(bookKey, lesson.key, correctCount)
    setCelebrating(true)
  }

  const choose = (idx: number) => {
    if (showResult) return
    playClick()
    setSelected(idx)
    setShowResult(true)
    if (step.kind === 'check' && idx === step.check.correctIndex) {
      haptics.success()
      if (step.isEnd) setCorrectCount((c) => c + 1)
    } else {
      haptics.error()
    }
  }

  if (celebrating) {
    return (
      <div className="relative space-y-4 py-6 text-center">
        <Confetti active />
        <div className="text-6xl">🎉</div>
        <p className="font-display text-2xl font-extrabold">Lesson Complete!</p>
        <p className="text-sm text-[var(--ink-muted)]">
          {correctCount}/{endTotal} correct on the checkpoint · +15 points
        </p>
        <button onClick={onDone} className="btn-solid w-full py-3">
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lp-hairline)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%`, background: ACCENT }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {step.kind === 'card' ? (
            <div className="panel space-y-4 p-6 text-center">
              {lesson.image ? (
                <img src={lesson.image} alt="" className="mx-auto h-40 w-full rounded-lg object-cover" />
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
              <button onClick={advance} className="btn-solid w-full py-3">
                Got it, next
              </button>
            </div>
          ) : (
            <div className="panel space-y-3 p-6">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--ink-muted)]">
                <Sparkles className="h-3.5 w-3.5" /> Quick check
              </p>
              <p className="font-display text-lg font-bold">{step.check.question}</p>
              <div className="space-y-2">
                {step.check.options.map((opt, idx) => {
                  const isCorrect = idx === step.check.correctIndex
                  const isPicked = idx === selected
                  return (
                    <button
                      key={idx}
                      onClick={() => choose(idx)}
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
              {showResult && (
                <button onClick={advance} className="btn-solid w-full py-3">
                  Continue
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
