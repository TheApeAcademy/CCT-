import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Dice5,
  Dumbbell,
  Gamepad2,
  Grid3x3,
  Layers,
  Map as MapIcon,
  MessageCircleQuestion,
  Mic2,
  Moon,
  Music2,
  Palette,
  PencilLine,
  Play,
  Puzzle,
  Quote,
  Shuffle,
  Sparkles,
  Sun,
  Trophy,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { loadKidsSky, saveKidsSky } from '../lib/kidsSky'
import '../design/arcade.css'

// Bible Arcade, the Games building, rebuilt from the Claude Design handoff.
// The bento of the app's real game doors (Live Match, Practice, SuperBook,
// Question Bank), three mini games that play entirely on the device, and the
// coming-soon row. Mini-game bests are kept on this device; they award no
// points, because points only come from the database.

const DISPLAY = "'Bricolage Grotesque', sans-serif"
const BEST_KEY = 'mfm-arcade-best'

type Hero = 'noah' | 'moses' | 'david' | 'daniel' | 'esther' | 'jonah' | 'elijah' | 'ruth' | 'peter' | 'mary' | 'joseph' | 'samson' | 'paul' | 'solomon' | 'abraham'
const HEROES: Hero[] = ['noah', 'moses', 'david', 'daniel', 'esther', 'jonah', 'elijah', 'ruth', 'peter', 'mary', 'joseph', 'samson', 'paul', 'solomon', 'abraham']
const NAME: Record<Hero, string> = { noah: 'Noah', moses: 'Moses', david: 'David', daniel: 'Daniel', esther: 'Esther', jonah: 'Jonah', elijah: 'Elijah', ruth: 'Ruth', peter: 'Peter', mary: 'Mary', joseph: 'Joseph', samson: 'Samson', paul: 'Paul', solomon: 'Solomon', abraham: 'Abraham' }
const VERSES = [
  { ref: 'Psalm 23:1', w: ['The LORD', 'is my', 'shepherd;', 'I shall', 'not want.'] },
  { ref: 'John 3:16', w: ['For God', 'so loved', 'the world,', 'that he gave', 'his only', 'begotten Son'] },
  { ref: 'Philippians 4:13', w: ['I can', 'do all things', 'through Christ', 'which strengtheneth', 'me.'] },
  { ref: 'Psalm 119:105', w: ['Thy word', 'is a lamp', 'unto my feet,', 'and a light', 'unto my path.'] },
  { ref: 'Genesis 1:1', w: ['In the', 'beginning', 'God created', 'the heaven', 'and the earth.'] },
  { ref: 'Proverbs 3:5', w: ['Trust in', 'the LORD', 'with all', 'thine heart'] },
]
const QUOTES: { q: string; ref: string; a: Hero }[] = [
  { q: 'Whither thou goest, I will go; and where thou lodgest, I will lodge.', ref: 'Ruth 1:16', a: 'ruth' },
  { q: 'Thou comest to me with a sword… but I come to thee in the name of the LORD of hosts.', ref: '1 Samuel 17:45', a: 'david' },
  { q: 'If I perish, I perish.', ref: 'Esther 4:16', a: 'esther' },
  { q: 'My God hath sent his angel, and hath shut the lions’ mouths.', ref: 'Daniel 6:22', a: 'daniel' },
  { q: 'Let my people go.', ref: 'Exodus 5:1', a: 'moses' },
  { q: 'Behold the handmaid of the Lord; be it unto me according to thy word.', ref: 'Luke 1:38', a: 'mary' },
  { q: 'Lord, if it be thou, bid me come unto thee on the water.', ref: 'Matthew 14:28', a: 'peter' },
  { q: 'I have fought a good fight, I have finished my course, I have kept the faith.', ref: '2 Timothy 4:7', a: 'paul' },
  { q: 'Ye thought evil against me; but God meant it unto good.', ref: 'Genesis 50:20', a: 'joseph' },
  { q: 'Take me up, and cast me forth into the sea.', ref: 'Jonah 1:12', a: 'jonah' },
]
type GameId = 'memory' | 'scramble' | 'who'
const GAMES: { id: GameId; t: string; s: string; img: string; Icon: LucideIcon; c1: string }[] = [
  { id: 'memory', t: 'Memory Match', s: 'Flip the cards and find all six pairs of Bible heroes.', img: '/scenes/noah.jpg', Icon: Layers, c1: '#4f7bff' },
  { id: 'scramble', t: 'Verse Scramble', s: 'Tap the words in the right order to rebuild the verse.', img: '/scenes/moses.jpg', Icon: Shuffle, c1: '#ff8a3d' },
  { id: 'who', t: 'Who Said It?', s: 'Beat the clock: guess which Bible hero said each line.', img: '/scenes/esther.jpg', Icon: MessageCircleQuestion, c1: '#ff4fa3' },
]
const SOON: [string, LucideIcon, string][] = [
  ['Bible Word Search', Grid3x3, '/journey/books/proverbs.jpg'],
  ['Memory Match', Layers, '/journey/noah-building-ark.jpg'],
  ['Verse Scramble', Shuffle, '/journey/tower-of-babel.jpg'],
  ['Story Builder', PencilLine, '/journey/books/genesis.jpg'],
  ['Bible Bingo', Puzzle, '/journey/books/numbers.jpg'],
  ['Coloring Book', Palette, '/journey/adam-eve-garden-home.jpg'],
  ['Sing-Along', Music2, '/journey/books/psalms.jpg'],
  ['Guess the Sound', Mic2, '/journey/books/joshua.jpg'],
  ['Roll & Answer', Dice5, '/journey/books/esther.jpg'],
  ['Brain Teasers', Brain, '/journey/books/judges.jpg'],
]

