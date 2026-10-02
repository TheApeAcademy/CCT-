import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookMarked,
  BookOpen,
  Bot,
  CalendarDays,
  CalendarRange,
  Calendar,
  ChartNoAxesColumn,
  CheckCheck,
  ClipboardCheck,
  Database,
  Dumbbell,
  Ear,
  FileText,
  Flame,
  Gamepad2,
  Globe,
  History,
  IdCard,
  Inbox,
  Layers,
  Link2,
  Lock,
  Mail,
  Map,
  MessageCircle,
  Monitor,
  Moon,
  Music,
  NotebookPen,
  Phone,
  Presentation,
  School,
  ShieldCheck,
  Sparkles,
  Split,
  Star,
  Sun,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { isMuted, setMuted } from '../lib/sound'
import { blip, rng, useDesignFx } from '../design/fx'
import '../design/landing.css'

// The landing page, rebuilt from the Claude Design handoff
// (Landing Page v3.dc.html): night sky with a day toggle, a four-slide hero
// carousel, a playable ten-question Bible Quiz, Everything Inside, the
// dashboard intros, the village preview, About, Contact, the kids sign-in
// band, the two grown-up doors and the footer. It brings its own floating
// header and footer, so Layout draws neither on this route.

const DISPLAY = "'Bricolage Grotesque',sans-serif"

const QUESTIONS = [
  { q: 'Who built the ark to survive the great flood?', a: ['Moses', 'Noah', 'David', 'Abraham'], c: 1, h: 'He had three sons: Shem, Ham and Japheth.' },
  { q: 'How many disciples did Jesus choose?', a: ['7', '10', '12', '40'], c: 2, h: 'The same number as the tribes of Israel.' },
  { q: 'Who was swallowed by a great fish?', a: ['Jonah', 'Peter', 'Elijah', 'Paul'], c: 0, h: 'He was trying to run away from going to Nineveh.' },
  { q: 'What did David use to defeat Goliath?', a: ['A sword', 'A spear', 'A sling and a stone', 'A bow'], c: 2, h: 'He picked five smooth things from a brook.' },
  { q: 'Where was Jesus born?', a: ['Nazareth', 'Bethlehem', 'Jerusalem', 'Egypt'], c: 1, h: 'It’s called the city of David.' },
  { q: 'Who was thrown into the lions’ den?', a: ['Daniel', 'Joseph', 'Samuel', 'Jonah'], c: 0, h: 'He prayed three times a day toward Jerusalem.' },
  { q: 'What did God create on the first day?', a: ['Animals', 'Light', 'Plants', 'People'], c: 1, h: '“Let there be…”' },
  { q: 'Who led Israel out of Egypt?', a: ['Joshua', 'Aaron', 'Moses', 'Abraham'], c: 2, h: 'He spoke to God at a burning bush.' },
  { q: 'Which queen saved her people from Haman?', a: ['Esther', 'Ruth', 'Deborah', 'Sheba'], c: 0, h: '“For such a time as this.”' },
  { q: 'How many days and nights did it rain during the flood?', a: ['7', '12', '40', '100'], c: 2, h: 'Jesus also fasted this many days.' },
]
const QTIME = 15
const POLL = [
  [8, 74, 12, 6],
  [5, 9, 79, 7],
  [81, 7, 8, 4],
  [6, 8, 80, 6],
  [12, 76, 8, 4],
  [83, 7, 6, 4],
  [9, 78, 8, 5],
  [7, 10, 77, 6],
  [79, 10, 7, 4],
  [6, 9, 80, 5],
]

const PLACES = [
  { id: 'class', label: 'My Class', img: '/village/class-house1.png', x: 34, y: 18, w: 30, h: 16.8, tilt: -4, blurb: 'Your teacher, today’s lecture and this week’s assignment.' },
  { id: 'messages', label: 'My Teacher', img: '/village/messages-teacherhome.png', x: 75, y: 17, w: 27, h: 13.4, tilt: 4, blurb: 'Send a message straight to your class teacher.' },
  { id: 'ears', label: 'Ears for You', img: '/village/ears-hearttree.png', x: 17, y: 20, w: 13, h: 8, tilt: -5, blurb: 'A safe, private place to share what’s on your mind.' },
  { id: 'game', label: 'Games', img: '/village/game-rocket.png', x: 73, y: 31, w: 16, h: 8.7, tilt: -5, blurb: 'Jump into Practice Mode or a live Bible Quiz.' },
  { id: 'profile', label: 'My Card', img: '/village/profile-card.png', x: 38, y: 48, w: 16, h: 9.1, tilt: -6, blurb: 'Your photo, bio, favourite verse and digital ID card.' },
  { id: 'bible', label: 'Sunday School', img: '/village/bible-book.png', x: 81, y: 59, w: 22, h: 13, tilt: 3, blurb: 'Today’s Bible reading and your streak.' },
  { id: 'home', label: 'My House', img: '/village/home-brickbuilding.png', x: 33, y: 79, w: 42, h: 21.3, tilt: 2, blurb: 'Your points, your rank and everything in one place.' },
  { id: 'leaderboard', label: 'Leaderboard', img: '/feature-leaderboard.png', x: 77, y: 87, w: 16, h: 11.5, tilt: 5, blurb: 'See where you stand in your class this week.' },
]

const BADGES: { icon: LucideIcon; label: string; g: string }[] = [
  { icon: Trophy, label: 'First Match', g: 'linear-gradient(135deg,#ffd84d,#f0a400)' },
  { icon: Flame, label: '7-Day Streak', g: 'linear-gradient(135deg,#ff9a4d,#ff5b3a)' },
  { icon: Star, label: 'Perfect Score', g: 'linear-gradient(135deg,#6fa8ff,#4f5bff)' },
  { icon: Award, label: 'Top of Class', g: 'linear-gradient(135deg,#e07bff,#9c2bb0)' },
]

const r = rng(11)
const STARS = Array.from({ length: 50 }, () => ({
  x: +(r() * 100).toFixed(1),
  x2: +(r() * 100).toFixed(1),
  y: +(r() * 90).toFixed(1),
  y2: +(r() * 100).toFixed(1),
  s: r() > 0.85 ? 3 : 2,
  d: +(1.6 + r() * 2.6).toFixed(2),
  dl: +(-r() * 3).toFixed(2),
}))
const MINI = STARS.slice(0, 18).map((s) => ({ ...s, y: s.y2 }))
const COLS = ['#ffc93c', '#ff4fa3', '#4f7bff', '#2fe0b5', '#c13bff', '#ff8a3d']
const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2
  const d = 90 + r() * 110
  return {
    dx: Math.round(Math.cos(a) * d),
    dy: Math.round(Math.sin(a) * d - 40),
    s: 7 + Math.round(r() * 5),
    h: 9 + Math.round(r() * 8),
    col: COLS[i % COLS.length],
  }
})

type Cta = { label: string; to: string }
const SLIDES: { t1: string; t2: string; body: string; p1: Cta; p2?: Cta; quote?: [string, string]; img: string }[] = [
  {
    t1: 'MFM Children’s',
    t2: 'Ministry',
    body: 'Raising children in the Word through classes, a Bible Quiz built for the ministry, and a place every child in this church can call theirs.',
    p1: { label: 'Apply as a Child', to: '/join' },
    p2: { label: 'Apply to Teach', to: '/teacher' },
    quote: ['But upon mount Zion shall be deliverance, and there shall be holiness', 'Obadiah 1:17'],
    img: '/hero-kids.jpg',
  },
  {
    t1: 'Know the Word.',
    t2: 'Play the Quiz.',
    body: 'Live trivia on the shared screen, team lifelines, seasons and a leaderboard that means something. Every question is a chance to know Scripture a little better.',
    p1: { label: 'Host a Match', to: '/setup' },
    p2: { label: 'Practice Mode', to: '/training' },
    img: '/hero-quiz.jpg',
  },
  {
    t1: 'Nourish Your Soul.',
    t2: 'Read Daily.',
    body: 'A short Bible reading and a streak that keeps count. Come back tomorrow and it grows, right there on your own dashboard.',
    p1: { label: 'Apply as a Child', to: '/join' },
    quote: ['Thy word have I hid in mine heart, that I might not sin against thee', 'Psalm 119:11'],
    img: '/hero-bible.jpg',
  },
  {
    t1: 'Our Sunday School',
    t2: 'Teachers',
    body: 'Real classrooms, real teachers, approved by the ministry and ready to walk with your child through the Word, every single week.',
    p1: { label: 'Apply to Teach', to: '/teacher' },
    p2: { label: 'Apply as a Child', to: '/join' },
    img: '/hero-teachers.jpg',
  },
]

