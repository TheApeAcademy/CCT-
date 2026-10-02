import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, BookOpen, Check, Flame, Heart, HeartCrack, Lock, Moon, Star, Sun, Zap } from 'lucide-react'
import { JOURNEY_BOOKS, getJourneyBook, slugifyBookTitle, lessonKeysInOrder, type JourneyBook, type JourneyCheckCard, type JourneyContentCard, type JourneyLesson } from '../content/bibleJourney'
import { bibleComUrl } from '../lib/bibleLink'
import { getMyJourneyProgress, completeJourneyLesson, type JourneyProgressRow } from '../lib/journey'
import { getMyStudentProfile, getMyBibleStreak } from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { loadKidsSky, saveKidsSky } from '../lib/kidsSky'
import '../design/journey.css'

// Bible Journey, rebuilt from the Claude Design handoff (Bible Journey v2).
// Three screens on one page: the Old Testament book map, a book's lesson
// path, and the lesson player (story cards, a quick check after each
// section, then a mastery round where a wrong answer comes back at the end).
// Lesson content is static app code; progress and points are the database's
// (complete_journey_lesson, whose trigger adds 15 points the first time).

const DISPLAY = "'Bricolage Grotesque', sans-serif"
const HEARTS = 5
const LESSON_POINTS = 15