function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
function rng(seed: number) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}
const r = rng(77)
const STARS = Array.from({ length: 34 }, () => ({ x: +(r() * 100).toFixed(1), y: +(r() * 100).toFixed(1), s: r() > 0.8 ? 3 : 2, d: +(1.6 + r() * 2.6).toFixed(2), dl: +(-r() * 3).toFixed(2) }))
const COLS = ['#ffc93c', '#ff4fa3', '#4f7bff', '#2fe0b5', '#c13bff', '#ff8a3d']
const CONFETTI = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2
  const d = 160 + r() * 220
  return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d - 80), s: 8 + Math.round(r() * 6), h: 10 + Math.round(r() * 10), col: COLS[i % COLS.length] }
})

type Bests = Partial<Record<GameId, number>>
const loadBests = (): Bests => {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') as Bests
  } catch {
    return {}
  }
}
const bestLabel = (id: GameId, n: number | undefined) => (n == null ? '-' : id === 'memory' ? `${n} moves` : `${n} pts`)

type MemoryState = { cards: { k: number; h: Hero }[]; open: number[]; done: number[]; moves: number; lock: boolean }
type ScrambleWord = { w: string; k: number }
type ScrambleState = { vs: typeof VERSES; i: number; picked: ScrambleWord[]; pool: ScrambleWord[]; state: 'idle' | 'right' | 'wrong'; shake: number; correct: number; missed: boolean }
type WhoState = { qs: typeof QUOTES; i: number; score: number; ans: Hero | '__none' | null; opts: Hero[]; key: number }
type Win = { title: string; sub: string; score: string; best: string }

const whoOpts = (a: Hero) => shuffle([a, ...shuffle(HEROES.filter((h) => h !== a)).slice(0, 3)])