type Feature = { icon: LucideIcon; title: string; to?: string }
const GROUPS: { eyebrow: string; color: string; delay: string; items: Feature[] }[] = [
  {
    eyebrow: 'For the Children',
    color: '#ff6b9a',
    delay: '0.00',
    items: [
      { icon: Map, title: 'Village Map', to: '/student' },
      { icon: BookOpen, title: 'Bible Journey', to: '/student' },
      { icon: Flame, title: 'Streaks, XP and Badges', to: '/student' },
      { icon: Layers, title: 'Bible Character Collection', to: '/student' },
      { icon: Gamepad2, title: 'Bible Quiz', to: '/setup' },
      { icon: Trophy, title: 'Leaderboard' },
      { icon: Globe, title: 'Pray for the World' },
      { icon: Ear, title: 'Ears for You' },
      { icon: Sparkles, title: 'Bible Buddy' },
      { icon: NotebookPen, title: 'Prayer Journal and Diary' },
      { icon: IdCard, title: 'Digital ID Card' },
      { icon: Calendar, title: 'Ministry Calendar' },
      { icon: Music, title: 'Anthem', to: '/anthem' },
    ],
  },
  {
    eyebrow: 'For the Teachers',
    color: '#2fe0b5',
    delay: '0.08',
    items: [
      { icon: Users, title: 'Class Roster' },
      { icon: CheckCheck, title: 'Attendance' },
      { icon: Award, title: 'Printable Certificates' },
      { icon: Presentation, title: 'Sunday School Lessons' },
      { icon: ClipboardCheck, title: 'Assignments and Grading' },
      { icon: Inbox, title: 'Ears for You Inbox' },
      { icon: Bot, title: 'Bible Buddy Log' },
      { icon: MessageCircle, title: 'Messaging' },
      { icon: Monitor, title: 'Host a Quiz Match', to: '/setup' },
    ],
  },
  {
    eyebrow: 'For the Ministry',
    color: '#4f9bff',
    delay: '0.16',
    items: [
      { icon: FileText, title: 'Teacher Applications' },
      { icon: School, title: 'Every Class at a Glance' },
      { icon: CalendarRange, title: 'Seasons', to: '/seasons' },
      { icon: BookMarked, title: 'Bible Reading Plans' },
      { icon: CalendarDays, title: 'Ministry Calendar' },
      { icon: ShieldCheck, title: 'Safety and Privacy', to: '/safety' },
      { icon: Database, title: 'Digital Bank' },
    ],
  },
  {
    eyebrow: 'For the Parents',
    color: '#ffc93c',
    delay: '0.24',
    items: [
      { icon: Link2, title: 'Link by Code' },
      { icon: ChartNoAxesColumn, title: 'Per-Child Progress' },
      { icon: Star, title: 'Monthly Star Rating' },
    ],
  },
]
const FEATURE_COUNT = GROUPS.reduce((n, g) => n + g.items.length, 0)

const RESOURCES: { to: string; delay?: string; hov: string; g: string; glow: string; icon: LucideIcon; title: string; body: string }[] = [
  { to: '/training', hov: '#2fe0b5', g: 'linear-gradient(135deg,#2fe0b5,#0e9a80)', glow: 'rgba(47,224,181,.7)', icon: Dumbbell, title: 'Training Mode', body: 'Unlimited solo practice. No teams, no timer, no pressure.' },
  { to: '/seasons', delay: '.05', hov: '#7ee08a', g: 'linear-gradient(135deg,#7ee08a,#3a9e4f)', glow: 'rgba(126,224,138,.7)', icon: CalendarRange, title: 'Seasons', body: 'Every competition season, past and present, in one place.' },
  { to: '/questions', delay: '.1', hov: '#4f9bff', g: 'linear-gradient(135deg,#6fa8ff,#4f5bff)', glow: 'rgba(79,123,255,.7)', icon: BookOpen, title: 'Question Bank', body: 'Add, edit, import, and export trivia questions and sets.' },
  { to: '/history', delay: '.15', hov: '#ff8a3d', g: 'linear-gradient(135deg,#ff9a4d,#e0452a)', glow: 'rgba(255,138,61,.7)', icon: History, title: 'History', body: 'Every completed match, team score, and full recap.' },
  { to: '/anthem', delay: '.2', hov: '#ff4fa3', g: 'linear-gradient(135deg,#ff6bb5,#d12a7a)', glow: 'rgba(255,79,163,.7)', icon: Music, title: 'Anthem', body: "Our children's ministry anthem, with lyrics and a read-aloud." },
]

const SKY_KEY = 'landing-sky'
type Sky = 'night' | 'day'
function readSky(): Sky {
  try {
    return localStorage.getItem(SKY_KEY) === 'day' ? 'day' : 'night'
  } catch {
    return 'night'
  }
}

/** Same-page anchors. The app runs under HashRouter, so a bare href="#about"
 * would be read as a route; this scrolls instead. */
