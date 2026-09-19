import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Check, Star, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, BookOpen, Flame, Coins } from 'lucide-react'
import {
  BIBLE_BOOK_ORDER,
  JOURNEY_BOOKS,
  getJourneyBook,
  lessonKeysInOrder,
  slugifyBookTitle,
  findLesson,
  type JourneyBook,
  type JourneyLesson,
  type JourneyCheckCard,
} from '../content/bibleJourney'
import { bibleComUrl } from '../lib/bibleLink'
import { getMyJourneyProgress, completeJourneyLesson, type JourneyProgressRow } from '../lib/journey'
import { getMyStudentProfile, getLeaderboard, getMyBibleStreak } from '../lib/ministry'
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

// No dedicated cover exists per book (only Genesis has real content so far) -
// cycles through the app's existing Bible-scene art so every tile still
// looks like a real book cover, same trick as the Sunday School calendar.
const BOOK_COVER_IMAGES = [
  '/journey/adam-eve-garden-home.jpg',
  '/journey/noah-building-ark.jpg',
  '/journey/tower-of-babel.jpg',
  '/journey/abraham-isaac-ram-provided.jpg',
  '/journey/jacob-ladder-dream.jpg',
  '/journey/cain-abel-offerings.jpg',
  '/journey/noah-dove-olive-branch.jpg',
  '/journey/adam-eve-first-sin.jpg',
  '/feature-bible.png',
  '/hero-bible.jpg',
  '/mfm-wuye-building.jpg',
]

function BookSquircle({
  title,
  image,
  subtitle,
  badge,
  locked,
  onClick,
}: {
  title: string
  image: string
  subtitle?: string
  badge?: string
  locked?: boolean
  onClick?: () => void
}) {
  const isMascotPng = image.endsWith('.png')
  const content = (
    <>
      {isMascotPng ? (
        <div className="flex h-full w-full items-center justify-center" style={{ background: `color-mix(in srgb, ${ACCENT} 16%, var(--ink-panel))` }}>
          <img src={image} alt="" className={`h-2/3 w-2/3 object-contain ${locked ? 'opacity-40' : ''}`} />
        </div>
      ) : (
        <img src={image} alt="" className={`h-full w-full object-cover ${locked ? 'opacity-40' : ''}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55">
            <Lock className="h-4 w-4 text-white" />
          </span>
        </div>
      ) : (
        badge && (
          <span
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-base"
            style={{ background: `color-mix(in srgb, ${ACCENT} 30%, black)` }}
          >
            {badge}
          </span>
        )
      )}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-display text-sm font-extrabold leading-tight text-white drop-shadow">{title}</p>
        {subtitle && <p className="text-[10px] font-semibold text-white/80">{subtitle}</p>}
      </div>
    </>
  )
  const className = `relative aspect-square overflow-hidden rounded-[28px] bg-[var(--ink-panel)] text-left transition ${
    locked ? 'opacity-70' : 'hover:scale-[1.02]'
  }`
  return onClick ? (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
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
        <>
          <p className="text-sm text-[var(--ink-muted)]">
            Walk through the Bible one book at a time, learning the stories, the people, and what they teach - at your own pace.
          </p>
          <div
            className="-mx-4 grid gap-3 px-4 py-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              backgroundImage: 'radial-gradient(var(--ink-faint) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          >
            {BIBLE_BOOK_ORDER.map((title, i) => {
              const key = slugifyBookTitle(title)
              const book = getJourneyBook(key)
              const cover = BOOK_COVER_IMAGES[i % BOOK_COVER_IMAGES.length]
              if (!book) {
                return <BookSquircle key={key} title={title} image={cover} locked />
              }
              const total = lessonKeysInOrder(book).length
              const done = bookProgressCount(book, completedKeys)
              return (
                <BookSquircle
                  key={key}
                  title={book.title}
                  image={cover}
                  subtitle={`${done}/${total} lessons`}
                  badge={done === total ? '👑' : '📖'}
                  onClick={() => {
                    playClick()
                    onOpenBook(key)
                  }}
                />
              )
            })}
          </div>
        </>
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

function UnitPath({
  bookKey,
  completedKeys,
  onOpenLesson,
}: {
  bookKey: string
  completedKeys: Set<string>
  onOpenLesson: (lessonKey: string) => void
}) {
  const [stats, setStats] = useState<JourneyStats | null>(null)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  useEffect(() => {
    Promise.all([getMyStudentProfile(), getLeaderboard(500), getMyBibleStreak()]).then(([student, board, streak]) => {
      if (!student) return
      const rankIdx = board.findIndex((r) => r.student_id === student.id)
      setStats({ points: student.total_points, rank: rankIdx === -1 ? null : rankIdx + 1, streak })
    })
  }, [])

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
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden sm:max-h-[75vh]">
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


  return (
    <div className="space-y-3">
      <p className="eyebrow">{book.title}</p>

      {/* Phones: the same two cards stacked above the path, since there's no room to flank it there. */}
      <div className="space-y-3 sm:hidden">
        {preview}
        {stats_}
        {track}
      </div>

      {/* This used to be one flex row from 640px up: two fixed 360px rails
          pushed to the far edges with justify-between and the path squeezed
          between them. Two rails plus the 380px track need ~1130px, so
          between 640 and 1130 they crushed each other, and past that the
          rails drifted to opposite ends of a very wide screen with the path
          stranded in the middle. Two honest layouts instead, each with a
          max width and a real grid. */}

      {/* Tablet and small laptop: both cards side by side, equal height, path
          centred underneath. */}
      <div className="mx-auto hidden w-full max-w-4xl space-y-4 sm:block xl:hidden">
        <div className="grid grid-cols-2 gap-4">
          {preview}
          {stats_}
        </div>
        <div className="flex justify-center">{track}</div>
      </div>

      {/* Wide screens only, where all three genuinely fit. */}
      <div className="mx-auto hidden w-full max-w-[1320px] grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,360px)] items-start gap-6 xl:grid">
        {preview}
        <div className="flex justify-center">{track}</div>
        {stats_}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/40" />

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
    phase === 'learn' ? ((stepIndex + 1) / learnSteps.length) * 60 : 60 + (totalMastery ? masteredCount / totalMastery : 1) * 40

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