export default function BibleArcade({ points, onExit }: { points: number; onExit: () => void }) {
  const [sky, setSky] = useState(loadKidsSky)
  const [bests, setBests] = useState(loadBests)
  const [game, setGame] = useState<GameId | null>(null)
  const [m, setM] = useState<MemoryState | null>(null)
  const [sc, setSc] = useState<ScrambleState | null>(null)
  const [w, setW] = useState<WhoState | null>(null)
  const [win, setWin] = useState<Win | null>(null)
  const [confetti, setConfetti] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const timers = useRef<{ t1?: number; t2?: number; wt?: number }>({})
  const gameRef = useRef<GameId | null>(null)
  gameRef.current = game

  const clear = (...k: ('t1' | 't2' | 'wt')[]) => k.forEach((x) => window.clearTimeout(timers.current[x]))
  useEffect(() => () => clear('t1', 't2', 'wt'), [])

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
    saveKidsSky(next)
    playClick()
  }

  const finish = (id: GameId, score: number, sub: string) => {
    clear('wt')
    const prev = bests[id]
    const better = id === 'memory' ? prev == null || score < prev : prev == null || score > prev
    const nextBests = { ...bests, [id]: better ? score : prev }
    setBests(nextBests)
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(nextBests))
    } catch {
      /* the best still shows for this visit */
    }
    haptics.success()
    setWin({ title: better && prev != null ? 'New best!' : 'Well done!', sub, score: bestLabel(id, score), best: bestLabel(id, nextBests[id]) })
    setConfetti(true)
    clear('t2')
    timers.current.t2 = window.setTimeout(() => setConfetti(false), 1500)
  }

  const armWho = () => {
    clear('wt')
    timers.current.wt = window.setTimeout(() => answerWho(null), 10000)
  }

  const wRef = useRef<WhoState | null>(null)
  wRef.current = w

  const answerWho = (h: Hero | null) => {
    const cur = wRef.current
    if (!cur || cur.ans !== null || gameRef.current !== 'who') return
    clear('wt')
    const q = cur.qs[cur.i]
    const ok = h === q.a
    if (ok) haptics.success()
    else haptics.error()
    const next: WhoState = { ...cur, ans: h ?? '__none', score: cur.score + (ok ? 1 : 0) }
    wRef.current = next
    setW(next)
    timers.current.t1 = window.setTimeout(() => {
      if (gameRef.current !== 'who') return
      if (next.i + 1 >= next.qs.length) {
        finish('who', next.score, `You got ${next.score} of 6 right.`)
        return
      }
      const ni = next.i + 1
      const nw = { ...next, i: ni, ans: null, opts: whoOpts(next.qs[ni].a), key: next.key + 1 }
      wRef.current = nw
      setW(nw)
      armWho()
    }, 1300)
  }

  const start = (id: GameId) => {
    clear('wt', 't1')
    playClick()
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setWin(null)
    setGame(id)
    gameRef.current = id
    if (id === 'memory') {
      const pick = shuffle(HEROES).slice(0, 6)
      setM({ cards: shuffle([...pick, ...pick]).map((h, i) => ({ k: i, h })), open: [], done: [], moves: 0, lock: false })
    }
    if (id === 'scramble') {
      const vs = shuffle(VERSES).slice(0, 4)
      setSc({ vs, i: 0, picked: [], pool: shuffle(vs[0].w.map((x, k) => ({ w: x, k }))), state: 'idle', shake: 0, correct: 0, missed: false })
    }
    if (id === 'who') {
      const qs = shuffle(QUOTES).slice(0, 6)
      const fresh: WhoState = { qs, i: 0, score: 0, ans: null, opts: whoOpts(qs[0].a), key: 1 }
      wRef.current = fresh
      setW(fresh)
      armWho()
    }
  }

  const toLobby = () => {
    clear('wt', 't1')
    playClick()
    setGame(null)
    gameRef.current = null
    setWin(null)
  }

  const tapMemory = (k: number) => {
    if (!m || m.lock || m.open.includes(k) || m.done.includes(k)) return
    haptics.tap()
    const open = [...m.open, k]
    if (open.length < 2) return setM({ ...m, open })
    const [a, b] = open.map((x) => m.cards[x].h)
    const moves = m.moves + 1
    if (a === b) {
      const done = [...m.done, ...open]
      setM({ ...m, open: [], done, moves })
      if (done.length === 12) timers.current.t1 = window.setTimeout(() => finish('memory', moves, `All pairs found in ${moves} moves.`), 600)
    } else {
      setM({ ...m, open, moves, lock: true })
      timers.current.t1 = window.setTimeout(() => setM((s) => (s ? { ...s, open: [], lock: false } : s)), 900)
    }
  }

  const checkScramble = () => {
    if (!sc) return
    const v = sc.vs[sc.i]
    if (sc.state === 'right') {
      if (sc.i + 1 >= sc.vs.length) return finish('scramble', sc.correct, `${sc.correct} of 4 verses rebuilt first try.`)
      const ni = sc.i + 1
      playClick()
      return setSc({ ...sc, i: ni, picked: [], pool: shuffle(sc.vs[ni].w.map((x, k) => ({ w: x, k }))), state: 'idle', missed: false })
    }
    if (sc.picked.length !== v.w.length) return
    const ok = sc.picked.every((p, i) => p.k === i)
    if (ok) {
      haptics.success()
      setSc({ ...sc, state: 'right', correct: sc.correct + (sc.missed ? 0 : 1) })
    } else {
      haptics.error()
      setSc({ ...sc, state: 'wrong', shake: sc.shake + 1, missed: true })
    }
  }

  const chip = (bg: string, col: string, children: ReactNode) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999, background: bg, color: col, fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}>{children}</span>
  )
  const pill = (children: ReactNode, style?: CSSProperties) => (
    <span style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--track)', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', ...style }}>{children}</span>
  )
  const h2: CSSProperties = { margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, color: 'var(--ink)', letterSpacing: '-.03em' }
  const backBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px 10px 12px', borderRadius: 999, border: '1px solid var(--hair2)', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }

  const page = (
    <div
      ref={scroller}
      data-dc-screen="arcade"
      data-sky={sky}
      style={{ position: 'fixed', inset: 0, zIndex: 90, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', background: 'radial-gradient(ellipse 60% 40% at 50% 0%,var(--glow),transparent 60%),var(--bg)', color: 'var(--body)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased', transition: 'background .6s,color .6s' }}
    >
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {STARS.map((st, i) => (
          <span key={i} style={{ position: 'fixed', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, opacity: 'var(--starop)', transition: 'opacity .6s', pointerEvents: 'none' }}>
            <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: '#fff', animation: `ar-twinkle ${st.d}s ease-in-out infinite`, animationDelay: `${st.dl}s` }} />
          </span>
        ))}

        <header style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px clamp(12px,2.5vw,28px)', background: 'var(--hdr)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--hair)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {game ? (
              <button type="button" onClick={toLobby} style={backBtn}>
                <ArrowLeft style={{ width: 18, height: 18 }} strokeWidth={2} />
                All games
              </button>
            ) : (
              <button
                type="button"
                className="ar-village"
                onClick={() => {
                  playClick()
                  onExit()
                }}
                style={backBtn}
              >
                <MapIcon style={{ width: 18, height: 18 }} strokeWidth={2} />
                Village
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={toggleSky}
                aria-label="Switch light or dark"
                style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {sky === 'night' ? <Sun style={{ width: 20, height: 20 }} strokeWidth={2} /> : <Moon style={{ width: 20, height: 20 }} strokeWidth={2} />}
              </button>
              {chip(
                'rgba(193,59,255,.14)',
                '#c86be0',
                <>
                  <Zap style={{ width: 18, height: 18 }} strokeWidth={2} />
                  {points.toLocaleString()}
                </>,
              )}
            </div>
          </div>
        </header>

        <main style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: 'clamp(28px,4vw,48px) clamp(12px,2.5vw,28px) 100px' }}>
          {!game && <Lobby bests={bests} start={start} />}

          {game === 'memory' && m && (
            <div style={{ maxWidth: 760, margin: '0 auto', animation: 'ar-up .45s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={h2}>Memory Match</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {pill(`Pairs ${m.done.length / 2} / 6`)}
                  {pill(`Moves ${m.moves}`)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 'clamp(8px,1.6vw,14px)', marginTop: 22 }}>
                {m.cards.map((c) => {
                  const up = m.open.includes(c.k) || m.done.includes(c.k)
                  const done = m.done.includes(c.k)
                  const bd = done ? '#2fe0b5' : m.open.length === 2 && m.open.includes(c.k) ? '#ff5b6b' : '#ffd84d'
                  return (
                    <div key={c.k} style={{ perspective: 900, aspectRatio: '3/4' }}>
                      <button
                        type="button"
                        onClick={() => tapMemory(c.k)}
                        aria-label={up ? NAME[c.h] : 'Card'}
                        style={{ position: 'relative', display: 'block', width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer', transformStyle: 'preserve-3d', transform: up ? 'rotateY(180deg)' : 'none', transition: 'transform .5s cubic-bezier(.34,1.3,.64,1)' }}
                      >
                        <span style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 18, background: 'linear-gradient(150deg,#c13bff,#5a128a)', border: '2px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px -12px rgba(193,59,255,.8)' }}>
                          <Sparkles style={{ width: '36%', height: '36%', color: '#ffd84d' }} strokeWidth={2} />
                        </span>
                        <span style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 18, overflow: 'hidden', background: `url(/scenes/${c.h}.jpg) center/cover`, border: `3px solid ${bd}`, display: 'flex', alignItems: 'flex-end', boxShadow: done ? '0 0 24px rgba(47,224,181,.6)' : 'none' }}>
                          <span style={{ width: '100%', padding: '18px 8px 8px', background: 'linear-gradient(180deg,transparent,rgba(0,0,0,.75))', color: '#fff', fontWeight: 800, fontSize: 'clamp(11px,1.6vw,14px)', textAlign: 'center' }}>{NAME[c.h]}</span>
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {game === 'scramble' && sc && (
            <Scramble
              sc={sc}
              h2={h2}
              pill={pill}
              setSc={setSc}
              check={checkScramble}
            />
          )}

          {game === 'who' && w && (
            <div style={{ maxWidth: 720, margin: '0 auto', animation: 'ar-up .45s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={h2}>Who Said It?</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {pill(`${w.i + 1} / 6`)}
                  {pill(`Score ${w.score}`, { background: 'rgba(255,201,60,.16)', color: '#e0a400' })}
                </div>
              </div>
              <div style={{ marginTop: 18, height: 10, borderRadius: 999, background: 'var(--track)', overflow: 'hidden' }}>
                <div key={w.key} style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2fe0b5,#ffd84d,#ff5b6b)', transformOrigin: 'left', animation: 'ar-drain 10s linear forwards', animationPlayState: w.ans !== null ? 'paused' : 'running' }} />
              </div>
              <div key={`q${w.key}`} style={{ marginTop: 22, padding: '30px 28px', borderRadius: 28, background: 'var(--card)', border: '1px solid var(--hair)', boxShadow: '0 20px 50px -30px var(--sh)', animation: 'ar-pop .4s both' }}>
                <Quote style={{ display: 'block', width: 34, height: 34, color: '#c86be0' }} strokeWidth={2} />
                <p style={{ margin: '12px 0 0', fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 1.25, color: 'var(--ink)', ['textWrap' as string]: 'pretty' } as CSSProperties}>&ldquo;{w.qs[w.i].q}&rdquo;</p>
                <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted)' }}>{w.ans !== null ? w.qs[w.i].ref : 'Who said this?'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 16 }}>
                {w.opts.map((h) => {
                  const q = w.qs[w.i]
                  const right = w.ans !== null && h === q.a
                  const wrong = w.ans === h && h !== q.a
                  const bd = right ? '#2fe0b5' : wrong ? '#ff5b6b' : 'var(--hair2)'
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => answerWho(h)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 20, border: `2px solid ${bd}`, background: right ? 'rgba(47,224,181,.14)' : wrong ? 'rgba(255,91,107,.1)' : 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: 'pointer', textAlign: 'left', transition: 'all .2s', boxShadow: `0 4px 0 ${bd}` }}
                    >
                      <span style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: `url(/scenes/${h}.jpg) center/cover` }} />
                      <span style={{ minWidth: 0 }}>{NAME[h]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {win && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,3,16,.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div role="dialog" aria-label={win.title} style={{ width: '100%', maxWidth: 400, padding: '32px 26px', borderRadius: 32, background: 'linear-gradient(160deg,#3a1660,#170a2c)', border: '1px solid rgba(255,255,255,.16)', textAlign: 'center', color: '#fff', animation: 'ar-pop .5s cubic-bezier(.34,1.56,.64,1) both' }}>
            <Trophy style={{ display: 'block', margin: '0 auto', width: 90, height: 90, color: '#ffd84d', animation: 'ar-bob 2.4s ease-in-out infinite' }} strokeWidth={2} />
            <h2 style={{ margin: '18px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 36, letterSpacing: '-.03em' }}>{win.title}</h2>
            <p style={{ margin: '8px 0 0', fontSize: 16, opacity: 0.8 }}>{win.sub}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
              <span style={{ padding: '10px 16px', borderRadius: 16, background: 'rgba(193,59,255,.2)', color: '#e0a6f5', fontWeight: 800, whiteSpace: 'nowrap' }}>{win.score}</span>
              <span style={{ padding: '10px 16px', borderRadius: 16, background: 'rgba(47,224,181,.18)', color: '#5cf0c8', fontWeight: 800, whiteSpace: 'nowrap' }}>Best: {win.best}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={toLobby} style={{ flex: 1, padding: 14, borderRadius: 16, border: '1px solid rgba(255,255,255,.25)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                All games
              </button>
              <button
                type="button"
                onClick={() => game && start(game)}
                style={{ flex: 1, padding: 14, borderRadius: 16, border: 'none', background: 'linear-gradient(180deg,#ffe066,#f0a400)', boxShadow: '0 4px 0 #9a6a00', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Play again
              </button>
            </div>
          </div>
        </div>
      )}

      {confetti && (
        <div style={{ position: 'fixed', left: '50%', top: '40%', pointerEvents: 'none', zIndex: 100 }}>
          {CONFETTI.map((c, i) => (
            <span key={i} style={{ position: 'absolute', width: c.s, height: c.h, borderRadius: 3, background: c.col, ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px`, animation: 'ar-burst 1.4s cubic-bezier(.2,.8,.3,1) forwards' } as CSSProperties} />
          ))}
        </div>
      )}
    </div>
  )

  return createPortal(page, document.body)
}

const tileBase: CSSProperties = { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', overflow: 'hidden', minHeight: 140, padding: 16, borderRadius: 22, color: '#fff' }
const tint = (c: string, dark: string, op: number) => (
  <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,color-mix(in srgb,${c} 70%,${dark}) 0%,color-mix(in srgb,${c} 15%,${dark}) 100%)`, opacity: op, pointerEvents: 'none' }} />
)
const tileIcon = (Icon: LucideIcon, big?: boolean) => (
  <span style={{ position: 'relative', width: big ? 52 : 38, height: big ? 52 : 38, borderRadius: big ? 16 : 12, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Icon style={{ width: big ? 26 : 18, height: big ? 26 : 18, color: '#fff' }} strokeWidth={2} />
  </span>
)
const tileTitle = (t: string, big?: boolean) => (
  <span style={{ position: 'relative', marginTop: big ? 14 : 10, fontFamily: DISPLAY, fontWeight: 800, fontSize: big ? 32 : 17, lineHeight: 1.02, letterSpacing: '-.02em', textShadow: '0 2px 8px rgba(0,0,0,.35)' }}>{t}</span>
)
const eyebrow: CSSProperties = { margin: '36px 0 12px', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }

function Lobby({ bests, start }: { bests: Bests; start: (id: GameId) => void }) {
  return (
    <div style={{ animation: 'ar-up .5s both' }}>
      <div data-bento="1" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gridTemplateAreas: "'live live live prac prac' 'live live live super bank'", gap: 12 }}>
        {/* There is no join flow for children yet: a teacher runs the match on
            the big screen, so this card says what to do rather than linking
            somewhere that doesn't exist. */}
        <div className="ar-tile" style={{ ...tileBase, gridArea: 'live', justifyContent: 'flex-end', minHeight: 300, padding: 26, borderRadius: 28, boxShadow: '0 22px 44px -26px #ff4fa3' }}>
          <img src="/hero-quiz.jpg" alt="" className="ar-zoom" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {tint('#ff4fa3', '#180a2e', 0.7)}
          {tileIcon(Gamepad2, true)}
          {tileTitle('Bible Quiz Live Match', true)}
          <span style={{ position: 'relative', marginTop: 6, maxWidth: '85%', fontSize: 15, lineHeight: 1.5, opacity: 0.9 }}>Ask your teacher to start a live match! When they do, you&rsquo;ll play along in class.</span>
          <span style={{ position: 'relative', marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 999, background: '#fff', color: '#8a1656', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>Ask your teacher</span>
        </div>
        <Link to="/training" onClick={() => playClick()} className="ar-tile" style={{ ...tileBase, gridArea: 'prac', boxShadow: '0 22px 44px -26px #19c99b' }}>
          <img src="/feature-quiz.png" alt="" style={{ position: 'absolute', right: '-4%', bottom: '-4%', height: '88%', objectFit: 'contain', opacity: 0.95, animation: 'ar-bob 4s ease-in-out infinite', pointerEvents: 'none' }} />
          {tint('#19c99b', '#0b2e1a', 0.86)}
          {tileIcon(Dumbbell)}
          {tileTitle('Practice Bible Quiz')}
          <span style={{ position: 'relative', marginTop: 6, maxWidth: '85%', fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>Unlimited solo practice, no timer.</span>
        </Link>
        <a href="https://id.superbook.cbn.com/games" target="_blank" rel="noopener noreferrer" className="ar-tile" style={{ ...tileBase, gridArea: 'super', boxShadow: '0 22px 44px -26px #c13bff' }}>
          <img src="/trophy-leaderboard.jpg" alt="" className="ar-zoom" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {tint('#c13bff', '#180a2e', 0.7)}
          {tileIcon(Gamepad2)}
          {tileTitle('SuperBook Games')}
        </a>
        <Link to="/questions" onClick={() => playClick()} className="ar-tile" style={{ ...tileBase, gridArea: 'bank', boxShadow: '0 22px 44px -26px #4f9bff' }}>
          <img src="/village/game-rocket.png" alt="" style={{ position: 'absolute', right: '-4%', bottom: '-4%', height: '88%', objectFit: 'contain', opacity: 0.95, animation: 'ar-bob 4s ease-in-out infinite', pointerEvents: 'none' }} />
          {tint('#4f9bff', '#0a1a2e', 0.86)}
          {tileIcon(BookOpen)}
          {tileTitle('Question Bank')}
        </Link>
      </div>

      <p style={eyebrow}>Play now</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 14 }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => start(g.id)}
            className="ar-game"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px 12px 12px', borderRadius: 22, border: '1px solid var(--hair)', background: 'var(--card)', color: 'var(--ink)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', ['--c1' as string]: g.c1 } as CSSProperties}
          >
            <span style={{ position: 'relative', flexShrink: 0, width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: `url(${g.img}) center/cover` }}>
              <span style={{ position: 'absolute', right: 4, bottom: 4, width: 26, height: 26, borderRadius: 8, background: g.c1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <g.Icon style={{ width: 14, height: 14, color: '#fff' }} strokeWidth={2} />
              </span>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 18 }}>{g.t}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 13, lineHeight: 1.4, color: 'var(--muted)' }}>{g.s}</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 800, color: g.c1 }}>Best: {bestLabel(g.id, bests[g.id])}</span>
            </span>
            <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: g.c1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play style={{ width: 16, height: 16, color: '#fff' }} strokeWidth={2} />
            </span>
          </button>
        ))}
      </div>

      <p style={eyebrow}>More Games Coming Soon</p>
      <div className="ar-soon" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollSnapType: 'x mandatory' }}>
        {SOON.map(([t, Icon, photo]) => (
          <div key={t} style={{ flexShrink: 0, width: 128, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', paddingBottom: 12, borderRadius: 20, border: '1px solid var(--hair)', background: 'var(--card)', textAlign: 'center', opacity: 0.8 }}>
            <span style={{ position: 'relative', display: 'block', width: '100%', height: 80, background: `url(${photo}) center/cover` }}>
              <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.25)' }} />
            </span>
            <span style={{ position: 'relative', marginTop: -18, width: 36, height: 36, borderRadius: 12, border: '2px solid var(--card)', background: 'var(--lockbg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 16, height: 16, color: 'var(--muted)' }} strokeWidth={2} />
            </span>
            <span style={{ marginTop: 6, padding: '0 8px', fontSize: 12, fontWeight: 800, lineHeight: 1.2, color: 'var(--ink)' }}>{t}</span>
            <span style={{ marginTop: 6, padding: '2px 8px', borderRadius: 999, background: 'var(--track)', fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--faint)' }}>SOON</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Scramble({
  sc,
  h2,
  pill,
  setSc,
  check,
}: {
  sc: ScrambleState
  h2: CSSProperties
  pill: (c: ReactNode, s?: CSSProperties) => ReactNode
  setSc: (s: ScrambleState) => void
  check: () => void
}) {
  const v = sc.vs[sc.i]
  const used = new Set(sc.picked.map((p) => p.k))
  const ready = sc.picked.length === v.w.length || sc.state === 'right'
  const label = sc.state === 'right' ? (sc.i + 1 >= sc.vs.length ? 'FINISH' : 'NEXT VERSE') : sc.state === 'wrong' ? 'TRY AGAIN' : 'CHECK'
  const bg = sc.state === 'right' ? 'linear-gradient(180deg,#5cf0c8,#13b48c)' : ready ? 'linear-gradient(180deg,#ff9a4d,#e0452a)' : 'var(--track)'
  const sh = sc.state === 'right' ? '#0b7a5e' : ready ? '#8a2a12' : 'transparent'
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', animation: 'ar-up .45s both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={h2}>Verse Scramble</h2>
        {pill(`Verse ${sc.i + 1} / 4`)}
      </div>
      <p style={{ margin: '18px 0 0', fontWeight: 800, color: '#ff8a3d', letterSpacing: '.06em' }}>{v.ref}</p>
      <div
        key={sc.shake}
        style={{
          marginTop: 12,
          minHeight: 130,
          padding: 20,
          borderRadius: 24,
          border: `2px dashed ${sc.state === 'right' ? '#2fe0b5' : sc.state === 'wrong' ? '#ff5b6b' : 'var(--hair2)'}`,
          background: sc.state === 'right' ? 'rgba(47,224,181,.12)' : sc.state === 'wrong' ? 'rgba(255,91,107,.08)' : 'transparent',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignContent: 'flex-start',
          animation: sc.state === 'wrong' ? 'ar-shake .4s' : 'none',
          transition: 'background .3s,border-color .3s',
        }}
      >
        {sc.picked.map((p, i) => (
          <button
            key={p.k}
            type="button"
            onClick={() => sc.state !== 'right' && setSc({ ...sc, picked: sc.picked.filter((_, j) => j !== i), state: 'idle' })}
            style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: '#ff8a3d', boxShadow: '0 4px 0 #a8441a', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: 'pointer', whiteSpace: 'nowrap', animation: 'ar-pop .3s both' }}
          >
            {p.w}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10, minHeight: 56 }}>
        {sc.pool.map((p) => (
          <button
            key={p.k}
            type="button"
            className="ar-word"
            onClick={() => {
              playClick()
              setSc({ ...sc, picked: [...sc.picked, p], state: 'idle' })
            }}
            style={{ padding: '12px 16px', borderRadius: 14, border: '2px solid var(--hair2)', background: 'var(--tile)', boxShadow: '0 4px 0 var(--hair2)', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: 'pointer', whiteSpace: 'nowrap', opacity: used.has(p.k) ? 0.25 : 1, pointerEvents: used.has(p.k) || sc.state === 'right' ? 'none' : 'auto', transition: 'opacity .2s' }}
          >
            {p.w}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          type="button"
          onClick={() => sc.state !== 'right' && setSc({ ...sc, picked: [], state: 'idle' })}
          style={{ padding: '15px 20px', borderRadius: 16, border: '1px solid var(--hair2)', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={check}
          style={{ flex: 1, padding: 15, borderRadius: 16, border: 'none', background: bg, boxShadow: `0 5px 0 ${sh}`, color: ready ? '#fff' : 'var(--faint)', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, letterSpacing: '.04em', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {label}
        </button>
      </div>
    </div>
  )
}