function Anchor({ to, className, style, children }: { to: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  const go = (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById(to)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <a href={`#${to}`} onClick={go} className={className} style={style}>
      {children}
    </a>
  )
}

const pill = (color: string, extra?: CSSProperties): CSSProperties => ({ color, ...extra })

type Quiz = {
  qi: number
  picked: number | null
  score: number
  left: number
  started: boolean
  done: boolean
  used: Record<string, boolean>
  hidden: number[]
  poll: boolean
  hint: boolean
  plus: number | false
  right: number
}
const FRESH: Quiz = { qi: 0, picked: null, score: 0, left: QTIME, started: false, done: false, used: {}, hidden: [], poll: false, hint: false, plus: false, right: 0 }

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const [sky, setSky] = useState<Sky>(readSky)
  const [muted, setMutedState] = useState(isMuted())
  const [slide, setSlide] = useState(0)
  const [place, setPlace] = useState('home')
  const [unlocked, setUnlocked] = useState(0)
  const [quiz, setQuiz] = useState<Quiz>(FRESH)
  const slideTimer = useRef<number | undefined>(undefined)

  useDesignFx(root, `${slide}-${quiz.qi}-${quiz.done}`)

  const startSlides = () => {
    window.clearInterval(slideTimer.current)
    slideTimer.current = window.setInterval(() => {
      if (!document.hidden) setSlide((s) => (s + 1) % SLIDES.length)
    }, 6500)
  }
  useEffect(() => {
    startSlides()
    const badgeTimer = window.setInterval(() => setUnlocked((u) => (u >= 6 ? 0 : u + 1)), 1200)
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.('a,button')) blip()
    }
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.clearInterval(slideTimer.current)
      window.clearInterval(badgeTimer)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [])

  const pick = (i: number) => {
    setQuiz((s) => {
      if (s.picked !== null || s.done) return s
      const Q = QUESTIONS[s.qi]
      const ok = i === Q.c
      const pts = ok ? 50 + Math.round((s.left / QTIME) * 50) : 0
      blip(ok ? 880 : 220)
      return { ...s, picked: i, started: true, score: s.score + pts, right: s.right + (ok ? 1 : 0), plus: ok ? pts : false }
    })
  }

  // The answer clock: a quarter-second tick while a question is live.
  useEffect(() => {
    const t = window.setInterval(() => {
      setQuiz((s) => {
        if (!s.started || s.picked !== null || s.done) return s
        const left = Math.max(0, +(s.left - 0.25).toFixed(2))
        if (left <= 0) return { ...s, picked: -1, plus: false }
        return { ...s, left }
      })
    }, 250)
    return () => window.clearInterval(t)
  }, [])

  const next = () =>
    setQuiz((s) =>
      s.qi + 1 >= QUESTIONS.length
        ? { ...s, done: true }
        : { ...s, qi: s.qi + 1, picked: null, left: QTIME, hidden: [], poll: false, hint: false, plus: false },
    )

  const toggleSky = () => {
    const nextSky: Sky = sky === 'night' ? 'day' : 'night'
    setSky(nextSky)
    try {
      localStorage.setItem(SKY_KEY, nextSky)
    } catch {
      // storage unavailable - the toggle still works for this visit
    }
  }
  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  const S = quiz
  const answered = S.picked !== null
  const Q = QUESTIONS[S.qi]
  const SL = SLIDES[slide]
  const active = PLACES.find((p) => p.id === place) ?? PLACES[6]
  const avX = active.x
  const avY = Math.max(1, active.y - active.h - 9)
  const fbOk = S.picked === Q.c

  const lifelines: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'fifty', label: '50 / 50', icon: Split },
    { id: 'church', label: 'Ask the Church', icon: Users },
    { id: 'friend', label: 'Phone a Friend', icon: Phone },
  ]
  const applyLifeline = (id: string) => {
    if (S.used[id] || answered) return
    const u = { ...S.used, [id]: true }
    if (id === 'fifty') {
      const wrong = [0, 1, 2, 3]
        .filter((x) => x !== Q.c)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
      setQuiz({ ...S, used: u, hidden: wrong, started: true })
    }
    if (id === 'church') setQuiz({ ...S, used: u, poll: true, started: true })
    if (id === 'friend') setQuiz({ ...S, used: u, hint: true, started: true })
  }

  return (
    <div ref={root} data-dc-screen="landing" data-sky={sky}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '14px clamp(12px,3vw,32px)' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            padding: '8px 8px 8px 16px',
            borderRadius: 999,
            background: 'var(--glass)',
            border: '1px solid var(--hair)',
            backdropFilter: 'blur(18px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
          }}
        >
          <Anchor to="top" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, background: '#fff', borderRadius: 999, padding: '4px 12px' }}>
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 40, display: 'block' }} />
          </Anchor>
          <nav className="lp3-nav">
            <Anchor to="top" className="lp3-navlink">
              Home
            </Anchor>
            <Anchor to="about" className="lp3-navlink">
              Who We Are
            </Anchor>
            <Anchor to="inside" className="lp3-navlink">
              What We Do
            </Anchor>
            <Anchor to="resources" className="lp3-navlink">
              Resources
            </Anchor>
            <Anchor to="contact" className="lp3-navlink">
              Contact Us
            </Anchor>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button type="button" onClick={toggleSky} aria-label="Light or dark" className="lp3-round lp3-sky">
              {sky === 'night' ? <Sun aria-hidden style={{ width: 19, height: 19 }} /> : <Moon aria-hidden style={{ width: 19, height: 19 }} />}
            </button>
            <button type="button" onClick={toggleMute} aria-label="Sounds" className="lp3-round">
              {muted ? <VolumeX aria-hidden style={{ width: 19, height: 19 }} /> : <Volume2 aria-hidden style={{ width: 19, height: 19 }} />}
            </button>
            <a href="https://www.mountainoffire.org/live" target="_blank" rel="noopener noreferrer" className="lp3-live">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5b6b', boxShadow: '0 0 10px #ff5b6b' }} />
              LIVE
            </a>
            <Link to="/join" className="lp3-join">
              Join
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section
        id="top"
        data-screen-label="Hero"
        style={{ position: 'relative', minHeight: '100vh', padding: '150px clamp(16px,4vw,40px) 60px', overflow: 'hidden', textAlign: 'center' }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '-10%',
            width: 1100,
            height: 900,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%,rgba(193,59,255,.55),rgba(156,43,176,.25) 40%,transparent 70%)',
            filter: 'blur(40px)',
            opacity: 'var(--orb)',
            animation: 'lp3-orb 14s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            top: '30%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(255,201,60,.35),transparent 65%)',
            filter: 'blur(40px)',
            opacity: 'var(--orb)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, opacity: 'var(--starop)', transition: 'opacity .6s', pointerEvents: 'none' }}>
          {STARS.map((st, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: st.s,
                height: st.s,
                borderRadius: '50%',
                background: '#fff',
                animation: `lp3-twinkle ${st.d}s ease-in-out infinite`,
                animationDelay: `${st.dl}s`,
              }}
            />
          ))}
        </div>

        <FloatImg par={30} pos={{ left: '6%', top: '22%', width: 'clamp(80px,11vw,150px)' }} src="/feature-quiz.png" r={-12} anim="lp3-bob 5s ease-in-out infinite" />
        <FloatImg par={-40} pos={{ right: '5%', top: '18%', width: 'clamp(110px,15vw,210px)' }} src="/feature-rocket.png" r={8} anim="lp3-bob 4s ease-in-out infinite" delay="-1s" />
        <FloatImg par={50} pos={{ left: '10%', top: '58%', width: 'clamp(80px,10vw,140px)' }} src="/feature-bible.png" r={-6} anim="lp3-bob 6s ease-in-out infinite" delay="-2s" />
        <FloatImg par={-25} pos={{ right: '9%', top: '56%', width: 'clamp(70px,9vw,120px)' }} src="/feature-leaderboard.png" r={10} anim="lp3-bob 4.6s ease-in-out infinite" delay="-.6s" />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 980, margin: '0 auto' }}>
          <span
            data-reveal="1"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px 8px 10px',
              borderRadius: 999,
              background: 'var(--glass)',
              border: '1px solid var(--hair)',
              backdropFilter: 'blur(10px)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2fe0b5', animation: 'lp3-ping 1.6s infinite' }} />
            MFM Wuye · Children&apos;s Ministry
          </span>
          <div key={slide} style={{ animation: 'lp3-slideIn .7s cubic-bezier(.2,.9,.2,1) both' }}>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 'clamp(48px,9vw,128px)',
                lineHeight: 0.9,
                letterSpacing: '-.045em',
                color: 'var(--ink)',
                margin: '28px 0 0',
                textWrap: 'balance',
              }}
            >
              {SL.t1}
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg,#ffc93c,#ff6b9a,#c13bff,#4f7bff,#ffc93c)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  animation: 'lp3-shine 6s linear infinite',
                }}
              >
                {SL.t2}
              </span>
            </h1>
            <p style={{ fontSize: 'clamp(17px,1.6vw,21px)', lineHeight: 1.6, margin: '30px auto 0', maxWidth: 640, textWrap: 'pretty' }}>{SL.body}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 36 }}>
              <Link to={SL.p1.to} className="lp3-cta">
                {SL.p1.label} <ArrowRight aria-hidden style={{ width: 18, height: 18, color: '#fff' }} />
              </Link>
              {SL.p2 && (
                <Link to={SL.p2.to} className="lp3-glass">
                  {SL.p2.label}
                </Link>
              )}
            </div>
            {SL.quote && (
              <p style={{ margin: '26px 0 0', fontSize: 15, fontStyle: 'italic', color: 'var(--muted)' }}>
                &ldquo;{SL.quote[0]}&rdquo; - {SL.quote[1]}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 26 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => {
                  setSlide(i)
                  startSlides()
                }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: i === slide ? 46 : 10,
                  height: 10,
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--hair)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width .4s cubic-bezier(.34,1.56,.64,1)',
                }}
              >
                <span
                  key={i === slide ? `on-${slide}` : 'off'}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg,#c13bff,#ffc93c)',
                    transformOrigin: 'left',
                    transform: `scaleX(${i < slide ? 1 : 0})`,
                    animation: i === slide ? 'lp3-slideFill 6.5s linear forwards' : 'none',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div data-reveal="1" data-delay=".15" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '64px auto 0' }}>
          <div
            data-tilt="4"
            style={{
              position: 'relative',
              borderRadius: 36,
              overflow: 'hidden',
              aspectRatio: '21/9',
              minHeight: 260,
              border: '1px solid var(--hair)',
              boxShadow: '0 40px 100px -30px rgba(120,20,180,.6)',
              transition: 'transform .4s ease-out',
            }}
          >
            {SLIDES.map((x, i) => (
              <img
                key={x.img}
                src={x.img}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 35%',
                  opacity: i === slide ? 1 : 0,
                  transform: `scale(${i === slide ? 1.06 : 1})`,
                  transition: 'opacity 1s ease,transform 6s ease-out',
                }}
              />
            ))}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(13,6,24,.7))' }} />
          </div>
          <StatCard
            style={{ left: 'clamp(-10px,-2vw,-30px)', top: '18%', animation: 'lp3-bob 5s ease-in-out infinite', ['--r' as string]: '-2deg' }}
            tile="linear-gradient(135deg,#ff9a4d,#ff5b3a)"
            icon={<Flame aria-hidden style={{ width: 22, height: 22, color: '#fff' }} />}
            title={
              <>
                <span data-count="7">7</span>-day streak
              </>
            }
            sub="Daily Bible reading"
          />
          <StatCard
            style={{ right: 'clamp(-10px,-2vw,-30px)', top: '8%', animation: 'lp3-bob 6s ease-in-out infinite', animationDelay: '-2s', ['--r' as string]: '2deg' }}
            tile="linear-gradient(135deg,#ffd84d,#f0a400)"
            icon={<Trophy aria-hidden style={{ width: 22, height: 22, color: '#2a1b47' }} />}
            title="#1 this week"
            sub={
              <>
                <span data-count="480">480</span> quiz points
              </>
            }
          />
          <div
            style={{
              position: 'absolute',
              right: '8%',
              bottom: -24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderRadius: 999,
              background: '#2fe0b5',
              color: '#05261d',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 14px 30px -10px rgba(47,224,181,.7)',
              animation: 'lp3-bob 4.4s ease-in-out infinite',
              animationDelay: '-1s',
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#05261d' }} />
            <span data-count="12">12</span> in class right now
          </div>
        </div>
      </section>

      {/* ---------- marquee ---------- */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(90deg,#8a1fb0,#c13bff,#ff4fa3,#ff8a3d)',
          padding: '22px 0',
          overflow: 'hidden',
          transform: 'rotate(-1.5deg)',
          margin: '30px -20px 0',
          boxShadow: '0 20px 50px -20px rgba(193,59,255,.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            animation: 'lp3-marquee 30s linear infinite',
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 'clamp(22px,3vw,34px)',
            color: '#fff',
            letterSpacing: '-.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1} style={{ display: 'flex', gap: 40, paddingRight: 40 }}>
              {['Bible Quiz', 'Daily Reading', 'Leaderboard', 'Achievements', 'Your Class', 'Ears For You', 'Seasons'].map((w) => (
                <span key={w} style={{ display: 'contents' }}>
                  <span>{w}</span>
                  <span style={{ color: '#ffd84d' }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- the quiz, playable ---------- */}
      <section id="quiz" data-screen-label="Quiz" style={{ position: 'relative', padding: 'clamp(100px,12vw,160px) clamp(16px,4vw,40px) clamp(60px,8vw,100px)' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
            gap: 'clamp(40px,6vw,90px)',
            alignItems: 'center',
          }}
        >
          <div data-reveal="1">
            <span className="lp3-pill" style={pill('#ffc93c')}>
              The Bible Quiz
            </span>
            <h2 className="lp3-h2" style={{ fontSize: 'clamp(44px,6vw,84px)', lineHeight: 0.92, margin: '22px 0 0', textWrap: 'balance' }}>
              See it before you play it.
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.7, margin: '26px 0 0', maxWidth: 520, textWrap: 'pretty' }}>
              A live question appears, an answer gets picked, the reveal lands, the score moves. That&apos;s the whole match, on
              a shared screen, in teams, with lifelines, run entirely from the Question Bank a teacher builds.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 22, marginTop: 34 }}>
              <Link to="/setup" className="lp3-gold">
                Host a Match
              </Link>
              <Link to="/training" className="lp3-arrow">
                Try Practice Mode <ArrowRight aria-hidden style={{ width: 18, height: 18 }} />
              </Link>
            </div>
          </div>
          <div data-reveal="1" data-delay=".1" style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: -40,
                background: 'radial-gradient(circle at 50% 50%,rgba(193,59,255,.45),transparent 65%)',
                filter: 'blur(30px)',
                pointerEvents: 'none',
              }}
            />
            <div
              data-tilt="5"
              style={{
                position: 'relative',
                borderRadius: 32,
                padding: 'clamp(20px,3vw,32px)',
                background: 'linear-gradient(160deg,#2b1250 0%,#14082a 100%)',
                border: '1px solid rgba(255,255,255,.14)',
                boxShadow: '0 40px 90px -30px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12)',
                color: '#fff',
                overflow: 'hidden',
                transition: 'transform .4s ease-out',
              }}
            >
              {MINI.map((st, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${st.x}%`,
                    top: `${st.y}%`,
                    width: st.s,
                    height: st.s,
                    borderRadius: '50%',
                    background: '#fff',
                    animation: `lp3-twinkle ${st.d}s infinite`,
                    animationDelay: `${st.dl}s`,
                  }}
                />
              ))}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: 'rgba(255,255,255,.7)' }}>
                  {S.started ? `QUESTION ${S.qi + 1} / ${QUESTIONS.length}` : 'TAP AN ANSWER TO PLAY'}
                </span>
                <span
                  style={{
                    position: 'relative',
                    fontFamily: DISPLAY,
                    fontWeight: 800,
                    fontSize: 20,
                    background: 'linear-gradient(135deg,#ffd84d,#f0a400)',
                    color: '#1a0f2e',
                    borderRadius: 999,
                    padding: '6px 16px',
                  }}
                >
                  {S.score} pts
                  {S.plus !== false && (
                    <span key={S.qi} style={{ position: 'absolute', right: 4, top: -8, fontSize: 20, color: '#2fe0b5', animation: 'lp3-floatup 1.2s ease-out forwards' }}>
                      +{S.plus}
                    </span>
                  )}
                </span>
              </div>
              <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 999, marginTop: 20, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((S.left / QTIME) * 100)}%`,
                    background: 'linear-gradient(90deg,#2fe0b5,#ffc93c,#ff5b3a)',
                    borderRadius: 999,
                    transition: 'width .25s linear',
                  }}
                />
              </div>
              <p
                style={{
                  position: 'relative',
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 'clamp(24px,2.8vw,32px)',
                  lineHeight: 1.12,
                  letterSpacing: '-.02em',
                  margin: '26px 0 22px',
                  textAlign: 'center',
                  textWrap: 'balance',
                }}
              >
                {Q.q}
              </p>
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: 12 }}>
                {Q.a.map((text, i) => {
                  const isC = i === Q.c
                  let bg = 'rgba(255,255,255,.06)'
                  let border = 'rgba(255,255,255,.14)'
                  let chip = 'rgba(255,255,255,.14)'
                  let chipFg = '#fff'
                  let tf = 'none'
                  let op = 1
                  let glow = 'none'
                  if (answered) {
                    if (isC) {
                      bg = 'rgba(47,224,181,.2)'
                      border = '#2fe0b5'
                      chip = '#2fe0b5'
                      chipFg = '#05261d'
                      tf = 'scale(1.04)'
                      glow = '0 0 34px rgba(47,224,181,.45)'
                    } else if (i === S.picked) {
                      bg = 'rgba(255,91,107,.18)'
                      border = '#ff5b6b'
                      chip = '#ff5b6b'
                      tf = 'scale(.98)'
                    } else op = 0.35
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pick(i)}
                      className="lp3-opt"
                      style={
                        {
                          border: `1.5px solid ${border}`,
                          background: bg,
                          color: '#fff',
                          cursor: answered ? 'default' : 'pointer',
                          transform: tf,
                          boxShadow: glow,
                          opacity: op,
                          visibility: S.hidden.includes(i) ? 'hidden' : 'visible',
                          '--hov': answered ? border : '#ffc93c',
                        } as CSSProperties
                      }
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 34,
                          height: 34,
                          borderRadius: 11,
                          background: chip,
                          color: chipFg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        {'ABCD'[i]}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
                      {S.poll && !answered && <span style={{ fontSize: 13, fontWeight: 800, color: '#ffd84d' }}>{POLL[S.qi][i]}%</span>}
                    </button>
                  )
                })}
              </div>
              {answered && fbOk && (
                <div key={`c-${S.qi}`} style={{ position: 'absolute', left: '50%', top: '58%', pointerEvents: 'none' }}>
                  {CONFETTI.map((c, i) => (
                    <span
                      key={i}
                      style={
                        {
                          position: 'absolute',
                          width: c.s,
                          height: c.h,
                          borderRadius: 3,
                          background: c.col,
                          '--dx': `${c.dx}px`,
                          '--dy': `${c.dy}px`,
                          animation: 'lp3-burst 1.1s cubic-bezier(.2,.8,.3,1) forwards',
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
              {S.hint && !answered && (
                <p
                  style={{
                    position: 'relative',
                    margin: '16px 0 0',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: 'rgba(79,123,255,.16)',
                    border: '1px solid rgba(127,160,255,.35)',
                    fontSize: 15,
                    lineHeight: 1.5,
                    textAlign: 'center',
                    animation: 'lp3-fadein .4s both',
                  }}
                >
                  Your friend says: &ldquo;{Q.h}&rdquo;
                </p>
              )}
              {answered && (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginTop: 18,
                    padding: '14px 16px',
                    borderRadius: 18,
                    background: fbOk ? 'rgba(47,224,181,.16)' : 'rgba(255,91,107,.14)',
                    animation: 'lp3-fadein .3s both',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: 16, color: fbOk ? '#5cf0c8' : '#ff8a96' }}>
                    {fbOk ? `Correct! +${S.plus} pts` : S.picked === -1 ? `Time’s up, it was ${Q.a[Q.c]}` : `Not quite, it was ${Q.a[Q.c]}`}
                  </span>
                  <button
                    type="button"
                    onClick={next}
                    style={{
                      padding: '11px 20px',
                      borderRadius: 999,
                      border: 'none',
                      background: '#fff',
                      color: '#1a0f2e',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {S.qi + 1 >= QUESTIONS.length ? 'See results' : 'Next question'}
                  </button>
                </div>
              )}
              {!answered && (
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 22 }}>
                  {lifelines.map(({ id, label, icon: Icon }) => {
                    const used = !!S.used[id]
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => applyLifeline(id)}
                        className="lp3-life"
                        style={
                          {
                            cursor: used ? 'default' : 'pointer',
                            opacity: used ? 0.4 : 1,
                            textDecoration: used ? 'line-through' : 'none',
                            '--hov': used ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.16)',
                          } as CSSProperties
                        }
                      >
                        <Icon aria-hidden style={{ width: 14, height: 14 }} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
              {S.done && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 24,
                    background: 'linear-gradient(160deg,rgba(43,18,80,.97),rgba(20,8,42,.98))',
                    animation: 'lp3-fadein .4s both',
                  }}
                >
                  <Trophy aria-hidden style={{ width: 76, height: 76, color: '#ffd84d' }} />
                  <p style={{ margin: '16px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(30px,3.4vw,42px)', lineHeight: 1 }}>
                    {S.right >= 8 ? 'Bible champion!' : S.right >= 5 ? 'Great job!' : 'Good try!'}
                  </p>
                  <p style={{ margin: '10px 0 0', fontSize: 16, opacity: 0.8 }}>
                    {S.right} of {QUESTIONS.length} right · {S.score} points
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
                    <button
                      type="button"
                      onClick={() => setQuiz({ ...FRESH, started: true })}
                      style={{
                        padding: '13px 22px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,.3)',
                        background: 'transparent',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 15,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Play again
                    </button>
                    <Link
                      to="/training"
                      className="lp3-more"
                      style={{ padding: '13px 22px', borderRadius: 999, background: '#ffc93c', color: '#1a0f2e', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}
                    >
                      More Bible games →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- everything inside ---------- */}
      <section id="everything" data-screen-label="Everything Inside" style={{ position: 'relative', padding: 'clamp(70px,9vw,120px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div data-reveal="1" style={{ maxWidth: 760 }}>
            <span className="lp3-pill" style={pill('#2fe0b5')}>
              Everything Inside
            </span>
            <h2 className="lp3-h2" style={{ fontSize: 'clamp(40px,5.4vw,76px)', lineHeight: 0.95, margin: '20px 0 0' }}>
              <span data-count={FEATURE_COUNT}>{FEATURE_COUNT}</span> things this already does
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.7, margin: '18px 0 0', maxWidth: 620 }}>
              Not a roadmap. Every one of these is built and running today, across the four places people sign in.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))', gap: 18, marginTop: 44 }}>
            {GROUPS.map((g) => (
              <div
                key={g.eyebrow}
                data-reveal="1"
                data-delay={g.delay}
                style={{ padding: '22px 22px 14px', borderRadius: 26, background: 'var(--surf)', border: '1px solid var(--hair)', borderTop: `3px solid ${g.color}` }}
              >
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: g.color }}>{g.eyebrow}</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {g.items.map(({ icon: Icon, title, to }) => {
                    const inner = (
                      <>
                        <Icon aria-hidden style={{ width: 16, height: 16, flexShrink: 0, color: g.color }} />
                        <span style={{ minWidth: 0 }}>{title}</span>
                        {to && <span style={{ marginLeft: 'auto', fontSize: 12, color: g.color }}>→</span>}
                      </>
                    )
                    return to ? (
                      <Link key={title} to={to} className="lp3-feat">
                        {inner}
                      </Link>
                    ) : (
                      <span key={title} className="lp3-feat">
                        {inner}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <Link to="/features" data-reveal="1" className="lp3-outline">
            See what each one does <ArrowRight aria-hidden style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </section>

      {/* ---------- inside the dashboard ---------- */}
      <section id="inside" data-screen-label="Inside" style={{ position: 'relative', padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div data-reveal="1" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ maxWidth: 720 }}>
              <span className="lp3-pill" style={pill('#ff6b9a')}>
                From the Moment You Sign Up
              </span>
              <h2 className="lp3-h2" style={{ fontSize: 'clamp(44px,6vw,84px)', lineHeight: 0.92, margin: '22px 0 0', textWrap: 'balance' }}>
                A dashboard that&apos;s actually theirs
              </h2>
            </div>
            <p style={{ fontSize: 18, lineHeight: 1.7, margin: 0, maxWidth: 400 }}>
              Every child gets their own home base the moment they sign up, no class code needed. Here&apos;s a look at what&apos;s
              waiting inside.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 56 }}>
            <div data-reveal="1" style={{ flex: '2 1 560px', minWidth: 0 }}>
              <div
                data-tilt="4"
                style={{
                  position: 'relative',
                  height: '100%',
                  minHeight: 420,
                  borderRadius: 32,
                  padding: 'clamp(26px,3.4vw,40px)',
                  background: 'linear-gradient(145deg,#ff8a3d 0%,#e0452a 55%,#a8231a 100%)',
                  color: '#fff',
                  overflow: 'hidden',
                  transition: 'transform .4s ease-out',
                  boxSizing: 'border-box',
                }}
              >
                <Glare a={0.22} />
                <img
                  src="/feature-bible.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    right: -30,
                    bottom: -30,
                    width: 'clamp(200px,26vw,320px)',
                    ['--r' as string]: '-8deg',
                    animation: 'lp3-bob 6s ease-in-out infinite',
                    filter: 'drop-shadow(0 30px 40px rgba(80,10,0,.5))',
                  }}
                />
                <div style={{ position: 'relative', maxWidth: 420 }}>
                  <Eyebrow>Today&apos;s Reading</Eyebrow>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(30px,3.4vw,44px)', lineHeight: 1, letterSpacing: '-.03em', margin: '12px 0 0' }}>
                    Nourish your soul, one verse at a time.
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.6, margin: '14px 0 0', opacity: 0.92 }}>
                    A short daily reading, right there on the dashboard. Come back tomorrow and the streak keeps growing.
                  </p>
                  <div
                    style={{
                      marginTop: 24,
                      padding: '18px 20px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,.16)',
                      border: '1px solid rgba(255,255,255,.28)',
                      backdropFilter: 'blur(10px)',
                      maxWidth: 360,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, fontStyle: 'italic' }}>
                      &ldquo;Thy word have I hid in mine heart, that I might not sin against thee.&rdquo;
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', opacity: 0.85 }}>PSALM 119:11</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 800,
                          fontSize: 14,
                          background: '#fff',
                          color: '#c1361f',
                          borderRadius: 999,
                          padding: '5px 12px',
                        }}
                      >
                        <Flame aria-hidden style={{ width: 15, height: 15 }} />
                        <span data-count="7">7</span> days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal="1" data-delay=".08" style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div
                data-tilt="6"
                style={{
                  position: 'relative',
                  height: '100%',
                  minHeight: 420,
                  borderRadius: 32,
                  padding: 'clamp(26px,3vw,34px)',
                  background: 'linear-gradient(160deg,#ffe066 0%,#ffc93c 45%,#f0a400 100%)',
                  color: '#1a0f2e',
                  overflow: 'hidden',
                  transition: 'transform .4s ease-out',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Glare a={0.35} />
                <p style={{ position: 'relative', margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.7 }}>Leaderboard</p>
                <h3 style={{ position: 'relative', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(28px,3vw,38px)', lineHeight: 1, letterSpacing: '-.03em', margin: '12px 0 0' }}>
                  Who&apos;s leading this week?
                </h3>
                <p style={{ position: 'relative', fontSize: 15, lineHeight: 1.55, margin: '12px 0 0', opacity: 0.85 }}>
                  Every quiz point counts toward a real class ranking.
                </p>
                <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 24, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <Podium label={<span data-count="410">410</span>} grow={90} n="2" size={26} delay=".2s" />
                  <Podium
                    label={
                      <>
                        You · <span data-count="480">480</span>
                      </>
                    }
                    grow={140}
                    n="1"
                    size={34}
                    top
                  />
                  <Podium label={<span data-count="360">360</span>} grow={64} n="3" size={22} delay=".4s" />
                </div>
              </div>
            </div>

            <div data-reveal="1" style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div
                data-tilt="6"
                style={{
                  position: 'relative',
                  height: '100%',
                  minHeight: 420,
                  borderRadius: 32,
                  padding: 'clamp(26px,3vw,34px)',
                  background: 'linear-gradient(160deg,#19c99b 0%,#0e9a80 50%,#07665a 100%)',
                  color: '#fff',
                  overflow: 'hidden',
                  transition: 'transform .4s ease-out',
                  boxSizing: 'border-box',
                }}
              >
                <Glare a={0.22} />
                <p style={{ position: 'relative', margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.85 }}>
                  Your Class, Your People
                </p>
                <h3 style={{ position: 'relative', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(28px,3vw,38px)', lineHeight: 1, letterSpacing: '-.03em', margin: '12px 0 0' }}>
                  Your class. Your people. Your journey.
                </h3>
                <img
                  src="/feature-class.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -10,
                    width: '88%',
                    marginLeft: '-44%',
                    animation: 'lp3-bob 5s ease-in-out infinite',
                    filter: 'drop-shadow(0 20px 30px rgba(0,40,30,.5))',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: '46%',
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,.95)',
                    color: '#1a0f2e',
                    boxShadow: '0 12px 30px -10px rgba(0,0,0,.4)',
                    animation: 'lp3-bob 4s ease-in-out infinite',
                    ['--r' as string]: '3deg',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '.1em', opacity: 0.6 }}>TODAY&apos;S LECTURE</p>
                  <p style={{ margin: '2px 0 0', fontWeight: 800, fontSize: 14 }}>Noah &amp; the Great Flood</p>
                </div>
              </div>
            </div>

            <div data-reveal="1" data-delay=".08" style={{ flex: '2 1 560px', minWidth: 0 }}>
              <div
                data-tilt="4"
                style={{
                  position: 'relative',
                  height: '100%',
                  minHeight: 420,
                  borderRadius: 32,
                  padding: 'clamp(26px,3.4vw,40px)',
                  background: 'linear-gradient(145deg,#5b3bff 0%,#7a2bd6 50%,#9c2bb0 100%)',
                  color: '#fff',
                  overflow: 'hidden',
                  transition: 'transform .4s ease-out',
                  boxSizing: 'border-box',
                }}
              >
                <Glare a={0.2} />
                <img
                  src="/feature-achievements.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    right: -10,
                    top: '50%',
                    marginTop: -170,
                    width: 'clamp(180px,22vw,290px)',
                    ['--r' as string]: '6deg',
                    animation: 'lp3-bob 4.6s ease-in-out infinite',
                    filter: 'drop-shadow(0 30px 40px rgba(20,0,60,.5))',
                  }}
                />
                <div style={{ position: 'relative', maxWidth: 440 }}>
                  <Eyebrow>Achievements</Eyebrow>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(30px,3.4vw,44px)', lineHeight: 1, letterSpacing: '-.03em', margin: '12px 0 0' }}>
                    Unlock your next achievement.
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.6, margin: '14px 0 0', opacity: 0.92 }}>
                    Badges for streaks, match wins, and milestones, collected right on your profile for everyone to see.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginTop: 28, maxWidth: 380 }}>
                    {BADGES.map((b, i) => {
                      const on = i < unlocked
                      const Icon = on ? b.icon : Lock
                      return (
                        <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: '100%',
                              aspectRatio: '1/1',
                              borderRadius: 22,
                              background: on ? b.g : 'rgba(255,255,255,.1)',
                              border: '1px solid rgba(255,255,255,.25)',
                              boxShadow: on ? '0 12px 30px -8px rgba(255,255,255,.35)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: on ? 'scale(1.08)' : 'scale(.94)',
                              transition: 'all .5s cubic-bezier(.34,1.8,.64,1)',
                            }}
                          >
                            <Icon aria-hidden style={{ width: '42%', height: '42%', color: on ? '#fff' : 'rgba(255,255,255,.5)' }} />
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{b.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal="1" style={{ flex: '1 1 100%', minWidth: 0 }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 32,
                  padding: 'clamp(28px,4vw,48px)',
                  background: 'linear-gradient(135deg,#0f2a5c,#0a1636)',
                  color: '#fff',
                  overflow: 'hidden',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 'clamp(20px,4vw,48px)',
                }}
              >
                <img src="/feature-ears.png" alt="" style={{ width: 'clamp(100px,12vw,150px)', borderRadius: 28, animation: 'lp3-bob 6s ease-in-out infinite' }} />
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7fb4ff' }}>Ears For You</p>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(30px,3.6vw,48px)', lineHeight: 1, letterSpacing: '-.03em', margin: '10px 0 0' }}>
                    You can talk to us.
                  </h3>
                  <p style={{ fontSize: 17, lineHeight: 1.6, margin: '12px 0 0', maxWidth: 560, color: 'rgba(230,238,255,.85)' }}>
                    A safe, private line to your class teacher, for whenever something&apos;s on your mind. No pressure, no judgement,
                    just a place to be heard.
                  </p>
                </div>
                <Link to="/join" className="lp3-talk">
                  <MessageCircle aria-hidden style={{ width: 18, height: 18 }} />
                  Talk to Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- the kids village ---------- */}
      <section
        data-screen-label="Village"
        style={{
          position: 'relative',
          padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,40px)',
          background:
            'radial-gradient(ellipse 60% 50% at 80% 20%,rgba(193,59,255,.35),transparent 60%),radial-gradient(ellipse 50% 50% at 10% 90%,rgba(47,224,181,.18),transparent 60%),linear-gradient(180deg,#0d0618,#1b0a33 50%,#0d0618)',
          color: 'rgba(236,230,250,.8)',
          overflow: 'hidden',
        }}
      >
        {STARS.map((st, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${st.x2}%`,
              top: `${st.y2}%`,
              width: st.s,
              height: st.s,
              borderRadius: '50%',
              background: '#fff',
              animation: `lp3-twinkle ${st.d}s ease-in-out infinite`,
              animationDelay: `${st.dl}s`,
            }}
          />
        ))}
        <div
          style={{
            position: 'relative',
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
            gap: 'clamp(40px,6vw,90px)',
            alignItems: 'center',
          }}
        >
          <div data-reveal="1">
            <span className="lp3-pill" style={pill('#2fe0b5', { borderColor: 'rgba(255,255,255,.16)' })}>
              The Kids Village
            </span>
            <h2 className="lp3-h2" style={{ fontSize: 'clamp(44px,6vw,84px)', lineHeight: 0.92, color: '#fff', margin: '22px 0 0', textWrap: 'balance' }}>
              A whole world,{' '}
              <span style={{ background: 'linear-gradient(90deg,#2fe0b5,#ffc93c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                one tap away.
              </span>
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.7, margin: '24px 0 0', maxWidth: 500 }}>
              Every part of the dashboard lives in its own place on the village map. Tap a spot and your avatar walks over.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 30, maxWidth: 540 }}>
              {PLACES.map((p) => {
                const on = p.id === place
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlace(p.id)}
                    className="lp3-chip"
                    style={{
                      border: `1px solid ${on ? '#ffc93c' : 'rgba(255,255,255,.2)'}`,
                      background: on ? '#ffc93c' : 'rgba(255,255,255,.08)',
                      color: on ? '#2a1b47' : '#fff',
                    }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div
              style={{
                marginTop: 24,
                padding: '20px 22px',
                borderRadius: 22,
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                maxWidth: 540,
              }}
            >
              <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '-.02em' }}>{active.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 16, lineHeight: 1.55 }}>{active.blurb}</p>
            </div>
          </div>
          <div data-reveal="1" data-delay=".1" style={{ position: 'relative', width: '100%', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ position: 'absolute', inset: -60, background: 'radial-gradient(circle,rgba(47,224,181,.3),transparent 65%)', filter: 'blur(30px)' }} />
            <div
              style={{
                position: 'relative',
                borderRadius: 44,
                padding: 10,
                background: 'linear-gradient(160deg,#3a2560,#140a24)',
                border: '1px solid rgba(255,255,255,.18)',
                boxShadow: '0 50px 100px -30px rgba(0,0,0,.8)',
              }}
            >
              <div style={{ position: 'relative', borderRadius: 36, overflow: 'hidden', aspectRatio: '24/43', background: '#86cf6e' }}>
                <img src="/kids-village-map.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {PLACES.map((b) => (
                  <div
                    key={b.id}
                    style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, transform: 'translate(-50%,-100%)', zIndex: Math.round(b.y) }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '10%',
                        right: '10%',
                        bottom: '-3%',
                        height: '16%',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at center,rgba(20,15,10,.4),transparent 70%)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPlace(b.id)}
                      aria-label={b.label}
                      className="lp3-bld"
                      style={{ ['--r' as string]: `${b.tilt}deg`, animationDelay: `${-(b.x / 20).toFixed(2)}s` }}
                    >
                      <img src={b.img} alt="" style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.35))' }} />
                    </button>
                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '100%',
                        transform: 'translateX(-50%)',
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        fontWeight: 800,
                        fontSize: 10,
                        letterSpacing: '.04em',
                        textTransform: 'uppercase',
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: b.id === place ? '#ffc93c' : 'rgba(255,255,255,.95)',
                        color: '#1a0f2e',
                        boxShadow: '0 4px 10px rgba(0,0,0,.25)',
                      }}
                    >
                      {b.label}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 30,
                    left: `${avX}%`,
                    top: `${avY}%`,
                    transition: 'left .8s cubic-bezier(.34,1.56,.64,1),top .8s cubic-bezier(.34,1.56,.64,1)',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#c13bff,#8a1fb0)',
                      border: '3px solid #fff',
                      boxShadow: '0 8px 20px rgba(0,0,0,.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'lp3-hop 1.1s ease-in-out infinite',
                      boxSizing: 'border-box',
                    }}
                  >
                    <User aria-hidden style={{ width: 22, height: 22, color: '#fff' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- resources ---------- */}
      <section id="resources" data-screen-label="Resources" style={{ padding: 'clamp(80px,10vw,130px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div data-reveal="1" style={{ maxWidth: 760 }}>
            <span className="lp3-pill" style={pill('#4f9bff')}>
              For Teachers &amp; Children
            </span>
            <h2 className="lp3-h2" style={{ fontSize: 'clamp(40px,5vw,68px)', lineHeight: 0.95, margin: '20px 0 0' }}>
              What Else You Can Do
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 16, marginTop: 44 }}>
            {RESOURCES.map(({ to, delay, hov, g, glow, icon: Icon, title, body }) => (
              <Link key={to} to={to} data-reveal="1" data-delay={delay} data-tilt="8" className="lp3-res" style={{ ['--hov' as string]: hov }}>
                <span
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: g,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 10px 24px -8px ${glow}`,
                  }}
                >
                  <Icon aria-hidden style={{ width: 26, height: 26, color: '#fff' }} />
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 23, letterSpacing: '-.02em' }}>{title}</span>
                  <span style={{ display: 'block', marginTop: 8, fontSize: 15, lineHeight: 1.5, color: 'var(--muted)' }}>{body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- about ---------- */}
      <section id="about" data-screen-label="About" style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,40px) clamp(80px,10vw,130px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div data-reveal="1" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 30 }}>
            <div style={{ flex: '1 1 440px', maxWidth: 760 }}>
              <span className="lp3-pill" style={pill('#ff6b9a')}>
                About the Ministry
              </span>
              <h2 className="lp3-h2" style={{ fontSize: 'clamp(38px,5vw,68px)', lineHeight: 0.95, margin: '20px 0 0', textWrap: 'balance' }}>
                Mountain of Fire and Miracles Ministries
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.7, margin: '22px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
                A full-gospel ministry devoted to revival, holiness, prayer, and deliverance, founded and led by Dr. Daniel Kolawole
                Olukoya as General Overseer, grown into a worldwide ministry with branches across nations, all carrying the same call
                to prayer and holy living.
              </p>
            </div>
            <img
              data-par="-20"
              src="/mfm-logo.png"
              alt="Mountain of Fire and Miracles Ministries"
              style={{ width: 'clamp(140px,18vw,230px)', transition: 'transform .3s ease-out', filter: 'drop-shadow(0 20px 40px rgba(193,59,255,.35))' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, marginTop: 52 }}>
            <ProfileCard
              id="wuye"
              img="/mfm-wuye-building.jpg"
              alt="MFM Wuye branch building"
              tag="Our Branch"
              tagBg="#2fe0b5"
              tagFg="#05261d"
              title="MFM Wuye"
            >
              Carrying the same call to prayer, holiness, and deliverance to its community.
            </ProfileCard>
            <ProfileCard
              id="leadership"
              delay=".08"
              img="/pastor-edwin-etomi.jpg"
              alt="Pastor Edwin Etomi"
              top
              tag="Leadership"
              tagBg="#ffc93c"
              tagFg="#1a0f2e"
              title="Pastor Edwin Etomi"
            >
              Senior Regional Overseer, MFM International Headquarters Annex, Wuye.
            </ProfileCard>
            <ProfileCard
              id="ministry"
              delay=".16"
              img="/children-pastor.jpg"
              alt="Head of the Children's Department"
              top
              tag="This Platform"
              tagBg="#ff6b9a"
              tagFg="#2a0516"
              title="The Children's Ministry"
            >
              Head of Children&apos;s Department: Olusanu Olukunle. This platform exists to serve the ministry directly.
            </ProfileCard>
          </div>
        </div>
      </section>

      {/* ---------- contact ---------- */}
      <section id="contact" data-screen-label="Contact" style={{ padding: '0 clamp(16px,4vw,40px) clamp(60px,8vw,100px)' }}>
        <div
          data-reveal="1"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 28,
            padding: 'clamp(28px,4vw,48px)',
            borderRadius: 30,
            background: 'var(--surf)',
            border: '1px solid var(--hair)',
          }}
        >
          <div style={{ flex: '1 1 360px', maxWidth: 640 }}>
            <span className="lp3-pill" style={pill('#4f9bff')}>
              Contact Us
            </span>
            <h2 className="lp3-h2" style={{ fontSize: 'clamp(34px,4vw,52px)', lineHeight: 1, letterSpacing: '-.035em', margin: '16px 0 0' }}>
              Get In Touch
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, margin: '14px 0 0' }}>
              A direct line to MFM Wuye Children&apos;s Ministry (a branch phone number, email, and service times) is being finalized
              with the ministry and will appear here soon.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderRadius: 20, border: '1px dashed var(--hair)' }}>
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg,#6fa8ff,#4f5bff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mail aria-hidden style={{ width: 22, height: 22, color: '#fff' }} />
            </span>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--ink)', maxWidth: 220 }}>Details coming soon. Check back shortly.</p>
          </div>
        </div>
      </section>

      {/* ---------- kids sign in ---------- */}
      <section id="join" data-screen-label="Sign In" style={{ padding: '0 clamp(12px,2vw,24px) clamp(60px,8vw,100px)' }}>
        <div
          data-reveal="1"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 28,
            padding: 'clamp(28px,4vw,48px)',
            borderRadius: 32,
            background: 'linear-gradient(135deg,rgba(193,59,255,.16),rgba(255,201,60,.1))',
            border: '1px solid var(--hair)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: '1 1 380px' }}>
            <img
              src="/children-ministry-logo-splash.png"
              alt=""
              style={{ width: 'clamp(84px,10vw,120px)', flexShrink: 0, animation: 'lp3-bob 5s ease-in-out infinite', filter: 'drop-shadow(0 14px 20px rgba(110,40,160,.35))' }}
            />
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#c13bff' }}>For Children</p>
              <h2 className="lp3-h2" style={{ fontSize: 'clamp(28px,3.6vw,44px)', lineHeight: 1.02, letterSpacing: '-.03em', margin: '8px 0 0', textWrap: 'balance' }}>
                Know the Word. Play the Quiz. Grow in Faith.
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link to="/join?mode=new" className="lp3-signin">
              I&apos;m new here <ArrowRight aria-hidden style={{ width: 16, height: 16, color: '#fff' }} />
            </Link>
            <Link to="/join?mode=returning" className="lp3-signin-2">
              I&apos;ve signed up before
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- the two grown-up doors ---------- */}
      <section data-screen-label="Doors" style={{ padding: '0 clamp(12px,2vw,24px) clamp(12px,2vw,24px)' }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 40,
            overflow: 'hidden',
            padding: 'clamp(70px,9vw,120px) clamp(20px,4vw,40px)',
            background:
              'radial-gradient(ellipse 60% 80% at 50% 110%,rgba(255,201,60,.35),transparent 60%),radial-gradient(ellipse 70% 60% at 50% -10%,rgba(193,59,255,.5),transparent 65%),#1a0b30',
            color: 'rgba(236,230,250,.85)',
          }}
        >
          {STARS.map((st, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: st.s,
                height: st.s,
                borderRadius: '50%',
                background: '#fff',
                animation: `lp3-twinkle ${st.d}s ease-in-out infinite`,
                animationDelay: `${st.dl}s`,
                pointerEvents: 'none',
              }}
            />
          ))}
          <div style={{ position: 'relative', textAlign: 'center' }} data-reveal="1">
            <span className="lp3-pill" style={pill('#ffd84d', { borderColor: 'rgba(255,255,255,.22)' })}>
              You&apos;ve Seen the World
            </span>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(52px,8vw,112px)', lineHeight: 0.9, letterSpacing: '-.05em', color: '#fff', margin: '18px 0 0' }}>
              Now step inside.
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, margin: '18px auto 0', maxWidth: 460 }}>
              Children sign in higher up this page. These two doors are for the grown ups.
            </p>
          </div>
          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))',
              gap: 20,
              maxWidth: 960,
              margin: '44px auto 0',
            }}
          >
            <Door
              img="/classroom-bible-reading-bg.jpg"
              eyebrow="For Teachers"
              color="#2fe0b5"
              title="Run your class from the Control Centre"
              body="Build the Question Bank, host a match on the shared screen, open a Sunday early, and see where every child in your class has got to."
              to="/teacher"
              cta="Apply to Teach"
            />
            <Door
              img="/hero-kids.jpg"
              eyebrow="For Parents"
              color="#ffc93c"
              title="Follow your child through the week"
              body="Their streak, their lessons, their badges and their attendance, from one code your child reads straight off their own card."
              to="/parent"
              cta="Parent Dashboard"
            />
          </div>
          <div style={{ position: 'relative', textAlign: 'center', marginTop: 34 }}>
            <Link to="/features" className="lp3-underline">
              See everything inside, feature by feature →
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer style={{ padding: 'clamp(56px,7vw,80px) clamp(16px,4vw,40px) 30px', color: 'var(--muted)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 36 }}>
            <div>
              <div style={{ display: 'inline-block', background: '#fff', borderRadius: 18, padding: '8px 14px' }}>
                <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 52, display: 'block' }} />
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 280 }}>
                MFM Wuye&apos;s digital home for children: classes, the Bible Quiz, and a place every child in this church can call
                theirs.
              </p>
            </div>
            <FootCol title="WHO WE ARE">
              <Anchor to="about" className="lp3-foot">
                About the Ministry
              </Anchor>
              <Anchor to="wuye" className="lp3-foot">
                MFM Wuye
              </Anchor>
              <Anchor to="leadership" className="lp3-foot">
                Leadership
              </Anchor>
              <Anchor to="ministry" className="lp3-foot">
                Children&apos;s Ministry
              </Anchor>
            </FootCol>
            <FootCol title="WHAT WE DO">
              <Link to="/setup" className="lp3-foot">
                New Match
              </Link>
              <Link to="/training" className="lp3-foot">
                Training Mode
              </Link>
              <Link to="/seasons" className="lp3-foot">
                Seasons
              </Link>
            </FootCol>
            <FootCol title="RESOURCES">
              <Link to="/questions" className="lp3-foot">
                Question Bank
              </Link>
              <Link to="/history" className="lp3-foot">
                History
              </Link>
              <Link to="/anthem" className="lp3-foot">
                Anthem
              </Link>
              <Anchor to="contact" className="lp3-foot">
                Contact Us
              </Anchor>
            </FootCol>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 52,
              paddingTop: 22,
              borderTop: '1px solid var(--hair)',
              fontSize: 13,
            }}
          >
            <p style={{ margin: 0 }}>© 2026 MFM Children&apos;s Ministry, Wuye.</p>
            <p style={{ margin: 0 }}>Built for Sunday school, works fully offline.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FloatImg({ par, pos, src, r, anim, delay }: { par: number; pos: CSSProperties; src: string; r: number; anim: string; delay?: string }) {
  return (
    <div data-par={par} style={{ position: 'absolute', transition: 'transform .3s ease-out', ...pos }}>
      <img
        src={src}
        alt=""
        style={{ width: '100%', ['--r' as string]: `${r}deg`, animation: anim, animationDelay: delay, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,.4))' }}
      />
    </div>
  )
}

