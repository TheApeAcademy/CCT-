import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Check, Star, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, BookOpen, Flame, Coins, Heart, HeartCrack, RotateCcw, X } from 'lucide-react'
import {
  JOURNEY_BOOKS,
  getJourneyBook,
  lessonKeysInOrder,
  slugifyBookTitle,
  findLesson,
  type JourneyBook,
  type JourneyLesson,
  type JourneyCheckCard,
} from '../content/bibleJourney'
import { bookArt } from '../content/bibleBookArt'
import { bibleComUrl } from '../lib/bibleLink'
import { getMyJourneyProgress, completeJourneyLesson, type JourneyProgressRow } from '../lib/journey'
import { getMyStudentProfile, getLeaderboard, getMyBibleStreak } from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from './Confetti'
import JourneyShell from './JourneyShell'

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
        <BookMap
          completedKeys={completedKeys}
          onOpenBook={(bookKey) => setView({ screen: 'path', bookKey })}
          onOpenLessonDirect={(bookKey, lessonKey) => setView({ screen: 'lesson', bookKey, lessonKey })}
        />
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

// Every real Bible-scene photo currently on hand - used to fill in any
// character tile whose lesson has no dedicated image of its own.
const CHARACTER_FALLBACK_IMAGES = [
  '/journey/adam-eve-garden-home.jpg',
  '/journey/adam-eve-first-sin.jpg',
  '/journey/cain-abel-offerings.jpg',
  '/journey/noah-building-ark.jpg',
  '/journey/noah-dove-olive-branch.jpg',
  '/journey/tower-of-babel.jpg',
  '/journey/abraham-isaac-ram-provided.jpg',
  '/journey/jacob-ladder-dream.jpg',
]

/**
 * The Old Testament as one path of stepping stones, which is the layout
 * Banks approved for this screen: the painting of the book you are on
 * sitting in the left rail, the stones down the middle, the board on the
 * right. Every stone is a book, every unit break names the run it opens.
 *
 * Each book carries its own painting (src/content/bibleBookArt.ts), one per
 * book, showing the story that book is known for. Habakkuk has no painting
 * yet, so it draws the placeholder rather than borrowing another book's.
 *
 * A book is playable only when its lessons exist in app content. Genesis is
 * the only one so far, so the rest read as locked - the same way Duolingo
 * shows the whole road ahead greyed out rather than hiding it.
 */