const OT: [string, string[]][] = [
  ['The Law', ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy']],
  ['Into the Land', ['Joshua', 'Judges', 'Ruth']],
  ['Kings and Kingdoms', ['1 Samuel', '2 Samuel', '1 Kings', '2 Kings']],
  ['Coming Home', ['1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther']],
  ['Songs and Wisdom', ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon']],
  ['The Big Prophets', ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel']],
  ['The Twelve', ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi']],
]
const ART: Record<string, string> = {
  Genesis: '/journey/books/genesis.jpg',
  Numbers: '/journey/books/numbers.jpg',
  Joshua: '/journey/books/joshua.jpg',
  Judges: '/journey/books/judges.jpg',
  Esther: '/journey/books/esther.jpg',
  Psalms: '/journey/books/psalms.jpg',
  Proverbs: '/journey/books/proverbs.jpg',
  Exodus: '/scenes/moses.jpg',
  Ruth: '/scenes/ruth.jpg',
  '1 Samuel': '/scenes/david.jpg',
  '1 Kings': '/scenes/elijah.jpg',
  Daniel: '/scenes/daniel.jpg',
  Jonah: '/scenes/jonah.jpg',
}
const UNIT_IMG = [
  '/journey/adam-eve-garden-home.jpg',
  '/scenes/adam.jpg',
  '/scenes/abraham.jpg',
  '/journey/noah-building-ark.jpg',
  '/journey/tower-of-babel.jpg',
  '/scenes/abraham.jpg',
  '/scenes/u2.jpg',
  '/scenes/joseph.jpg',
  '/scenes/joseph.jpg',
  '/scenes/joseph.jpg',
  '/journey/books/genesis.jpg',
]

const wave = (i: number) => Math.round(Math.sin((i * Math.PI) / 2) * 78)
function rng(seed: number) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}
const r = rng(12)
const STARS = Array.from({ length: 30 }, () => ({ x: +(r() * 100).toFixed(1), y: +(r() * 100).toFixed(1), s: r() > 0.8 ? 3 : 2, d: +(1.6 + r() * 2.6).toFixed(2), dl: +(-r() * 3).toFixed(2) }))
const COLS = ['#ffc93c', '#ff4fa3', '#4f7bff', '#2fe0b5', '#c13bff', '#ff8a3d']
const CONFETTI = Array.from({ length: 44 }, (_, i) => {
  const a = (i / 44) * Math.PI * 2
  const d = 160 + r() * 220
  return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d - 80), s: 8 + Math.round(r() * 6), h: 10 + Math.round(r() * 10), col: COLS[i % 6] }
})

type Step = { kind: 'card'; c: JourneyContentCard } | { kind: 'q'; q: JourneyCheckCard; mastery: boolean; id: string }

function buildSteps(lesson: JourneyLesson): Step[] {
  const out: Step[] = []
  lesson.sections.forEach((sec, si) => {
    sec.cards.forEach((c) => out.push({ kind: 'card', c }))
    sec.checkQuestions.forEach((q, qi) => out.push({ kind: 'q', q, mastery: false, id: `c${si}-${qi}` }))
  })
  lesson.masteryQuestions.forEach((q, qi) => out.push({ kind: 'q', q, mastery: true, id: `m${qi}` }))
  return out
}

const bookFor = (title: string): JourneyBook | undefined => getJourneyBook(slugifyBookTitle(title))

type Screen = { name: 'map' } | { name: 'path'; book: string } | { name: 'lesson'; book: string; lessonKey: string }

export default function BibleJourneyPanel({ onExit }: { onExit: () => void }) {
  const [sky, setSky] = useState(loadKidsSky)
  const [screen, setScreen] = useState<Screen>({ name: 'map' })
  const [sel, setSel] = useState('Genesis')
  const [progress, setProgress] = useState<JourneyProgressRow[]>([])
  const [streak, setStreak] = useState(0)
  const [points, setPoints] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  const done = useMemo(() => new Set(progress.map((p) => p.lesson_key)), [progress])

  const refresh = useCallback(() => {
    getMyJourneyProgress()
      .then(setProgress)
      .catch(() => {})
    getMyStudentProfile()
      .then((s) => setPoints(s?.total_points ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    getMyBibleStreak()
      .then((n) => setStreak(Number(n) || 0))
      .catch(() => {})
  }, [refresh])

  // The journey is its own full page over the dashboard, so the page under
  // it must not scroll under a child's finger.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const toggleSky = () => {
    const next = sky === 'night' ? 'day' : 'night'
    setSky(next)
    playClick()
    saveKidsSky(next)
  }

  const go = (s: Screen) => {
    playClick()
    setScreen(s)
    scroller.current?.scrollTo({ top: 0 })
  }

  const goBack = () => {
    if (screen.name === 'map') {
      playClick()
      onExit()
    } else go(screen.name === 'lesson' ? { name: 'path', book: screen.book } : { name: 'map' })
  }

  const backLabel = screen.name === 'map' ? 'Sunday School' : screen.name === 'path' ? 'All books' : 'Quit lesson'

  // The lesson owns the hearts, but they sit in the shared header.
  const [hearts, setHearts] = useState<{ n: number; lost: number }>({ n: HEARTS, lost: -1 })

  const page = (
    <div
      ref={scroller}
      data-dc-screen="journey"
      data-sky={sky}
      data-journey-scroll
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        overflowY: 'auto',
        overflowX: 'clip',
        overscrollBehavior: 'contain',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%,var(--glow),transparent 60%),var(--bg)',
        backgroundAttachment: 'local',
        color: 'var(--body)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        transition: 'background .6s,color .6s',
      }}
    >
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {STARS.map((st, i) => (
          <span key={i} style={{ position: 'fixed', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, opacity: 'var(--starop)', pointerEvents: 'none' }}>
            <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: '#fff', animation: `jv-twinkle ${st.d}s ease-in-out infinite`, animationDelay: `${st.dl}s` }} />
          </span>
        ))}
        <header style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px clamp(12px,2.5vw,28px)', background: 'var(--hdr)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--hair)' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <button
              type="button"
              onClick={goBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px 10px 12px', borderRadius: 999, border: '1px solid var(--hair2)', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} strokeWidth={2} />
              {backLabel}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {screen.name === 'lesson' && (
                <span style={{ display: 'flex', gap: 3, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,91,107,.14)' }} aria-label={`${hearts.n} hearts left`}>
                  {Array.from({ length: HEARTS }, (_, i) => (
                    <Heart key={i} style={{ width: 18, height: 18, color: i < hearts.n ? '#ff5b6b' : 'var(--hair2)', animation: i === hearts.lost ? 'jv-heartOut .6s both' : 'none' }} strokeWidth={2} />
                  ))}
                </span>
              )}
              <button
                type="button"
                onClick={toggleSky}
                aria-label="Switch light or dark"
                style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {sky === 'night' ? <Sun style={{ width: 20, height: 20 }} strokeWidth={2} /> : <Moon style={{ width: 20, height: 20 }} strokeWidth={2} />}
              </button>
            </div>
          </div>
        </header>

        <main style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(12px,2.5vw,28px) 80px' }}>
          {screen.name === 'map' && <BookMap sel={sel} setSel={setSel} done={done} streak={streak} points={points} openBook={(b) => go({ name: 'path', book: b })} />}
          {screen.name === 'path' && <LessonPath book={screen.book} done={done} start={(key) => go({ name: 'lesson', book: screen.book, lessonKey: key })} />}
          {screen.name === 'lesson' && (
            <LessonPlayer
              key={screen.lessonKey}
              book={screen.book}
              lessonKey={screen.lessonKey}
              wasDone={done.has(screen.lessonKey)}
              onHearts={setHearts}
              onFinished={refresh}
              onExit={() => go({ name: 'path', book: screen.book })}
              scrollTop={() => scroller.current?.scrollTo({ top: 0 })}
            />
          )}
        </main>
      </div>
    </div>
  )

  return createPortal(page, document.body)
}