function StatCard({ style, tile, icon, title, sub }: { style: CSSProperties; tile: string; icon: ReactNode; title: ReactNode; sub: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px 12px 12px',
        borderRadius: 20,
        background: 'rgba(20,10,36,.72)',
        border: '1px solid rgba(255,255,255,.14)',
        backdropFilter: 'blur(14px)',
        color: '#fff',
        textAlign: 'left',
        ...style,
      }}
    >
      <span style={{ width: 44, height: 44, borderRadius: 14, background: tile, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span>
        <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, opacity: 0.7, marginTop: 3 }}>{sub}</span>
      </span>
    </div>
  )
}

function Glare({ a }: { a: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,${a}),transparent 40%)`,
        pointerEvents: 'none',
      }}
    />
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.85 }}>{children}</p>
}

function Podium({ label, grow, n, size, delay, top }: { label: ReactNode; grow: number; n: string; size: number; delay?: string; top?: boolean }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 13 }}>{label}</p>
      <div
        data-grow={grow}
        style={{
          height: grow,
          borderRadius: '14px 14px 0 0',
          background: top ? '#1a0f2e' : 'rgba(26,15,46,.18)',
          color: top ? '#ffc93c' : undefined,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          overflow: 'hidden',
          boxSizing: 'border-box',
          transition: `height 1s cubic-bezier(.34,1.56,.64,1)${delay ? ' ' + delay : ''}`,
        }}
      >
        {n}
      </div>
    </div>
  )
}

function ProfileCard({
  id,
  delay,
  img,
  alt,
  top,
  tag,
  tagBg,
  tagFg,
  title,
  children,
}: {
  id: string
  delay?: string
  img: string
  alt: string
  top?: boolean
  tag: string
  tagBg: string
  tagFg: string
  title: string
  children: ReactNode
}) {
  return (
    <div
      id={id}
      data-reveal="1"
      data-delay={delay}
      data-tilt="5"
      style={{
        position: 'relative',
        borderRadius: 30,
        overflow: 'hidden',
        aspectRatio: '4/5',
        minHeight: 380,
        border: '1px solid var(--hair)',
        transition: 'transform .4s ease-out',
        scrollMarginTop: 100,
      }}
    >
      <img src={img} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: top ? 'top' : undefined }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(13,6,24,.92))' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 26, color: '#fff' }}>
        <span
          style={{
            display: 'inline-flex',
            padding: '6px 12px',
            borderRadius: 999,
            background: tagBg,
            color: tagFg,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
          }}
        >
          {tag}
        </span>
        <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, letterSpacing: '-.02em', margin: '12px 0 0' }}>{title}</h3>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: '8px 0 0', color: 'rgba(255,255,255,.82)' }}>{children}</p>
      </div>
    </div>
  )
}

function Door({ img, eyebrow, color, title, body, to, cta }: { img: string; eyebrow: string; color: string; title: string; body: string; to: string; cta: string }) {
  return (
    <div
      data-reveal="1"
      data-tilt="5"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 30,
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.14)',
        transition: 'transform .4s ease-out',
      }}
    >
      <div style={{ margin: '10px 10px 0', borderRadius: 22, overflow: 'hidden', aspectRatio: '16/10' }}>
        <img src={img} alt="" loading="lazy" className="lp3-door-img" />
      </div>
      <div style={{ padding: '20px 24px 26px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color }}>{eyebrow}</p>
        <h3 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, lineHeight: 1.08, color: '#fff' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(236,230,250,.75)' }}>{body}</p>
        <Link to={to} className="lp3-door-btn" style={{ background: color }}>
          {cta} <ArrowRight aria-hidden style={{ width: 15, height: 15, color: '#1a0f2e' }} />
        </Link>
      </div>
    </div>
  )
}

function FootCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: 'var(--ink)', margin: 0 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>{children}</div>
    </div>
  )
}