function BookPath({ completedKeys, onOpenBook }: { completedKeys: Set<string>; onOpenBook: (bookKey: string) => void }) {
  const stats = useJourneyStats()
  const [selected, setSelected] = useState<string | null>(null)

  const stops = OT_UNITS.flatMap((unit) =>
    unit.books.map((title) => {
      const key = slugifyBookTitle(title)
      const book = getJourneyBook(key)
      const total = book ? lessonKeysInOrder(book).length : 0
      const done = book ? bookProgressCount(book, completedKeys) : 0
      return { unit, title, key, book, total, done }
    }),
  )

  // The current stop is the first playable book that is not finished. With
  // only Genesis built that is always Genesis, but it stays correct as
  // books are added rather than needing to be moved by hand.
  let currentIdx = stops.findIndex((st) => st.book && st.done < st.total)
  if (currentIdx === -1) currentIdx = stops.findIndex((st) => st.book)
  if (currentIdx === -1) currentIdx = 0

  const activeIdx = Math.max(
    0,
    selected ? stops.findIndex((st) => st.key === selected) : currentIdx,
  )
  const active = stops[activeIdx] ?? stops[currentIdx]

  const stateOf = (i: number): StopState => {
    const st = stops[i]
    if (st.book && st.total > 0 && st.done === st.total) return 'done'
    if (i === currentIdx) return 'current'
    return 'locked'
  }

  const card = <BookRailCard stop={active} state={stateOf(activeIdx)} onOpenBook={onOpenBook} />

  let drawn = -1
  const track = (
    <div className="min-w-0 overflow-y-auto overflow-x-hidden sm:max-h-[75vh]">
      <div className="mx-auto flex w-full flex-col pb-2" style={{ maxWidth: TRACK_WIDTH }}>
        <div className="sticky top-0 z-20 pb-4">
          <JourneyBanner
            eyebrow="Old Testament"
            title={active.unit.title}
            done={stops.filter((st) => st.book && st.total > 0 && st.done === st.total).length}
            total={stops.length}
          />
        </div>
        {OT_UNITS.map((unit, unitIdx) => (
          <div key={unit.title}>
            {unitIdx > 0 && (
              <div className="my-5 flex items-center gap-3">
                <span className="h-0.5 flex-1 rounded-full bg-[var(--lp-hairline-strong)]" />
                <span className="font-display text-sm font-extrabold text-[var(--ink-muted)]">{unit.title}</span>
                <span className="h-0.5 flex-1 rounded-full bg-[var(--lp-hairline-strong)]" />
              </div>
            )}
            {unit.books.map((bookTitle) => {
              drawn += 1
              const i = drawn
              const st = stops[i]
              const state = stateOf(i)
              return (
                <div
                  key={bookTitle}
                  className="flex justify-center"
                  style={{
                    transform: `translateX(${waveOffset(i)}px)`,
                    marginTop: (i === 0 ? 0 : NODE_GAP) + (state === 'current' ? 30 : 0),
                  }}
                >
                  <div className="relative">
                    {state === 'current' && (
                      <span className="kid-node-bubble" aria-hidden="true">
                        Start
                      </span>
                    )}
                    <JourneyNode
                      state={state}
                      selected={i === activeIdx}
                      label={st.title}
                      onClick={() => {
                        playClick()
                        setSelected(st.key)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <JourneyShell left={card} middle={track} right={<StatsPanel stats={stats} big />} />
    </div>
  )
}

/** The left rail: the painting of whichever book is selected, and the way in. */
function BookRailCard({
  stop,
  state,
  onOpenBook,
}: {
  stop: { title: string; key: string; book: JourneyBook | undefined; total: number; done: number }
  state: StopState
  onOpenBook: (bookKey: string) => void
}) {
  const art = bookArt(stop.title)
  return (
    <div className="relative overflow-hidden rounded-[28px]" style={{ minHeight: 420 }}>
      {art ? (
        <img src={art.image} alt={art.scene} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ background: `color-mix(in srgb, ${ACCENT} 18%, var(--ink-panel))` }}
        >
          <BookOpen className="h-14 w-14 text-[var(--ink-muted)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

      <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-6 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">
          {state === 'done' ? 'Finished' : state === 'current' ? 'You are here' : 'Coming soon'}
        </p>
        <p className="font-display text-2xl font-extrabold text-white drop-shadow-lg">{stop.title}</p>
        <p className="text-sm text-white/85">{art ? art.scene : 'The painting for this book is still being made.'}</p>
        {art?.character && (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">{art.character}</p>
        )}
        {stop.book ? (
          <button
            onClick={() => {
              playClick()
              haptics.tap()
              onOpenBook(stop.key)
            }}
            className="kid-btn w-full"
            style={{ background: ACCENT, color: '#fff', boxShadow: `0 4px 0 color-mix(in srgb, ${ACCENT} 68%, #000)` }}
          >
            {stop.done > 0 ? `Continue · ${stop.done}/${stop.total}` : 'Start this book'}
          </button>
        ) : (
          <p className="rounded-2xl bg-white/15 px-3 py-2.5 text-sm font-bold text-white/80 backdrop-blur">
            Lessons are being written
          </p>
        )}
      </div>
    </div>
  )
}

function BookMap({
  completedKeys,
  onOpenBook,
  onOpenLessonDirect,
}: {
  completedKeys: Set<string>
  onOpenBook: (bookKey: string) => void
  onOpenLessonDirect: (bookKey: string, lessonKey: string) => void
}) {
  const [mode, setMode] = useState<'books' | 'characters'>('books')
  const dark = mode === 'characters'

  return (
    <div className={dark ? '-mx-4 space-y-3 px-4 pb-6' : 'space-y-3'} style={dark ? { background: '#120a1f' } : undefined}>
      <p className="eyebrow pt-3">Bible Journey</p>
      <div className={`inline-flex rounded-full border p-1 text-xs font-bold ${dark ? 'border-white/20' : 'border-[var(--lp-hairline)]'}`}>
        <button
          onClick={() => {
            playClick()
            setMode('books')
          }}
          className="rounded-full px-3 py-1.5 transition"
          style={{ background: mode === 'books' ? ACCENT : 'transparent', color: mode === 'books' ? '#fff' : dark ? 'rgba(255,255,255,0.72)' : 'var(--ink-muted)' }}
        >
          By Book
        </button>
        <button
          onClick={() => {
            playClick()
            setMode('characters')
          }}
          className="rounded-full px-3 py-1.5 transition"
          style={{ background: mode === 'characters' ? ACCENT : 'transparent', color: mode === 'characters' ? '#fff' : dark ? 'rgba(255,255,255,0.72)' : 'var(--ink-muted)' }}
        >
          By Character
        </button>
      </div>

      {mode === 'books' ? (
        <BookPath completedKeys={completedKeys} onOpenBook={onOpenBook} />
      ) : (
        <CharacterBrowse completedKeys={completedKeys} onOpenLesson={onOpenLessonDirect} />
      )}
    </div>
  )
}

// Free-pick mode: every story character across every loaded book, in one
// list, completely ungated (no locking) - the point is a kid can jump
// straight to "Joseph" or "Noah" without playing the book in order first.
function CharacterBrowse({
  completedKeys,
  onOpenLesson,
}: {
  completedKeys: Set<string>
  onOpenLesson: (bookKey: string, lessonKey: string) => void
}) {
  const characters = JOURNEY_BOOKS.flatMap((book) =>
    book.units.filter((unit) => unit.kind === 'story' && unit.lessons[0]).map((unit) => ({ book, unit, lesson: unit.lessons[0] })),
  )
  // Only a handful of lessons have their own dedicated scene photo - every
  // other one still gets a real picture (never a bare emoji) by cycling
  // through the same art so no tile is left empty.
  let fallbackCursor = 0

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">Pick any Bible character to learn about them right away - no order required.</p>
      {/* These were a scattered pile: every tile rotated a few degrees, bobbed
          up or down, cut to the outline of a stone photo, with the character's
          name printed over the middle of the picture. Nothing lined up and no
          name was easy to read. It is a plain grid now - one crop for every
          picture, the name in its own block underneath, identical row
          heights. */}
      <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3 lg:grid-cols-4">
        {characters.map(({ book, unit, lesson }) => {
          const isDone = completedKeys.has(lesson.key)
          const image = lesson.image ?? CHARACTER_FALLBACK_IMAGES[fallbackCursor++ % CHARACTER_FALLBACK_IMAGES.length]
          return (
            <button
              key={lesson.key}
              onClick={() => {
                playClick()
                onOpenLesson(book.key, lesson.key)
              }}
              className="character-card group flex flex-col overflow-hidden rounded-2xl text-left"
            >
              <span className="relative block aspect-[4/3] w-full overflow-hidden">
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {isDone && (
                  <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                    <Check className="h-4 w-4" style={{ color: ACCENT }} />
                  </span>
                )}
              </span>
              <span className="flex min-h-[64px] flex-col justify-center gap-0.5 px-3 py-2.5">
                <span className="font-display line-clamp-2 text-sm font-extrabold uppercase leading-tight tracking-wide text-white">
                  {unit.title}
                </span>
                <span className="text-[11px] font-semibold text-white/55">{book.title}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// D2 - the path, drawn the way Duolingo draws it.
//
// It used to be: a photoreal stone behind every stop, a coloured disc on top
// of the stone, a cropped scene photo hanging off the corner of that disc,
// and the unit's name printed underneath. Four things per stop at four
// different weights, and the eye had nowhere to land. Duolingo's path is one
// repeated object: a single flat circle with a hard bottom edge, the same
// size every time, in exactly three states - done, the one you are on, and
// locked. The only thing that differs between them is the fill and the icon.
//
// The unit names did not disappear, they moved: a unit now opens with its own
// banner across the track, which is also where Duolingo puts them.
const TRACK_WIDTH = 380
const WAVE_AMPLITUDE = 78
const NODE_SIZE = 72
const NODE_GAP = 20

// A four-step sine, so the column snakes left and right instead of running
// straight down. An offset from centre, not an absolute x: the stops sit in
// normal document flow now rather than on an absolutely positioned canvas.
function waveOffset(idx: number): number {
  return Math.round(Math.sin((idx * Math.PI) / 2) * WAVE_AMPLITUDE)
}

type StopState = 'done' | 'current' | 'locked'

function JourneyNode({
  state,
  selected,
  label,
  onClick,
}: {
  state: StopState
  selected: boolean
  label: string
  onClick: () => void
}) {
  // Locked stops are mixed from the heading colour rather than set to a fixed
  // grey, so they stay legible on whichever ground the shell is using.
  const fill = state === 'locked' ? 'color-mix(in srgb, var(--lp-heading) 16%, var(--lp-bg))' : ACCENT
  const edge =
    state === 'locked'
      ? 'color-mix(in srgb, var(--lp-heading) 30%, var(--lp-bg))'
      : `color-mix(in srgb, ${ACCENT} 68%, #000)`
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}${state === 'locked' ? ' (locked)' : state === 'done' ? ' (done)' : ''}`}
      aria-current={state === 'current' ? 'step' : undefined}
      className="kid-node"
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        background: fill,
        boxShadow: `0 6px 0 ${edge}${selected ? `, 0 0 0 4px color-mix(in srgb, ${ACCENT} 35%, transparent)` : ''}`,
      }}
    >
      {state === 'done' ? (
        <Check className="h-8 w-8 text-white" strokeWidth={3.5} />
      ) : state === 'current' ? (
        <Star className="h-8 w-8 text-white" strokeWidth={2.5} fill="currentColor" />
      ) : (
        <Lock className="h-6 w-6" style={{ color: 'color-mix(in srgb, var(--lp-heading) 58%, transparent)' }} />
      )}
    </button>
  )
}

/**
 * The banner Duolingo puts at the head of a section, and the reason the stops
 * below it need no labels of their own.
 *
 * It is drawn per unit only when a unit actually holds more than one lesson.
 * Every unit in Genesis currently holds exactly one, so a banner per unit
 * would mean a banner between every pair of stops - a stack of headings with
 * a circle wedged in each gap, which is the opposite of a path. Until the
 * content grows, the book's own banner at the top of the track is the only
 * one that appears.
 */
function JourneyBanner({ eyebrow, title, done, total }: { eyebrow: string; title: string; done: number; total: number }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
      style={{ background: ACCENT, boxShadow: `0 4px 0 color-mix(in srgb, ${ACCENT} 68%, #000)` }}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">{eyebrow}</p>
        <p className="truncate font-display text-lg font-extrabold text-white">{title}</p>
      </div>
      <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-extrabold tabular-nums text-white">
        {done}/{total}
      </span>
    </div>
  )
}

interface JourneyStats {
  points: number
  rank: number | null
  streak: number
}

/**
 * Points, rank and streak for the right-hand rail. Both the book path and a
 * book's own path show the same rail, so the fetch lives here rather than
 * being written out twice.
 */
function useJourneyStats(): JourneyStats | null {
  const [stats, setStats] = useState<JourneyStats | null>(null)
  useEffect(() => {
    Promise.all([getMyStudentProfile(), getLeaderboard(500), getMyBibleStreak()]).then(([student, board, streak]) => {
      if (!student) return
      const rankIdx = board.findIndex((r) => r.student_id === student.id)
      setStats({ points: student.total_points, rank: rankIdx === -1 ? null : rankIdx + 1, streak })
    })
  }, [])
  return stats
}

/**
 * The Old Testament in seven runs, which is what the path's unit breaks are.
 * Duolingo names its sections rather than numbering them, and a child picks
 * "Kings and Kingdoms" out of a list far faster than "Unit 3".
 */
const OT_UNITS: { title: string; books: string[] }[] = [
  { title: 'The Law', books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'] },
  { title: 'Into the Land', books: ['Joshua', 'Judges', 'Ruth'] },
  { title: 'Kings and Kingdoms', books: ['1 Samuel', '2 Samuel', '1 Kings', '2 Kings'] },
  { title: 'Coming Home', books: ['1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'] },
  { title: 'Songs and Wisdom', books: ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'] },
  { title: 'The Big Prophets', books: ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'] },
  { title: 'The Twelve', books: ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'] },
]

function UnitPath({
  bookKey,
  completedKeys,
  onOpenLesson,
}: {
  bookKey: string
  completedKeys: Set<string>
  onOpenLesson: (lessonKey: string) => void
}) {
  const stats = useJourneyStats()
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)

  const book = getJourneyBook(bookKey)
  if (!book) return null
  const stops = book.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })))
  let firstIncompleteIdx = stops.findIndex(({ lesson }) => !completedKeys.has(lesson.key))
  if (firstIncompleteIdx === -1) firstIncompleteIdx = stops.length - 1
  const activeIdx = Math.min(previewIdx ?? firstIncompleteIdx, stops.length - 1)
  const activeStop = stops[activeIdx]

  const preview = activeStop && (
    <LessonPreviewCard
      stop={activeStop}
      idx={activeIdx}
      total={stops.length}
      firstIncompleteIdx={firstIncompleteIdx}
      onPrev={() => setPreviewIdx(Math.max(0, activeIdx - 1))}
      onNext={() => setPreviewIdx(Math.min(stops.length - 1, activeIdx + 1))}
      onOpenLesson={onOpenLesson}
      big
    />
  )
  const stats_ = <StatsPanel stats={stats} lesson={stops[firstIncompleteIdx]?.lesson} big />

  const doneCount = stops.filter(({ lesson }) => completedKeys.has(lesson.key)).length

  const track = (
    <div className="min-w-0 overflow-y-auto overflow-x-hidden sm:max-h-[75vh]">
      <div className="mx-auto flex w-full flex-col pb-2" style={{ maxWidth: TRACK_WIDTH }}>
        <div className="sticky top-0 z-20 pb-4">
          <JourneyBanner eyebrow="Book" title={book.title} done={doneCount} total={stops.length} />
        </div>
        {stops.map(({ unit, lesson }, i) => {
          const state: StopState = completedKeys.has(lesson.key) ? 'done' : i === firstIncompleteIdx ? 'current' : 'locked'
          const opensUnit = unit.lessons.length > 1 && (i === 0 || stops[i - 1].unit !== unit)
          return (
            <div key={lesson.key}>
              {opensUnit && (
                <div className={i === 0 ? 'pb-4' : 'pb-4 pt-8'}>
                  <JourneyBanner
                    eyebrow={unit.kind === 'topical' ? 'Big Truths' : 'Unit'}
                    title={`${unit.emoji} ${unit.title}`}
                    done={unit.lessons.filter((l) => completedKeys.has(l.key)).length}
                    total={unit.lessons.length}
                  />
                </div>
              )}
              <div
                className="flex justify-center"
                style={{
                  transform: `translateX(${waveOffset(i)}px)`,
                  // The current stop carries a "Start" flag above its head, so
                  // it needs the headroom or the flag slides under the sticky
                  // banner and the one moving thing on the screen is invisible.
                  marginTop: (opensUnit || i === 0 ? 0 : NODE_GAP) + (state === 'current' ? 30 : 0),
                }}
              >
                <div className="relative">
                  {state === 'current' && (
                    <span className="kid-node-bubble" aria-hidden="true">
                      Start
                    </span>
                  )}
                  <JourneyNode
                    state={state}
                    selected={i === activeIdx}
                    label={lesson.title}
                    onClick={() => {
                      playClick()
                      setPreviewIdx(i)
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )


  // One layout at every width. What the card, the path and the board are
  // never changes with the screen - only how you move between them does,
  // which is JourneyShell's job.
  return (
    <div className="space-y-3">
      <p className="eyebrow">{book.title}</p>
      <div className="mx-auto w-full max-w-[1320px]">
        <JourneyShell left={preview} middle={track} right={stats_} />
      </div>
    </div>
  )
}

function LessonPreviewCard({
  stop,
  idx,
  total,
  firstIncompleteIdx,
  onPrev,
  onNext,
  onOpenLesson,
  big,
}: {
  stop: { unit: JourneyBook['units'][number]; lesson: JourneyLesson }
  idx: number
  total: number
  firstIncompleteIdx: number
  onPrev: () => void
  onNext: () => void
  onOpenLesson: (lessonKey: string) => void
  big?: boolean
}) {
  const { unit, lesson } = stop
  const image = lesson.image ?? CHARACTER_FALLBACK_IMAGES[idx % CHARACTER_FALLBACK_IMAGES.length]
  const state: 'done' | 'current' | 'locked' = idx < firstIncompleteIdx ? 'done' : idx === firstIncompleteIdx ? 'current' : 'locked'

  return (
    <div className="relative overflow-hidden rounded-[28px]" style={{ minHeight: big ? 420 : 280 }}>
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

      <div className="relative z-10 flex items-center justify-between p-3">
        <button
          onClick={onPrev}
          disabled={idx === 0}
          aria-label="Previous lesson"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {idx + 1} / {total}
        </p>
        <button
          onClick={onNext}
          disabled={idx === total - 1}
          aria-label="Next lesson"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className={`absolute inset-x-0 bottom-0 z-10 space-y-3 text-center ${big ? 'p-6' : 'p-4'}`}>
        <div className="space-y-1.5">
          <p className={`font-display font-extrabold text-white drop-shadow-lg ${big ? 'text-2xl' : 'text-lg'}`}>Learn about {unit.title}</p>
          <a
            href={bibleComUrl(lesson.reference)}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 rounded-full bg-white/15 font-bold text-white backdrop-blur transition hover:bg-white/25 ${
              big ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-[11px]'
            }`}
          >
            <BookOpen className={big ? 'h-4 w-4' : 'h-3 w-3'} /> {lesson.reference}
          </a>
        </div>

        {state === 'current' && (
          <button
            onClick={() => {
              playClick()
              onOpenLesson(lesson.key)
            }}
            className={`btn-solid w-full ${big ? 'py-3 text-base' : 'py-2 text-sm'}`}
          >
            Start Lesson
          </button>
        )}
        {state === 'done' && (
          <button
            onClick={() => {
              playClick()
              onOpenLesson(lesson.key)
            }}
            className={`flex w-full items-center justify-center gap-1.5 rounded-full bg-white/90 font-bold text-black transition hover:bg-white ${
              big ? 'py-3 text-base' : 'py-2 text-sm'
            }`}
          >
            <Check className="h-4 w-4" /> Review Lesson
          </button>
        )}
        {state === 'locked' && (
          <button
            disabled
            className={`flex w-full items-center justify-center gap-1.5 rounded-full bg-white/20 font-bold text-white/70 backdrop-blur ${
              big ? 'py-3 text-base' : 'py-2 text-sm'
            }`}
          >
            <Lock className="h-4 w-4" /> Locked
          </button>
        )}
      </div>
    </div>
  )
}

function StatsPanel({ stats, lesson, big }: { stats: JourneyStats | null; lesson?: JourneyLesson; big?: boolean }) {
  const totalQuestions = lesson ? lesson.sections.reduce((n, s) => n + s.checkQuestions.length, 0) + lesson.masteryQuestions.length : 0
  const pad = big ? 24 : 14
  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl text-white"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 75%, #180a2e), color-mix(in srgb, ${ACCENT} 30%, #180a2e))`, padding: pad }}
      >
        <p className={`font-bold uppercase tracking-wide text-white/70 ${big ? 'text-sm' : 'text-xs'}`}>Leaderboard</p>
        <p className={`mt-1 font-display font-extrabold ${big ? 'text-2xl' : 'text-base'}`}>{stats?.rank ? `You're #${stats.rank}!` : 'Climb the leaderboard!'}</p>
        <p className={`mt-1 text-white/80 ${big ? 'text-sm' : 'text-xs'}`}>Keep completing lessons to move up.</p>
      </div>
      <div className="rounded-2xl" style={{ background: 'color-mix(in srgb, var(--gold) 16%, var(--ink-panel))', padding: pad }}>
        <p className={`font-bold uppercase tracking-wide text-[var(--gold)] ${big ? 'text-sm' : 'text-xs'}`}>Daily Quests</p>
        <div className={`flex items-center gap-2 ${big ? 'mt-3' : 'mt-2'}`}>
          <Flame className={big ? 'h-6 w-6 text-orange-500' : 'h-4 w-4 text-orange-500'} />
          <span className={`font-display font-extrabold ${big ? 'text-xl' : 'text-sm'}`}>{stats?.streak ?? '–'}</span>
          <span className={big ? 'text-sm text-[var(--ink-muted)]' : 'text-xs text-[var(--ink-muted)]'}>day streak</span>
        </div>
        <div className={`flex items-center gap-2 ${big ? 'mt-2' : 'mt-1.5'}`}>
          <Coins className={big ? 'h-6 w-6 text-yellow-500' : 'h-4 w-4 text-yellow-500'} />
          <span className={`font-display font-extrabold ${big ? 'text-xl' : 'text-sm'}`}>{stats?.points ?? '–'}</span>
          <span className={big ? 'text-sm text-[var(--ink-muted)]' : 'text-xs text-[var(--ink-muted)]'}>points</span>
        </div>
        {lesson && (
          <p className={`border-t border-[var(--hairline)] ${big ? 'mt-3 pt-3 text-sm' : 'mt-2 pt-2 text-[11px]'} text-[var(--ink-muted)]`}>
            Up next: <span className="font-bold text-[var(--fg)]">{lesson.title}</span> · {lesson.sections.length} sections · {totalQuestions} questions
          </p>
        )}
      </div>
    </div>
  )
}

type LearnStep = { kind: 'card'; text: string; emoji: string; ref: string; image?: string } | { kind: 'groupcheck'; check: JourneyCheckCard }

/** Duolingo's own number, and the same for every lesson however long it is. */
const HEARTS_PER_LESSON = 5

/**
 * The lesson player, built as a replica of a Duolingo lesson rather than a
 * card sitting inside the Sunday School tab.
 *
 * Duolingo's lesson owns the whole screen: a close cross top left, one fat
 * rounded progress bar across the top, the reward top right, the exercise in
 * the middle, and a footer bar that is grey while you choose, then turns
 * green or red once you answer. That footer is the whole reason an answer is
 * a two step action there - you pick an option, then press CHECK - so this
 * follows the same two steps rather than marking right or wrong the instant
 * a child taps.
 *
 * Hearts work as Duolingo's do: five to a lesson, one spent on every wrong
 * answer, and at zero the lesson stops on its own screen. What is not
 * Duolingo is what happens next - the only way out of that screen is to
 * start the lesson over, free and immediately. No timer counting down to a
 * refill and nothing to buy: a child who ran out of hearts in a church app
 * being told to come back in four hours would simply stop coming back.
 *
 * One other thing is ours rather than theirs. A teaching page is laid out as
 * a Duolingo Stories page, the character on the left with the line in a
 * speech bubble beside it, because our teaching step is a picture and a
 * sentence.
 *
 * It has to go through a portal: KidsShell renders its header at z-40 and its
 * main at z-10, so anything inside main is capped below that header whatever
 * z-index it climbs to.
 *
 * Order of play is unchanged: cards then their group check, then a mastery
 * round over every mastery question, where getting one wrong requeues it to
 * the back of the line so the lesson cannot finish until each has been
 * answered right at least once.
 */
function LessonRunner({ bookKey, lessonKey, onDone }: { bookKey: string; lessonKey: string; onDone: () => void }) {
  const found = findLesson(lessonKey)
  const lesson = found?.lesson
  const [phase, setPhase] = useState<'learn' | 'mastery' | 'celebrate'>('learn')
  // Kept apart from `phase` so the progress bar still reads off the real
  // phase behind the out of hearts screen, and so a restart only has to
  // clear this one flag.
  const [outOfHearts, setOutOfHearts] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [queue, setQueue] = useState<number[]>([])
  const [wrongOnce, setWrongOnce] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [hearts, setHearts] = useState(HEARTS_PER_LESSON)
  // Counts losses rather than tracking a boolean, so the chip re-animates on
  // the second heart lost as well as the first - a key that never changes
  // replays no animation.
  const [heartsLost, setHeartsLost] = useState(0)

  /** Back to the first page with a full set of hearts. */
  const restart = () => {
    playClick()
    setPhase('learn')
    setStepIndex(0)
    setQueue([])
    setWrongOnce(new Set())
    setSelected(null)
    setShowResult(false)
    setHearts(HEARTS_PER_LESSON)
    setHeartsLost(0)
    setOutOfHearts(false)
  }

  // The lesson is a fixed full screen layer, so the page underneath must not
  // keep its own scrollbar or a phone scrolls the wrong thing under the
  // child's finger.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

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
  const learnStep = phase === 'learn' ? learnSteps[stepIndex] : null
  const activeCheck: JourneyCheckCard | null =
    phase === 'mastery' ? lesson.masteryQuestions[queue[0]] : learnStep && learnStep.kind === 'groupcheck' ? learnStep.check : null
  const isCorrect = activeCheck ? selected === activeCheck.correctIndex : false

  const pick = (idx: number) => {
    if (showResult) return
    playClick()
    haptics.tap()
    setSelected(idx)
  }

  const check = () => {
    if (!activeCheck || selected === null || showResult) return
    playClick()
    setShowResult(true)
    if (selected === activeCheck.correctIndex) haptics.success()
    else {
      haptics.error()
      setHearts((h) => Math.max(0, h - 1))
      setHeartsLost((n) => n + 1)
      if (phase === 'mastery') setWrongOnce((prev) => new Set(prev).add(queue[0]))
    }
  }

  const advanceLearn = async () => {
    playClick()
    setSelected(null)
    setShowResult(false)
    if (stepIndex + 1 < learnSteps.length) {
      setStepIndex(stepIndex + 1)
      return
    }
    if (totalMastery === 0) {
      haptics.success()
      await completeJourneyLesson(bookKey, lesson.key, 0)
      setPhase('celebrate')
      return
    }
    setQueue(lesson.masteryQuestions.map((_, i) => i))
    setPhase('mastery')
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

  // The last heart goes on the answer, but the child reads why they were
  // wrong first: the footer shows the correct answer as it always does, and
  // only pressing Continue from there lands on the out of hearts screen.
  const advance =
    hearts === 0
      ? () => {
          playClick()
          setOutOfHearts(true)
        }
      : phase === 'learn'
        ? advanceLearn
        : advanceMastery

  const progressPct =
    phase === 'celebrate'
      ? 100
      : phase === 'learn'
        ? ((stepIndex + 1) / learnSteps.length) * 60
        : 60 + (totalMastery ? masteredCount / totalMastery : 1) * 40

  // A teaching page has nothing to get wrong, so its footer is one plain
  // Continue. A question's footer is Check until it has been answered.
  const needsCheck = activeCheck !== null && !showResult
  const footState = !showResult ? '' : isCorrect ? 'is-good' : 'is-bad'

  const screen = (
    <div className="dl-screen">
      <header className="dl-top">
        <button className="dl-x" onClick={onDone} aria-label="Leave the lesson">
          <X className="h-6 w-6" strokeWidth={3} />
        </button>
        <div className="dl-bar" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="dl-bar-fill" style={{ width: `${Math.max(progressPct, 6)}%` }}>
            <span className="dl-bar-shine" />
          </div>
        </div>
        {/* Duolingo's own top right slot. It empties as the lesson goes, so
            it is the count that changes, not a row of five icons a child has
            to count at a glance. */}
        <p key={heartsLost} className={`dl-hearts ${hearts === 0 ? 'is-empty' : ''} ${heartsLost > 0 ? 'is-lost' : ''}`}>
          <Heart className="h-5 w-5" fill="currentColor" strokeWidth={0} />
          {hearts}
        </p>
      </header>

      <main className="dl-main">
        <div className="dl-stage">
          {outOfHearts ? (
            <OutOfHearts />
          ) : phase === 'celebrate' ? (
            <LessonComplete total={totalMastery} firstTry={totalMastery - wrongOnce.size} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={phase === 'learn' ? `learn-${stepIndex}` : `mastery-${queue[0]}-${masteredCount}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18 }}
              >
                {activeCheck ? (
                  <QuestionStep
                    eyebrow={phase === 'mastery' ? 'Mastery round' : 'Quick check'}
                    check={activeCheck}
                    selected={selected}
                    showResult={showResult}
                    onPick={pick}
                  />
                ) : learnStep && learnStep.kind === 'card' ? (
                  <StoryStep step={learnStep} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <footer className={`dl-foot ${outOfHearts ? '' : footState}`}>
        <div className="dl-foot-in">
          {!outOfHearts && showResult && activeCheck && (
            <div className="dl-verdict">
              <span className="dl-verdict-mark">
                {isCorrect ? <Check className="h-5 w-5" strokeWidth={4} /> : <X className="h-5 w-5" strokeWidth={4} />}
              </span>
              <div>
                <p className="dl-verdict-title">{isCorrect ? 'Nice!' : 'Correct answer:'}</p>
                {!isCorrect && <p className="dl-verdict-answer">{activeCheck.options[activeCheck.correctIndex]}</p>}
                {!isCorrect && activeCheck.explanation && <p className="dl-verdict-why">{activeCheck.explanation}</p>}
                {!isCorrect && phase === 'mastery' && <p className="dl-verdict-why">This one will come back around.</p>}
              </div>
            </div>
          )}

          {outOfHearts ? (
            <>
              <button className="dl-btn dl-btn-go" onClick={restart}>
                <RotateCcw className="h-5 w-5" strokeWidth={3} /> Try again
              </button>
              <button className="dl-btn dl-btn-quiet" onClick={onDone}>
                Not now
              </button>
            </>
          ) : phase === 'celebrate' ? (
            <button className="dl-btn dl-btn-go" onClick={onDone}>
              Continue
            </button>
          ) : needsCheck ? (
            <button className="dl-btn dl-btn-go" onClick={check} disabled={selected === null}>
              Check
            </button>
          ) : (
            <button className={`dl-btn ${showResult ? (isCorrect ? 'dl-btn-good' : 'dl-btn-bad') : 'dl-btn-go'}`} onClick={advance}>
              Continue
            </button>
          )}
        </div>
      </footer>
    </div>
  )

  return createPortal(screen, document.body)
}

/** A teaching page, laid out as a Duolingo Stories page. */
function StoryStep({ step }: { step: Extract<LearnStep, { kind: 'card' }> }) {
  return (
    <div>
      <p className="dl-eyebrow">
        <span className="dl-eyebrow-dot">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        New story
      </p>
      <div className="dl-story">
        <div className="dl-avatar">
          {step.image ? <img src={step.image} alt="" /> : <span className="dl-emoji">{step.emoji}</span>}
        </div>
        <div className="dl-bubble">
          <p className="dl-bubble-text">{step.text}</p>
          <a href={bibleComUrl(step.ref)} target="_blank" rel="noreferrer" className="dl-ref">
            <BookOpen className="h-3.5 w-3.5" /> {step.ref}
          </a>
        </div>
      </div>
    </div>
  )
}

/** One multiple choice exercise, laid out as a Duolingo exercise. */
function QuestionStep({
  eyebrow,
  check,
  selected,
  showResult,
  onPick,
}: {
  eyebrow: string
  check: JourneyCheckCard
  selected: number | null
  showResult: boolean
  onPick: (idx: number) => void
}) {
  return (
    <div>
      <p className="dl-eyebrow">
        <span className="dl-eyebrow-dot">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        {eyebrow}
      </p>
      <h2 className="dl-q">{check.question}</h2>
      <div className="dl-opts">
        {check.options.map((opt, idx) => {
          const picked = idx === selected
          const state = !showResult
            ? picked
              ? 'is-pick'
              : ''
            : idx === check.correctIndex
              ? 'is-good'
              : picked
                ? 'is-bad'
                : ''
          return (
            <button key={idx} onClick={() => onPick(idx)} disabled={showResult} className={`dl-opt ${state}`}>
              <span className="dl-opt-num">{idx + 1}</span>
              <span className="dl-opt-text">{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The page a child lands on with no hearts left. Deliberately not a
 * punishment screen: it names what happened, says the way back is simply to
 * start again, and the footer carries that as the loud button.
 */
function OutOfHearts() {
  return (
    <div className="dl-done">
      <p className="dl-done-emoji dl-done-sad">
        <HeartCrack className="h-16 w-16" strokeWidth={2.25} />
      </p>
      <h2 className="dl-done-title">Out of hearts</h2>
      <p className="dl-done-sub">
        That is alright. Every one of these is worth a second go, and you keep everything you learned on the way.
      </p>
    </div>
  )
}

/** Duolingo's end of lesson page: the title, then the run of stat pills. */
function LessonComplete({ total, firstTry }: { total: number; firstTry: number }) {
  const accuracy = total === 0 ? 100 : Math.round((firstTry / total) * 100)
  return (
    <div className="dl-done">
      <Confetti active />
      <p className="dl-done-emoji">🎉</p>
      <h2 className="dl-done-title">Lesson complete!</h2>
      <div className="dl-stats">
        <div className="dl-stat dl-stat-xp">
          <p className="dl-stat-label">Total points</p>
          <p className="dl-stat-value">
            <Coins className="h-5 w-5" /> 15
          </p>
        </div>
        <div className="dl-stat dl-stat-good">
          <p className="dl-stat-label">Right first try</p>
          <p className="dl-stat-value">
            <Star className="h-5 w-5" /> {accuracy}%
          </p>
        </div>
      </div>
    </div>
  )
}