const btn3d = (bg: string, sh: string): CSSProperties =>
  ({ background: bg, boxShadow: `0 5px 0 ${sh}`, ['--sh' as string]: sh }) as CSSProperties

function BookMap({
  sel,
  setSel,
  done,
  streak,
  points,
  openBook,
}: {
  sel: string
  setSel: (b: string) => void
  done: Set<string>
  streak: number
  points: number
  openBook: (b: string) => void
}) {
  const bookStats = (title: string) => {
    const book = bookFor(title)
    if (!book) return null
    const keys = lessonKeysInOrder(book)
    const n = keys.filter((k) => done.has(k)).length
    return { book, total: keys.length, done: n, complete: keys.length > 0 && n === keys.length }
  }

  const all = OT.flatMap(([unit, bs]) => bs.map((b) => ({ b, unit })))
  const picked = all.find((x) => x.b === sel) ?? all[0]
  const ps = bookStats(picked.b)
  const booksDone = all.filter((x) => bookStats(x.b)?.complete).length
  const allLessons = JOURNEY_BOOKS.flatMap(lessonKeysInOrder)
  const lessonsDone = allLessons.filter((k) => done.has(k)).length

  const stats: [typeof Flame, string, string, string][] = [
    [Flame, `${streak}`, 'DAY STREAK', '#ff8a3d'],
    [Zap, points.toLocaleString(), 'TOTAL POINTS', '#c13bff'],
    [BookOpen, `${lessonsDone}/${allLessons.length}`, 'LESSONS DONE', '#13b48c'],
    [Heart, `${HEARTS}`, 'HEARTS PER LESSON', '#ff5b6b'],
  ]

  let n = -1
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 22, alignItems: 'start', animation: 'jv-up .5s both' }}>
      <div key={picked.b} className="jv-side" style={{ top: 90, overflow: 'hidden', borderRadius: 28, background: 'var(--card)', border: '1px solid var(--hair)', boxShadow: '0 30px 60px -36px rgba(0,0,0,.6)', animation: 'jv-up .4s both' }}>
        <div style={{ position: 'relative', aspectRatio: '4/3', background: ART[picked.b] ? `url(${ART[picked.b]}) center/cover` : 'linear-gradient(150deg,#3a2560,#1a0f2e)' }}>
          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(0,0,0,.6))' }} />
          <span style={{ position: 'absolute', left: 18, bottom: 16, fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: '-.02em', color: '#fff' }}>{picked.b}</span>
        </div>
        <div style={{ padding: '18px 20px 20px' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', color: '#ff8a3d' }}>{picked.unit.toUpperCase()}</p>
          <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5 }}>
            {ps ? `${ps.total} lessons · ${ps.done} done. Read the story, answer a few questions, then a final round to lock it in.` : 'This book’s lessons are on their way.'}
          </p>
          {ps ? (
            <>
              <div style={{ marginTop: 12, height: 8, borderRadius: 9, background: 'var(--track)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ps.total ? Math.round((ps.done / ps.total) * 100) : 0}%`, borderRadius: 9, background: 'linear-gradient(90deg,#ff8a3d,#ffd84d)' }} />
              </div>
              <button
                type="button"
                className="jv-3d"
                onClick={() => openBook(picked.b)}
                style={{ marginTop: 16, width: '100%', padding: 15, borderRadius: 16, border: 'none', ...btn3d('linear-gradient(180deg,#ff9a4d,#e0452a)', '#8a2a12'), color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, letterSpacing: '.04em', cursor: 'pointer' }}
              >
                {ps.done ? 'CONTINUE' : `START ${picked.b.toUpperCase()}`}
              </button>
            </>
          ) : (
            <p style={{ margin: '14px 0 0', padding: 12, borderRadius: 14, background: 'var(--track)', fontWeight: 800, fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>Coming soon</p>
          )}
        </div>
      </div>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'sticky', top: 80, zIndex: 5, width: '100%', maxWidth: 380, padding: '16px 18px', borderRadius: 20, background: 'linear-gradient(135deg,#ff8a3d,#c2410c)', color: '#fff', boxShadow: '0 14px 30px -16px rgba(194,65,12,.8)' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.14em', opacity: 0.85 }}>OLD TESTAMENT</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <p style={{ margin: '2px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 22 }}>{picked.unit}</p>
            <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.9 }}>
              {booksDone}/{all.length}
            </span>
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: 380, padding: '18px 0' }}>
          {OT.map(([unit, bs], ui) => (
            <div key={unit}>
              {ui > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
                  <span style={{ flex: 1, height: 2, borderRadius: 9, background: 'var(--hair2)' }} />
                  <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 14, color: 'var(--muted)' }}>{unit}</span>
                  <span style={{ flex: 1, height: 2, borderRadius: 9, background: 'var(--hair2)' }} />
                </div>
              )}
              {bs.map((b) => {
                n++
                const i = n
                const st = bookStats(b)
                const complete = !!st?.complete
                const cur = !!st && !complete
                const isSel = sel === b
                return (
                  <div key={b} style={{ display: 'flex', justifyContent: 'center', marginTop: (i ? 20 : 0) + (cur ? 30 : 0) }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${wave(i)}px)` }}>
                      {cur && <StartBubble />}
                      <PathNode
                        label={b}
                        state={complete ? 'done' : cur ? 'cur' : 'lock'}
                        size={72}
                        ring={isSel}
                        onClick={() => {
                          playClick()
                          setSel(b)
                        }}
                      />
                      <span style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: cur || isSel ? 'var(--ink)' : 'var(--faint)', whiteSpace: 'nowrap' }}>{b}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="jv-side" style={{ top: 90, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stats.map(([Icon, v, l, col]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 22, background: 'var(--card)', border: '1px solid var(--hair)' }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: `${col}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 22, height: 22, color: col }} strokeWidth={2} />
            </span>
            <span>
              <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, lineHeight: 1, color: 'var(--ink)' }}>{v}</span>
              <span style={{ display: 'block', marginTop: 3, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)' }}>{l}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StartBubble() {
  return (
    <span style={{ position: 'absolute', left: '50%', top: -36, padding: '6px 12px', borderRadius: 12, background: '#fff', color: '#c2410c', fontWeight: 800, fontSize: 13, boxShadow: '0 6px 14px rgba(0,0,0,.25)', animation: 'jv-bounce 1.4s ease-in-out infinite', whiteSpace: 'nowrap' }}>
      Start
    </span>
  )
}

function PathNode({ label, state, size, ring, onClick }: { label: string; state: 'done' | 'cur' | 'lock'; size: number; ring?: boolean; onClick: () => void }) {
  const bg = state === 'done' ? '#ffd84d' : state === 'cur' ? 'linear-gradient(180deg,#ff9a4d,#e0452a)' : 'var(--lock)'
  const sh = state === 'done' ? '#b38600' : state === 'cur' ? '#8a2a12' : 'rgba(0,0,0,.25)'
  const Icon = state === 'done' ? Check : state === 'cur' ? Star : Lock
  const ic = Math.round(size * 0.42)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="jv-press"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        background: bg,
        boxShadow: `0 6px 0 ${sh}${ring ? ',0 0 0 5px rgba(255,138,61,.35)' : ''}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: state === 'cur' ? 'jv-pulse 1.8s infinite' : 'none',
        transition: 'transform .2s',
      }}
    >
      <Icon style={{ width: ic, height: ic, color: state === 'lock' ? 'var(--faint)' : '#fff' }} strokeWidth={2} />
    </button>
  )
}

function LessonPath({ book, done, start }: { book: string; done: Set<string>; start: (key: string) => void }) {
  const b = bookFor(book)
  if (!b) return null
  const keys = lessonKeysInOrder(b)
  const curIdx = keys.findIndex((k) => !done.has(k))
  let idx = -1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'jv-up .5s both' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {b.units.map((u, ui) => (
          <div key={u.key} style={{ marginTop: ui ? 40 : 0 }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 20,
                background: `linear-gradient(90deg,rgba(0,0,0,.65),rgba(0,0,0,.2)),url(${UNIT_IMG[ui] ?? UNIT_IMG[0]}) center/cover`,
                color: '#fff',
              }}
            >
              <span style={{ fontSize: 26 }}>{u.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.14em', opacity: 0.8 }}>UNIT {ui + 1}</span>
                <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 19 }}>{u.title}</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>
                {u.lessons.filter((l) => done.has(l.key)).length}/{u.lessons.length}
              </span>
            </div>
            {u.lessons.map((l) => {
              idx++
              const i = idx
              const d = done.has(l.key)
              const cur = i === curIdx
              const open = d || cur
              return (
                <div key={l.key} style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${wave(i)}px)` }}>
                    {cur && <StartBubble />}
                    <PathNode label={l.title} state={d ? 'done' : cur ? 'cur' : 'lock'} size={76} onClick={() => open && start(l.key)} />
                    <span style={{ marginTop: 8, maxWidth: 180, textAlign: 'center', fontSize: 13, fontWeight: 800, color: open ? 'var(--ink)' : 'var(--faint)' }}>{l.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>{l.reference}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function LessonPlayer({
  book,
  lessonKey,
  wasDone,
  onHearts,
  onFinished,
  onExit,
  scrollTop,
}: {
  book: string
  lessonKey: string
  wasDone: boolean
  onHearts: (h: { n: number; lost: number }) => void
  onFinished: () => void
  onExit: () => void
  scrollTop: () => void
}) {
  const b = bookFor(book)
  const lesson = b?.units.flatMap((u) => u.lessons).find((l) => l.key === lessonKey)
  const fresh = useCallback(
    () => ({ steps: lesson ? buildSteps(lesson) : [], i: 0, picked: null as number | null, hearts: HEARTS, lost: -1, firstTry: 0, masteryFirstTry: 0, answered: 0, missed: {} as Record<string, true>, out: false, done: false }),
    [lesson],
  )
  const [s, setS] = useState(fresh)
  const [confetti, setConfetti] = useState(false)
  const [earned, setEarned] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  useEffect(() => {
    onHearts({ n: s.hearts, lost: s.lost })
  }, [s.hearts, s.lost, onHearts])

  if (!lesson || !b) return <p style={{ textAlign: 'center' }}>This lesson couldn&apos;t be found.</p>

  const st = s.steps[s.i]
  const answered = s.picked !== null
  const ok = answered && st?.kind === 'q' && s.picked === st.q.correctIndex

  const restart = () => {
    playClick()
    scrollTop()
    setS(fresh())
  }

  const pick = (j: number) => {
    if (!st || st.kind !== 'q' || s.picked !== null) return
    const right = j === st.q.correctIndex
    const first = !s.missed[st.id]
    const hearts = right ? s.hearts : s.hearts - 1
    if (right) haptics.success()
    else haptics.error()
    setS({
      ...s,
      picked: j,
      hearts,
      lost: right ? -1 : hearts,
      answered: s.answered + (first ? 1 : 0),
      firstTry: s.firstTry + (right && first ? 1 : 0),
      masteryFirstTry: s.masteryFirstTry + (right && first && st.mastery ? 1 : 0),
      missed: right ? s.missed : { ...s.missed, [st.id]: true },
    })
    if (hearts <= 0) timers.current.push(window.setTimeout(() => setS((p) => ({ ...p, out: true })), 900))
  }

  const foot = () => {
    if (s.out) return restart()
    if (s.done) return onExit()
    if (!st || (st.kind === 'q' && s.picked === null)) return
    playClick()
    let steps = s.steps
    if (st.kind === 'q' && st.mastery && s.picked !== st.q.correctIndex) steps = [...steps, st]
    if (s.i + 1 >= steps.length) {
      haptics.success()
      setS({ ...s, steps, done: true })
      setConfetti(true)
      timers.current.push(window.setTimeout(() => setConfetti(false), 1600))
      // The database awards the points once; a replay records nothing new.
      setEarned(wasDone ? 0 : LESSON_POINTS)
      completeJourneyLesson(b.key, lesson.key, s.masteryFirstTry)
        .then(onFinished)
        .catch(() => setEarned(0))
      return
    }
    setS({ ...s, steps, i: s.i + 1, picked: null })
  }

  const lPct = Math.round((s.done ? 1 : s.i / Math.max(1, s.steps.length)) * 100)
  const isCard = !s.out && !s.done && st?.kind === 'card'
  const isQ = !s.out && !s.done && st?.kind === 'q'
  const fb = st?.kind === 'q' && answered && !s.out
  const waiting = st?.kind === 'q' && !answered && !s.out && !s.done
  const btnBg = waiting ? 'var(--track)' : fb && !ok ? 'linear-gradient(180deg,#ff7a88,#e0405a)' : 'linear-gradient(180deg,#5cf0c8,#13b48c)'
  const btnSh = waiting ? 'transparent' : fb && !ok ? '#8a1a2c' : '#0b7a5e'
  const btnLabel = s.out ? 'TRY AGAIN' : s.done ? 'CONTINUE' : st?.kind === 'card' ? 'CONTINUE' : answered ? 'CONTINUE' : 'CHECK'
  const fbTitle = s.out ? 'No hearts left' : ok ? 'Nicely done!' : 'Not quite'
  const fbText =
    s.out || ok || st?.kind !== 'q' ? '' : `Answer: ${st.q.options[st.q.correctIndex]}. ${st.q.explanation ?? ''}${st.mastery ? ' You’ll see this one again.' : ''}`

  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 170 }}>
        <div style={{ height: 14, borderRadius: 999, background: 'var(--track)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${lPct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#ff8a3d,#ffd84d)', transition: 'width .5s cubic-bezier(.34,1.2,.64,1)' }} />
        </div>
        {isCard && st.kind === 'card' && (
          <div key={`${s.i}-${s.steps.length}`} style={{ marginTop: 26, padding: 'clamp(22px,4vw,34px)', borderRadius: 28, background: 'var(--card)', border: '1px solid var(--hair)', animation: 'jv-up .4s both' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ff8a3d' }}>{lesson.title.toUpperCase()} · STORY</p>
            <p style={{ margin: '18px 0 0', fontSize: 64, lineHeight: 1, animation: 'jv-pop .5s both' }}>{st.c.emoji}</p>
            <p style={{ margin: '16px 0 0', fontSize: 'clamp(18px,2.4vw,22px)', lineHeight: 1.6, fontWeight: 600, color: 'var(--ink)', ['textWrap' as string]: 'pretty' } as CSSProperties}>{st.c.text}</p>
            <a href={bibleComUrl(st.c.ref)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 14, padding: '6px 12px', borderRadius: 999, background: 'var(--track)', fontSize: 13, fontWeight: 800 }}>
              {st.c.ref} ↗
            </a>
          </div>
        )}
        {isQ && st.kind === 'q' && (
          <div key={`${s.i}-${s.steps.length}`} style={{ marginTop: 26, animation: answered && !ok ? 'jv-shake .4s' : 'jv-up .35s both' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: st.mastery ? '#c13bff' : '#ff8a3d' }}>{st.mastery ? 'MASTERY ROUND' : 'QUICK CHECK'}</p>
            <p style={{ margin: '10px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(24px,3.4vw,32px)', lineHeight: 1.15, color: 'var(--ink)' }}>{st.q.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              {st.q.options.map((t, j) => {
                const right = answered && j === st.q.correctIndex
                const wrong = answered && j === s.picked && !ok
                const bd = right ? '#2fe0b5' : wrong ? '#ff5b6b' : 'var(--hair2)'
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => pick(j)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '16px 18px',
                      borderRadius: 18,
                      border: `2px solid ${bd}`,
                      background: right ? 'rgba(47,224,181,.14)' : wrong ? 'rgba(255,91,107,.1)' : 'var(--card)',
                      boxShadow: `0 4px 0 ${bd}`,
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      fontSize: 17,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, border: `2px solid ${bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--muted)' }}>
                      {'ABCD'[j]}
                    </span>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {s.out && (
          <div style={{ marginTop: 40, textAlign: 'center', animation: 'jv-up .5s both' }}>
            <HeartCrack style={{ display: 'block', margin: '0 auto', width: 90, height: 90, color: '#ff5b6b', animation: 'jv-pop .6s both' }} strokeWidth={2} />
            <h2 style={{ margin: '18px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, color: 'var(--ink)' }}>Out of hearts</h2>
            <p style={{ margin: '8px 0 0', fontSize: 16 }}>That&rsquo;s OK. Start the lesson again and you&rsquo;ll do even better.</p>
          </div>
        )}
        {s.done && (
          <div style={{ marginTop: 40, textAlign: 'center', animation: 'jv-up .5s both' }}>
            <p style={{ margin: 0, fontSize: 72, animation: 'jv-pop .6s both' }}>🎉</p>
            <h2 style={{ margin: '12px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px,5vw,44px)', letterSpacing: '-.03em', color: 'var(--ink)' }}>Lesson complete!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              <span style={{ padding: '14px 18px', borderRadius: 18, border: '2px solid #ffd84d', color: '#d99a00', fontWeight: 800 }}>+{earned} pts</span>
              <span style={{ padding: '14px 18px', borderRadius: 18, border: '2px solid #2fe0b5', color: '#13b48c', fontWeight: 800 }}>{s.answered ? Math.round((s.firstTry / s.answered) * 100) : 100}% first try</span>
              <span style={{ padding: '14px 18px', borderRadius: 18, border: '2px solid #ff8a3d', color: '#ff8a3d', fontWeight: 800 }}>{s.answered} questions</span>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          padding: '16px clamp(12px,2.5vw,28px) 22px',
          background: `linear-gradient(${fb ? (ok ? 'rgba(47,224,181,.16)' : 'rgba(255,91,107,.14)') : 'transparent'},${fb ? (ok ? 'rgba(47,224,181,.16)' : 'rgba(255,91,107,.14)') : 'transparent'}),var(--bg)`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: `2px solid ${fb ? (ok ? '#2fe0b5' : '#ff5b6b') : 'var(--hair)'}`,
          transition: 'background .25s',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {(fb || s.out) && (
              <>
                <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: ok ? '#13b48c' : '#ff5b6b' }}>{fbTitle}</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--body)' }}>{fbText}</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={foot}
            className="jv-3d"
            style={{ minWidth: 160, padding: '15px 26px', borderRadius: 16, border: 'none', ...btn3d(btnBg, btnSh), color: waiting ? 'var(--faint)' : '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, letterSpacing: '.04em', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
      {confetti && (
        <div style={{ position: 'fixed', left: '50%', top: '40%', pointerEvents: 'none', zIndex: 100 }}>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              style={{ position: 'absolute', width: c.s, height: c.h, borderRadius: 3, background: c.col, ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px`, animation: 'jv-burst 1.5s cubic-bezier(.2,.8,.3,1) forwards' } as CSSProperties}
            />
          ))}
        </div>
      )}
    </>
  )
}
