import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Music,
  Send,
  Sparkles,
  Share2,
  Check,
  Copy,
  BookOpen,
  BookOpenText,
  Flame,
  Award,
  Layers,
  Bot,
  Globe,
  Lock,
  Wallet,
  PenLine,
  Heart,
  HandHeart,
  FileText,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Minus,
  CalendarDays,
  Crown,
  Database,
  SmilePlus,
  Camera,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import BibleJourneyPanel from '../components/BibleJourney'
import BibleArcade from '../components/BibleArcade'
import { NotesSection, DigitalBankSection } from '../components/PersonalVault'
import MinistryCalendarReadOnly from '../components/MinistryCalendarView'
import { SUNDAY_LESSON_THEMES, SUNDAYS_2026, sundayDateKey } from '../content/sundaySchoolCalendar'
import { bibleComUrl } from '../lib/bibleLink'
import { getMyJourneyProgress } from '../lib/journey'
import { BibleCharactersPage, CharacterRevealModal } from '../components/CharacterCollection'
import { lessonArt } from '../content/bibleBookArt'
import StreakScreen from '../components/StreakScreen'
import PrayerJournalPage from '../components/PrayerJournal'
import { listMyPrayers, type Prayer } from '../lib/prayerJournal'
import { getCountryForOffset } from '../content/prayerCountries'
import BibleHelperPage from '../components/BibleHelper'
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  getMyClass,
  getLeaderboard,
  getRankedLeaderboard,
  getOrCreateConversation,
  listMessages,
  sendMessage,
  submitEarsMessage,
  listMyEarsMessages,
  listEarsReplies,
  listPublishedLectures,
  listPublishedAssignments,
  getMySubmission,
  submitAssignment,
  getMyBibleStreak,
  getTodaysBibleReading,
  haveICompletedReading,
  completeBibleReading,
  getMyQuizHistory,
  listMyAchievements,
  listUnlockedSundays,
  listBibleCharacters,
  getOrCreateParentLinkCode,
  type BibleCharacterRow,
  type EarnedAchievement,
  type StudentRow,
  type LeaderboardRow,
  type LeaderboardRange,
  type RankedLeaderboardRow,
  type MessageRow,
  type EarsMessageRow,
  type EarsReplyRow,
  type ClassRow,
  type LectureRow,
  type AssignmentRow,
  type TodaysReading,
} from '../lib/ministry'
import { achievementIcon } from '../lib/achievementIcons'
import { fileToResizedDataUrl } from '../lib/image'
import { renderIdCardPng } from '../lib/idCard'
import { loadKidsDashboardState, saveKidsDashboardState, type KidsTab } from '../lib/kidsDashboardState'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { setLastPortal } from '../lib/lastPortal'
import { rng } from '../design/fx'
import '../design/kids.css'

export default function StudentPortal() {
  const { session, profile, loading, profileError, refreshProfile } = useMinistryAuth()

  // Remembered so an installed home-screen icon can launch straight into
  // /student next time (see the redirect script in index.html), instead of
  // always opening the marketing landing page first.
  useEffect(() => {
    if (session && profile?.role === 'student') setLastPortal('student')
  }, [session, profile])

  if (loading) return <KidsMessage title="Loading…" />
  // Signed in, but the account lookup itself failed. Showing the sign-up
  // screen here would tell a child who has just made an account that they
  // have not got one, so say what actually happened and offer the retry.
  if (session && profileError) {
    return (
      <KidsMessage title="We couldn't load your account" body="You're signed in, but your details didn't come through. Check your connection and try again.">
        <button onClick={refreshProfile} style={pillButton}>
          Try again
        </button>
      </KidsMessage>
    )
  }
  if (!session || profile?.role !== 'student') return <Navigate to="/join?mode=returning" replace />
  return <Dashboard />
}

function KidsMessage({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div data-dc-screen="kids" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 420 }}>
        <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: '#fff' }}>{title}</p>
        {body && <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6 }}>{body}</p>}
        {children && <div style={{ marginTop: 18 }}>{children}</div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

type Tab = KidsTab
type Klass = ClassRow & { teacher_name: string; teacher_avatar: string | null }
type AppKey = 'chat' | 'friends' | 'badges' | 'bank' | 'prayer' | 'diary' | 'calendar' | 'collection' | 'world' | 'buddy'
/** The full-page kids' apps from the handoff, laid over the whole dashboard. */
type KidsPageKey = 'characters' | 'helper' | 'prayer'
const OpenPage = createContext<(page: KidsPageKey) => void>(() => {})
type Go = (id: Tab) => (e?: ReactMouseEvent) => void

const DISPLAY = "'Bricolage Grotesque', sans-serif"
const EASE_SPRING = 'cubic-bezier(.34,1.56,.64,1)'

const pillButton: CSSProperties = {
  padding: '12px 22px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg,#d08af0,#7a2bd6)',
  color: '#fff',
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
}
const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'rgba(236,230,250,.55)',
}
const quietCard: CSSProperties = { borderRadius: 26, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }
const glassCard: CSSProperties = {
  borderRadius: 24,
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
}
const hudGlass: CSSProperties = {
  background: 'rgba(20,10,36,.72)',
  border: '1px solid rgba(255,255,255,.14)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 14px 40px -12px rgba(0,0,0,.6)',
}
const field: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'rgba(0,0,0,.2)',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
}

/** Levels are the design's: one every 100 points, the bar fills toward the next. */
function levelOf(points: number) {
  const p = Math.max(0, points)
  return { level: Math.floor(p / 100) + 1, pct: p % 100 }
}

function firstName(name: string | null | undefined) {
  return (name ?? '').trim().split(/\s+/)[0] || 'friend'
}

function initialOf(name: string | null | undefined) {
  return ((name ?? '').trim().charAt(0) || '?').toUpperCase()
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

/** A picture if there is one, otherwise the first letter on the design's purple. */
function Face({
  url,
  name,
  size,
  radius = '50%',
  background = 'linear-gradient(135deg,#c13bff,#8a1fb0)',
  color = '#fff',
  fontSize,
  style,
  children,
}: {
  url?: string | null
  name: string | null | undefined
  size: number
  radius?: number | string
  background?: string
  color?: string
  fontSize?: number
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <span
      style={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: radius,
        background: url ? '#2a1846' : background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: fontSize ?? Math.round(size * 0.42),
        color,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius, display: 'block' }} />
      ) : (
        initialOf(name)
      )}
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// The village
// ---------------------------------------------------------------------------

/** Ground points are the ones hand-marked on /kids-village-map.jpg. */
const PLACES: { id: Tab; label: string; img: string; x: number; y: number; w: number; h: number; tilt: number }[] = [
  { id: 'class', label: 'My Class', img: '/village/class-house1.png', x: 34, y: 18, w: 30, h: 16.8, tilt: -4 },
  { id: 'messages', label: 'My Teacher', img: '/village/messages-teacherhome.png', x: 75, y: 17, w: 27, h: 13.4, tilt: 4 },
  { id: 'ears', label: 'Ears for You', img: '/village/ears-hearttree.png', x: 17, y: 20, w: 13, h: 8, tilt: -5 },
  { id: 'game', label: 'Games', img: '/village/game-rocket.png', x: 73, y: 31, w: 16, h: 8.7, tilt: -5 },
  { id: 'profile', label: 'My Card', img: '/village/profile-card.png', x: 38, y: 48, w: 16, h: 9.1, tilt: -6 },
  { id: 'bible', label: 'Sunday School', img: '/village/bible-book.png', x: 81, y: 59, w: 22, h: 13, tilt: 3 },
  { id: 'home', label: 'My House', img: '/village/home-brickbuilding.png', x: 33, y: 79, w: 42, h: 21.3, tilt: 2 },
  { id: 'leaderboard', label: 'Leaderboard', img: '/feature-leaderboard.png', x: 77, y: 87, w: 16, h: 11.5, tilt: 5 },
]

const ROOMS: Record<Tab, { t: string; a: string; b: string; g: string; img: string }> = {
  home: { t: 'My House', a: '#5a128a', b: '#c13bff', g: 'rgba(193,59,255,.35)', img: '/village/home-brickbuilding.png' },
  class: { t: 'My Class', a: '#07665a', b: '#19c99b', g: 'rgba(25,201,155,.3)', img: '/village/class-house1.png' },
  bible: { t: 'Sunday School', a: '#a8231a', b: '#ff8a3d', g: 'rgba(255,138,61,.3)', img: '/village/bible-book.png' },
  leaderboard: { t: 'Leaderboard', a: '#a86a00', b: '#ffc93c', g: 'rgba(255,201,60,.3)', img: '/feature-leaderboard.png' },
  profile: { t: 'My Card', a: '#4a2280', b: '#b56bd9', g: 'rgba(181,107,217,.32)', img: '/village/profile-card.png' },
  messages: { t: 'My Teacher', a: '#0b6b5c', b: '#2fe0b5', g: 'rgba(47,224,181,.28)', img: '/village/messages-teacherhome.png' },
  ears: { t: 'Ears for You', a: '#0f2a5c', b: '#4f7bff', g: 'rgba(79,123,255,.3)', img: '/village/ears-hearttree.png' },
  game: { t: 'Games', a: '#8a1656', b: '#ff4fa3', g: 'rgba(255,79,163,.3)', img: '/village/game-rocket.png' },
}

const CONFETTI_COLOURS = ['#ffc93c', '#ff4fa3', '#4f7bff', '#2fe0b5', '#c13bff', '#ff8a3d']
const CONFETTI = (() => {
  const r = rng(5)
  return Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2
    const d = 140 + r() * 200
    return {
      dx: Math.round(Math.cos(a) * d),
      dy: Math.round(Math.sin(a) * d - 60),
      s: 8 + Math.round(r() * 6),
      h: 10 + Math.round(r() * 10),
      col: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    }
  })
})()

function Dashboard() {
  // A sign in always clears this, so a restored room here can only ever be
  // this same child coming back to a reloaded tab.
  const restored = useMemo(() => loadKidsDashboardState(), [])
  const resume = restored?.view === 'tab'
  const reduce = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, [])

  const [tab, setTab] = useState<Tab>(restored?.tab ?? 'home')
  const [zoom, setZoom] = useState(resume)
  const [mounted, setMounted] = useState(resume)
  const [open, setOpen] = useState(resume)
  const [origin, setOrigin] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }))

  const [student, setStudent] = useState<StudentRow | null>(null)
  // My Card used to render nothing at all while this was null; tracking why
  // it is null lets every state draw something.
  const [studentState, setStudentState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [klass, setKlass] = useState<Klass | null>(null)
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [revealCharacter, setRevealCharacter] = useState<BibleCharacterRow | null>(null)
  const [characterCatalog, setCharacterCatalog] = useState<BibleCharacterRow[]>([])
  const [streak, setStreak] = useState(0)
  const [rank, setRank] = useState<number | null>(null)
  const [readToday, setReadToday] = useState(false)
  const [journeyToday, setJourneyToday] = useState(false)
  const [quizToday, setQuizToday] = useState(false)
  const [confetti, setConfetti] = useState(0)
  const [homeApp, setHomeApp] = useState<AppKey | null>(null)
  const [openJourney, setOpenJourney] = useState(false)

  const busy = useRef(false)
  const timers = useRef<number[]>([])
  const roomRef = useRef<HTMLDivElement>(null)
  // A room with its own steps (the Bible Journey, a lesson) registers how to
  // step back one level, and the island's back arrow uses that first.
  const nestedBack = useRef<(() => void) | null>(null)
  const setNested = useCallback((fn: (() => void) | null) => {
    nestedBack.current = fn
  }, [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reduce ? Math.min(ms, 60) : ms))
  }
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  useEffect(() => {
    saveKidsDashboardState({ tab, view: mounted ? 'tab' : 'map' })
  }, [tab, mounted])

  // A character unlock is a DB-side side effect of earning points (see
  // check_character_unlocks() in Supabase) - the frontend only finds out by
  // noticing a new "character_*" achievement that hasn't been celebrated on
  // this device yet.
  const checkForNewCharacterReveal = (earned: EarnedAchievement[], catalog: BibleCharacterRow[]) => {
    if (catalog.length === 0) return
    let celebrated: string[] = []
    try {
      celebrated = JSON.parse(localStorage.getItem('celebrated_characters') ?? '[]')
    } catch {
      celebrated = []
    }
    const newOne = earned.find((a) => a.code.startsWith('character_') && !celebrated.includes(a.code))
    if (!newOne) return
    const key = newOne.code.slice('character_'.length)
    const character = catalog.find((c) => c.key === key)
    if (!character) return
    try {
      localStorage.setItem('celebrated_characters', JSON.stringify([...celebrated, newOne.code]))
    } catch {
      // worst case the same reveal shows again once
    }
    setRevealCharacter(character)
  }

  const load = () => {
    setStudentState('loading')
    getMyStudentProfile()
      .then((row) => {
        setStudent(row)
        setStudentState('ready')
      })
      .catch(() => setStudentState('error'))
    getMyClass()
      .then(setKlass)
      .catch(() => {})
    Promise.all([listMyAchievements(), characterCatalog.length ? Promise.resolve(characterCatalog) : listBibleCharacters()])
      .then(([earned, catalog]) => {
        setAchievements(earned)
        if (catalog !== characterCatalog) setCharacterCatalog(catalog)
        checkForNewCharacterReveal(earned, catalog)
      })
      .catch(() => {})
    // Today's quests. Each read only feeds its own tick, so one failing
    // leaves that box empty rather than breaking the rest.
    getMyBibleStreak()
      .then((n) => setStreak(Number(n) || 0))
      .catch(() => {})
    getTodaysBibleReading()
      .then((r) => (r ? haveICompletedReading(r.reading_id) : false))
      .then(setReadToday)
      .catch(() => {})
    getMyJourneyProgress()
      .then((rows) => setJourneyToday(rows.some((r) => isToday(r.completed_at))))
      .catch(() => {})
    getMyQuizHistory(20)
      .then((rows) => setQuizToday(rows.some((r) => r.finished_at && isToday(r.finished_at))))
      .catch(() => {})
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!student?.id) return
    getRankedLeaderboard('all')
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => b.points - a.points || a.full_name.localeCompare(b.full_name))
        const i = sorted.findIndex((r) => r.student_id === student.id)
        setRank(i === -1 ? null : i + 1)
      })
      .catch(() => {})
  }, [student?.id])

  // My House sits at the bottom of the map, so a child lands at home and
  // scrolls up to find the rest.
  useLayoutEffect(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
  }, [])

  const boom = useCallback(() => {
    setConfetti((c) => c + 1)
    haptics.success()
    timers.current.push(window.setTimeout(() => setConfetti(0), 1400))
  }, [])

  const enter = (id: Tab, cx?: number, cy?: number) => {
    if (busy.current) return
    busy.current = true
    playNav()
    nestedBack.current = null
    setTab(id)
    setOrigin({ x: cx || window.innerWidth / 2, y: cy || window.innerHeight / 2 })
    later(() => setZoom(true), 650)
    later(() => {
      setMounted(true)
      setOpen(false)
    }, 1000)
    later(() => {
      setOpen(true)
      busy.current = false
    }, 1050)
  }

  const switchRoom = (id: Tab) => {
    if (busy.current) return
    if (id === tab) {
      roomRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    busy.current = true
    playNav()
    setOpen(false)
    later(() => {
      nestedBack.current = null
      setTab(id)
      setOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      if (roomRef.current) roomRef.current.scrollTop = 0
    }, 700)
    later(() => {
      setOpen(true)
      busy.current = false
    }, 760)
  }

  const backToMap = () => {
    if (nestedBack.current) {
      playClick()
      nestedBack.current()
      return
    }
    if (busy.current) return
    busy.current = true
    playClick()
    setOpen(false)
    later(() => {
      setMounted(false)
      setZoom(false)
      setHomeApp(null)
      load()
    }, 720)
    later(() => {
      busy.current = false
    }, 1500)
  }

  const go: Go = (id) => (e) => {
    if (mounted) switchRoom(id)
    else enter(id, e?.clientX, e?.clientY)
  }

  /** Opens one of the tablet's apps from anywhere: the room it lives in is My House. */
  const openApp = (key: AppKey) => {
    setHomeApp(key)
    if (mounted && tab === 'home') roomRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    else go('home')()
  }

  const [page, setPage] = useState<KidsPageKey | null>(null)
  const openPage = useCallback((key: KidsPageKey) => {
    playNav()
    setPage(key)
  }, [])
  /** The pages' Village link: back to the map, closing any room on the way. */
  const closePage = () => {
    setPage(null)
    if (mounted) backToMap()
  }

  const active = PLACES.find((p) => p.id === tab) ?? PLACES[6]
  const R = ROOMS[tab]
  const eyebrowFor: Record<Tab, string> = {
    home: `Welcome home, ${firstName(student?.full_name)}`,
    class: klass?.name ?? 'Your class',
    bible: 'Lessons & Reading',
    leaderboard: 'Ministry-wide',
    profile: 'Profile & ID',
    messages: klass?.teacher_name || 'Your teacher',
    ears: 'A safe place',
    game: 'Play & practice',
  }
  const { level, pct } = levelOf(student?.total_points ?? 0)
  const hud: CSSProperties = { opacity: zoom ? 0 : 1, pointerEvents: zoom ? 'none' : 'auto', transition: 'opacity .4s' }

  const quests: { label: string; done: boolean; tail: string; onClick: (e: ReactMouseEvent) => void }[] = [
    { label: "Read today's verse", done: readToday, tail: '+1 day', onClick: (e) => go('bible')(e) },
    {
      label: 'Do a Bible Journey lesson',
      done: journeyToday,
      tail: '+15',
      onClick: (e) => {
        setOpenJourney(true)
        go('bible')(e)
      },
    },
    { label: 'Play a practice quiz', done: quizToday, tail: 'Play', onClick: (e) => go('game')(e) },
  ]

  return (
    <OpenPage.Provider value={openPage}>
    <div
      data-dc-screen="kids"
      // The legacy pieces still nested in here (the Bible Journey, the
      // streak screen, the tablet's vault and notes) paint from the --lp-*
      // tokens, and the village is a night scene.
      data-landing-theme="dark"
      style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: -40,
          background: 'url(/kids-village-map.jpg) center/cover',
          filter: 'blur(28px) saturate(1.2) brightness(.75)',
          transform: 'scale(1.1)',
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 90% at 50% 50%,transparent 40%,rgba(13,6,24,.55) 100%)', pointerEvents: 'none' }}
      />

      {/* ---------- the map ---------- */}
      <div
        style={{
          position: 'relative',
          width: 'min(100vw,920px)',
          margin: '0 auto',
          aspectRatio: '24/43',
          transformOrigin: `${active.x}% ${active.y - active.h / 2}%`,
          transform: zoom ? 'scale(2.6)' : 'scale(1)',
          filter: zoom ? 'blur(6px) brightness(.8)' : 'none',
          transition: 'transform .9s cubic-bezier(.7,0,.2,1),filter .9s ease',
          boxShadow: '0 0 120px 40px rgba(13,6,24,.35)',
        }}
      >
        <img src="/kids-village-map.jpg" alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 60 }}>
          <div style={{ position: 'absolute', top: '12%', left: 0, width: 260, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.55)', filter: 'blur(18px)', animation: 'kv-cloud 60s linear infinite' }} />
          <div style={{ position: 'absolute', top: '44%', left: 0, width: 340, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.4)', filter: 'blur(22px)', animation: 'kv-cloud 85s linear infinite', animationDelay: '-40s' }} />
          <div style={{ position: 'absolute', top: '72%', left: 0, width: 220, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.45)', filter: 'blur(18px)', animation: 'kv-cloud 70s linear infinite', animationDelay: '-20s' }} />
        </div>
        {PLACES.map((p) => {
          const on = p.id === tab
          return (
            <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, transform: 'translate(-50%,-100%)', zIndex: Math.round(p.y) }}>
              <div style={{ position: 'absolute', left: '10%', right: '10%', bottom: '-3%', height: '16%', borderRadius: '50%', background: 'radial-gradient(ellipse at center,rgba(20,15,10,.45),transparent 70%)' }} />
              <span
                aria-hidden="true"
                style={{ position: 'absolute', left: '50%', top: '60%', width: '120%', aspectRatio: '2/1', borderRadius: '50%', border: '3px solid #ffd84d', opacity: on ? 1 : 0, animation: 'kv-ring 1.6s ease-out infinite', pointerEvents: 'none' }}
              />
              <button
                type="button"
                onClick={go(p.id)}
                aria-label={p.label}
                className="kv-place"
                style={
                  {
                    position: 'relative',
                    display: 'block',
                    width: '100%',
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    '--r': `${p.tilt}deg`,
                    animation: 'kv-bob 3.2s ease-in-out infinite',
                    animationDelay: `${-(p.x / 20)}s`,
                  } as CSSProperties
                }
              >
                <img src={p.img} alt="" style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.4))' }} />
              </button>
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '100%',
                  transform: 'translateX(-50%)',
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  fontWeight: 800,
                  fontSize: 'clamp(9px,1.2vw,12px)',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: on ? '#ffd84d' : 'rgba(255,255,255,.95)',
                  color: '#1a0f2e',
                  boxShadow: '0 6px 14px rgba(0,0,0,.3)',
                  transition: 'background .3s',
                }}
              >
                {p.label}
              </span>
            </div>
          )
        })}
        <div
          style={{
            position: 'absolute',
            zIndex: 80,
            left: `${active.x}%`,
            top: `${Math.max(1, active.y - active.h - 8)}%`,
            transition: 'left .7s cubic-bezier(.45,0,.2,1),top .7s cubic-bezier(.45,0,.2,1)',
            pointerEvents: 'none',
          }}
        >
          <Face
            url={student?.avatar_url}
            name={student?.full_name}
            size={52}
            fontSize={20}
            style={{ border: '4px solid #fff', boxShadow: '0 10px 24px rgba(0,0,0,.5)', animation: 'kv-hop .9s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* ---------- HUD ---------- */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '14px clamp(12px,2.5vw,28px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          pointerEvents: 'none',
          opacity: zoom ? 0 : 1,
          transition: 'opacity .4s',
        }}
      >
        <button
          type="button"
          onClick={go('profile')}
          style={{
            pointerEvents: zoom ? 'none' : 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 18px 8px 8px',
            borderRadius: 24,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            ...hudGlass,
          }}
        >
          <Face url={student?.avatar_url} name={student?.full_name} size={54} radius={18} fontSize={24}>
            <span
              style={{
                position: 'absolute',
                right: -6,
                bottom: -6,
                minWidth: 24,
                height: 24,
                borderRadius: 999,
                background: '#ffd84d',
                color: '#1a0f2e',
                border: '2px solid #140a24',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxSizing: 'border-box',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {level}
            </span>
          </Face>
          <span>
            <span style={{ display: 'block', margin: 0, maxWidth: 'calc(100vw - 150px)', fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student?.full_name || 'My Dashboard'}
            </span>
            <span style={{ display: 'block', margin: '1px 0 0', fontSize: 12, color: 'rgba(236,230,250,.6)', whiteSpace: 'nowrap' }}>
              {klass?.name ?? 'No class yet'} · Level {level}
            </span>
            <span style={{ display: 'block', marginTop: 6, width: 150, maxWidth: '100%', height: 6, borderRadius: 999, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2fe0b5,#ffd84d)' }} />
            </span>
          </span>
        </button>
        <div style={{ pointerEvents: zoom ? 'none' : 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ ...hudChip, borderColor: 'rgba(255,201,60,.4)', color: '#ffd84d' }}>
            <Sparkles style={{ width: 18, height: 18 }} strokeWidth={2} />
            {(student?.total_points ?? 0).toLocaleString()}
          </span>
          <span style={{ ...hudChip, borderColor: 'rgba(255,138,61,.4)', color: '#ffab70' }}>
            <Flame style={{ width: 18, height: 18, animation: 'kv-flame 1.2s ease-in-out infinite' }} strokeWidth={2} />
            {streak}
          </span>
          <button type="button" onClick={go('leaderboard')} style={{ ...hudChip, borderColor: 'rgba(255,255,255,.18)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Trophy style={{ width: 18, height: 18 }} strokeWidth={2} />
            {rank ? `#${rank}` : '#-'}
          </button>
        </div>
      </header>

      <div
        style={{
          position: 'fixed',
          left: 'clamp(12px,2.5vw,28px)',
          bottom: 110,
          zIndex: 50,
          width: 'min(300px,calc(100vw - 24px))',
          padding: 16,
          borderRadius: 24,
          boxSizing: 'border-box',
          ...hudGlass,
          ...hud,
        }}
      >
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#ffd84d' }}>Today&apos;s Quests</p>
        {quests.map((q, i) => (
          <button
            key={q.label}
            type="button"
            onClick={q.onClick}
            className="kv-quest"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: 10,
              borderRadius: 14,
              border: 'none',
              background: 'rgba(255,255,255,.05)',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              marginBottom: i < quests.length - 1 ? 6 : 0,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                border: `2px solid ${q.done ? '#2fe0b5' : 'rgba(255,255,255,.3)'}`,
                background: q.done ? '#2fe0b5' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
            >
              <Check style={{ width: 13, height: 13, color: '#05261d', opacity: q.done ? 1 : 0 }} strokeWidth={3} />
            </span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{q.label}</span>
            <span style={{ fontWeight: 800, fontSize: 12, color: '#ffd84d' }}>{q.tail}</span>
          </button>
        ))}
      </div>

      <nav
        className="kv-dock"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 16,
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          gap: 4,
          padding: 8,
          borderRadius: 28,
          background: 'rgba(20,10,36,.78)',
          border: '1px solid rgba(255,255,255,.14)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: '0 20px 50px -14px rgba(0,0,0,.7)',
          maxWidth: 'calc(100vw - 24px)',
          boxSizing: 'border-box',
          overflowX: 'auto',
          ...hud,
        }}
      >
        {PLACES.map((p) => {
          const on = p.id === tab
          return (
            <button
              key={p.id}
              type="button"
              title={p.label}
              aria-label={p.label}
              onClick={go(p.id)}
              className="kv-dockbtn"
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 64,
                height: 64,
                borderRadius: 20,
                border: `1px solid ${on ? '#ffd84d' : 'transparent'}`,
                background: on ? 'rgba(255,216,77,.2)' : 'rgba(255,255,255,.05)',
                cursor: 'pointer',
                padding: 6,
                boxSizing: 'border-box',
              }}
            >
              <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.4))' }} />
            </button>
          )
        })}
      </nav>

      {/* ---------- a room ---------- */}
      {mounted && (
        <div
          ref={roomRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            background: `radial-gradient(ellipse 80% 60% at 80% 0%,${R.g},transparent 60%),#0d0618`,
            clipPath: open ? `circle(150% at ${origin.x}px ${origin.y}px)` : `circle(0px at ${origin.x}px ${origin.y}px)`,
            transition: 'clip-path .75s cubic-bezier(.7,0,.2,1)',
          }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'center', padding: '12px clamp(12px,2.5vw,28px) 0', pointerEvents: 'none' }}>
            <div
              key={tab}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: 'calc(100vw - 24px)',
                padding: '6px 8px 6px 6px',
                borderRadius: 999,
                background: '#000',
                boxShadow: '0 14px 34px -10px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08)',
                color: '#fff',
                animation: `kv-islandIn .7s .3s ${EASE_SPRING} both`,
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                onClick={backToMap}
                aria-label="Back to the village"
                className="kv-island-back"
                style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} strokeWidth={2.25} />
              </button>
              <img src={R.img} alt="" style={{ flexShrink: 0, width: 30, height: 30, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }} />
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.1, paddingRight: 6 }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{R.t}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eyebrowFor[tab]}</span>
              </span>
              <span style={{ flexShrink: 0, width: 10, height: 10, marginRight: 6, borderRadius: '50%', background: `linear-gradient(135deg,${R.a},${R.b})`, boxShadow: `0 0 10px ${R.b}` }} />
            </div>
          </div>
          <div
            key={tab}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '18px clamp(16px,4vw,48px) 80px', animation: 'kv-roomIn .7s .5s cubic-bezier(.2,.9,.2,1) both' }}
          >
            {tab === 'home' && (
              <HomeRoom
                student={student}
                klass={klass}
                achievements={achievements}
                streak={streak}
                rank={rank}
                go={go}
                app={homeApp}
                setApp={setHomeApp}
                openApp={openApp}
              />
            )}
            {tab === 'class' && <ClassRoom klass={klass} student={student} boom={boom} />}
            {tab === 'bible' && (
              <SundayRoom
                klass={klass}
                streak={streak}
                onStreak={setStreak}
                onRead={() => setReadToday(true)}
                boom={boom}
                setNested={setNested}
                openJourney={openJourney}
                onJourneyOpened={() => setOpenJourney(false)}
              />
            )}
            {tab === 'leaderboard' && <LeaderboardRoom myId={student?.id ?? null} />}
            {tab === 'profile' && (
              <CardRoom student={student} state={studentState} klass={klass} onSaved={load} onRetry={load} boom={boom} openApp={openApp} />
            )}
            {tab === 'messages' &&
              (klass ? <MessagesRoom teacherId={klass.teacher_id} teacherName={klass.teacher_name} teacherAvatar={klass.teacher_avatar} /> : <MessagesLockedRoom code={student?.student_code ?? null} />)}
            {tab === 'ears' && <EarsRoom klass={klass} />}
            {tab === 'game' && <BibleArcade points={student?.total_points ?? 0} onExit={backToMap} />}
          </div>
        </div>
      )}

      {confetti > 0 && (
        <div key={confetti} aria-hidden="true" style={{ position: 'fixed', left: '50%', top: '45%', pointerEvents: 'none', zIndex: 100 }}>
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
                  animation: 'kv-burst 1.3s cubic-bezier(.2,.8,.3,1) forwards',
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {page === 'characters' && (
        <BibleCharactersPage
          achievements={achievements}
          points={student?.total_points ?? 0}
          onExit={closePage}
          onGoToJourney={() => {
            setPage(null)
            setOpenJourney(true)
            go('bible')()
          }}
        />
      )}

      {page === 'helper' && (
        <BibleHelperPage
          onExit={closePage}
          onAskTeacher={() => {
            setPage(null)
            go('messages')()
          }}
          onEars={() => {
            setPage(null)
            go('ears')()
          }}
        />
      )}

      {page === 'prayer' && (
        <PrayerJournalPage
          onExit={() => {
            setPage(null)
            go('home')()
          }}
        />
      )}

      {revealCharacter && (
        <CharacterRevealModal
          character={revealCharacter}
          onClose={() => setRevealCharacter(null)}
          onGoToJourney={() => {
            setRevealCharacter(null)
            setOpenJourney(true)
            go('bible')()
          }}
        />
      )}
    </div>
    </OpenPage.Provider>
  )
}

const hudChip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '11px 16px',
  borderRadius: 999,
  background: 'rgba(20,10,36,.72)',
  border: '1px solid',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  fontWeight: 800,
  fontSize: 15,
}

// ---------------------------------------------------------------------------
// My House
// ---------------------------------------------------------------------------

const DOCK_APPS: { key: AppKey; label: string; title: string; icon: LucideIcon; from: string; to: string }[] = [
  { key: 'chat', label: 'Chat', title: 'Chat', icon: Send, from: '#60a5fa', to: '#1d4ed8' },
  { key: 'friends', label: 'Friends', title: 'Friends', icon: Users, from: '#6ee7b7', to: '#047857' },
  { key: 'badges', label: 'Badges', title: 'My Badges', icon: Award, from: '#fde68a', to: '#b45309' },
  { key: 'bank', label: 'Bank', title: 'Digital Bank', icon: Wallet, from: '#c4b5fd', to: '#6d28d9' },
  { key: 'prayer', label: 'Prayer', title: 'Prayer Journal', icon: Heart, from: '#f9a8d4', to: '#be185d' },
  { key: 'diary', label: 'Diary', title: 'Diary', icon: PenLine, from: '#5eead4', to: '#0f766e' },
  { key: 'calendar', label: 'Calendar', title: 'Ministry Calendar', icon: CalendarDays, from: '#fca5a5', to: '#b91c1c' },
  { key: 'collection', label: 'Collection', title: 'My Collection', icon: Layers, from: '#fbcfe8', to: '#9d174d' },
  { key: 'world', label: 'Pray for World', title: 'Pray for the World', icon: Globe, from: '#93c5fd', to: '#1e3a8a' },
  { key: 'buddy', label: 'Bible Buddy', title: 'Bible Buddy', icon: Bot, from: '#a5b4fc', to: '#4338ca' },
]

const BADGE_LOOKS = [
  { bg: 'rgba(255,201,60,.12)', bd: 'rgba(255,201,60,.3)', fg: '#ffd84d', grad: 'linear-gradient(135deg,#ffd84d,#f0a400)', ic: '#1a0f2e' },
  { bg: 'rgba(255,138,61,.12)', bd: 'rgba(255,138,61,.3)', fg: '#ffab70', grad: 'linear-gradient(135deg,#ff9a4d,#ff5b3a)', ic: '#fff' },
  { bg: 'rgba(79,123,255,.12)', bd: 'rgba(79,123,255,.35)', fg: '#9db8ff', grad: 'linear-gradient(135deg,#6fa8ff,#4f5bff)', ic: '#fff' },
]

function HomeRoom({
  student,
  klass,
  achievements,
  streak,
  rank,
  go,
  app,
  setApp,
  openApp,
}: {
  student: StudentRow | null
  klass: Klass | null
  achievements: EarnedAchievement[]
  streak: number
  rank: number | null
  go: Go
  app: AppKey | null
  setApp: (k: AppKey | null) => void
  openApp: (k: AppKey) => void
}) {
  const openPage = useContext(OpenPage)
  const stat = (label: string, value: string, color: string) => (
    <div style={{ padding: 24, ...quietCard }}>
      <p style={{ ...eyebrow, letterSpacing: '.12em' }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, lineHeight: 1, color, letterSpacing: '-.04em' }}>{value}</p>
    </div>
  )
  const explore: { title: string; body: string; bg: string; fg: string; rot: string; art: ReactNode; onClick: (e: ReactMouseEvent) => void }[] = [
    {
      title: 'Sunday School',
      body: 'Lessons and your Bible reading streak.',
      bg: 'linear-gradient(145deg,#ff8a3d,#b8281a)',
      fg: '#fff',
      rot: '-1deg',
      art: <img src="/village/bible-book.png" alt="" style={{ height: 70, alignSelf: 'flex-start', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.35))' }} />,
      onClick: (e) => go('bible')(e),
    },
    {
      title: 'Leaderboard',
      body: 'See how you rank ministry-wide.',
      bg: 'linear-gradient(145deg,#ffe066,#f0a400)',
      fg: '#1a0f2e',
      rot: '1deg',
      art: <img src="/feature-leaderboard.png" alt="" style={{ height: 70, alignSelf: 'flex-start', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.25))' }} />,
      onClick: (e) => go('leaderboard')(e),
    },
    {
      title: 'Games',
      body: 'Join a live match or practice solo.',
      bg: 'linear-gradient(145deg,#ff6bb5,#8a1656)',
      fg: '#fff',
      rot: '-1deg',
      art: <img src="/village/game-rocket.png" alt="" style={{ height: 70, alignSelf: 'flex-start', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.35))' }} />,
      onClick: (e) => go('game')(e),
    },
    {
      title: 'Digital Bank',
      body: 'Keep your files, notes and photos safe in one place.',
      bg: 'linear-gradient(145deg,#6d4bff,#3d1259)',
      fg: '#fff',
      rot: '1deg',
      art: <ExploreIcon icon={Database} />,
      onClick: () => openApp('bank'),
    },
    {
      title: 'Ask the Bible',
      body: 'Ask any Bible question and get an answer with verses.',
      bg: 'linear-gradient(145deg,#4fd1ff,#2a4fb8)',
      fg: '#fff',
      rot: '1deg',
      art: <ExploreIcon icon={BookOpenText} />,
      onClick: () => openPage('helper'),
    },
    {
      title: 'Prayer Journal',
      body: 'Write your prayers down and keep them.',
      bg: 'linear-gradient(145deg,#6f9bff,#2a1f7a)',
      fg: '#fff',
      rot: '-1deg',
      art: <ExploreIcon icon={HandHeart} />,
      onClick: () => openPage('prayer'),
    },
  ]

  return (
    <>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 30,
          minHeight: 640,
          marginBottom: 22,
          background: '#3a2560 url(/village-home-bg.jpg) center/cover',
          boxShadow: '0 30px 70px -30px rgba(0,0,0,.7)',
        }}
      >
        <p
          style={{
            position: 'absolute',
            left: 'clamp(16px,3vw,28px)',
            top: 22,
            maxWidth: '46%',
            margin: 0,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 'clamp(24px,3.2vw,36px)',
            lineHeight: 1.05,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,.65)',
          }}
        >
          Welcome back, {firstName(student?.full_name)}!
        </p>
        <button
          type="button"
          onClick={go('profile')}
          className="kv-idcard"
          style={{
            position: 'absolute',
            right: 'clamp(12px,2.5vw,24px)',
            top: 20,
            width: 'min(46%,250px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: 20,
            border: 'none',
            overflow: 'hidden',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            background: 'linear-gradient(135deg,#7b2ff7 0%,#4a1a8a 55%,#2b0f5c 100%)',
            boxShadow: '0 18px 36px -14px rgba(0,0,0,.7)',
          }}
        >
          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 30%,rgba(255,255,255,.4) 45%,transparent 60%)', animation: 'kv-shineCard 3.5s ease-in-out infinite', pointerEvents: 'none' }} />
          <Face url={student?.avatar_url} name={student?.full_name} size={46} fontSize={20} background="rgba(255,255,255,.16)" style={{ boxShadow: '0 0 0 2px rgba(255,255,255,.5)' }} />
          <span style={{ position: 'relative', minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 15, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student?.full_name || 'My Card'}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.72)' }}>{klass?.name ?? 'No class yet'}</span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 12, fontWeight: 800, color: '#fff' }}>{(student?.total_points ?? 0).toLocaleString()} pts</span>
          </span>
          <ArrowRight style={{ position: 'relative', width: 18, height: 18, color: 'rgba(255,255,255,.75)', flexShrink: 0 }} />
        </button>
        <Tablet app={app} setApp={setApp} klass={klass} achievements={achievements} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: 14 }}>
          {stat('Points', (student?.total_points ?? 0).toLocaleString(), '#ffd84d')}
          {stat('Leaderboard Rank', rank ? `#${rank}` : '-', '#fff')}
          {stat('Day Streak', String(streak), '#ffab70')}
        </div>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 15, color: 'rgba(236,230,250,.6)' }}>
          {klass ? `in ${klass.name}${klass.teacher_name ? `, with ${klass.teacher_name}` : ''}` : 'Not in a class yet. Give your Student Code to your teacher.'}
        </p>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, margin: '0 0 12px' }}>
            <p style={eyebrow}>My Badges</p>
            <button
              type="button"
              onClick={() => openApp('badges')}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: '#ffd84d' }}
            >
              See all →
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {achievements.length === 0 && <p style={{ margin: 0, fontSize: 14, color: 'rgba(236,230,250,.6)' }}>No badges yet. Play a quiz or finish a lesson to earn your first one.</p>}
            {achievements.slice(0, 3).map((a, i) => {
              const look = BADGE_LOOKS[i % BADGE_LOOKS.length]
              const Icon = achievementIcon(a.icon)
              return (
                <span
                  key={a.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 8px', borderRadius: 999, background: look.bg, border: `1px solid ${look.bd}`, color: look.fg, fontWeight: 700, fontSize: 14 }}
                >
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: look.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 16, height: 16, color: look.ic }} strokeWidth={2.25} />
                  </span>
                  {a.name}
                </span>
              )
            })}
          </div>
        </div>
        <div>
          <p style={{ ...eyebrow, margin: '0 0 12px' }}>Explore</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 14 }}>
            {explore.map((x) => (
              <button
                key={x.title}
                type="button"
                onClick={x.onClick}
                className="kv-lift"
                style={
                  {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 30,
                    textAlign: 'left',
                    padding: 22,
                    borderRadius: 26,
                    background: x.bg,
                    border: 'none',
                    color: x.fg,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    '--rot': x.rot,
                  } as CSSProperties
                }
              >
                {x.art}
                <span>
                  <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 22 }}>{x.title}</span>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.45, opacity: x.fg === '#fff' ? 0.9 : 0.8 }}>{x.body}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <Link
          to="/anthem"
          onClick={() => playClick()}
          className="kv-hov"
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', ...quietCard, color: '#fff', ['--hov' as string]: '#ff4fa3' } as CSSProperties}
        >
          <span style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(135deg,#ff6bb5,#d12a7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Music style={{ width: 24, height: 24, color: '#fff' }} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 20 }}>Our Anthem</span>
            <span style={{ display: 'block', fontSize: 14, color: 'rgba(236,230,250,.65)', marginTop: 2 }}>Sing along with the children&apos;s ministry anthem.</span>
          </span>
          <ArrowRight style={{ width: 20, height: 20, color: 'rgba(255,255,255,.6)' }} />
        </Link>
      </div>
    </>
  )
}

function ExploreIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span style={{ width: 70, height: 70, borderRadius: 22, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: 34, height: 34, color: '#fff' }} strokeWidth={2} />
    </span>
  )
}

/** The standing tablet on the rug. Tap its edges and it wobbles. */
function Tablet({
  app,
  setApp,
  klass,
  achievements,
}: {
  app: AppKey | null
  setApp: (k: AppKey | null) => void
  klass: Klass | null
  achievements: EarnedAchievement[]
}) {
  const [wob, setWob] = useState<'l' | 'r' | null>(null)
  const nudge = (dir: 'l' | 'r') => {
    playClick()
    setWob(dir)
    window.setTimeout(() => setWob(null), 380)
  }
  const meta = DOCK_APPS.find((a) => a.key === app)
  const title = app === 'chat' && klass ? klass.teacher_name : meta?.title ?? ''

  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 16, width: 'min(340px,calc(100% - 24px))', transform: 'translateX(-50%)' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: -8, width: 240, height: 32, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(0,0,0,.65),transparent 72%)', filter: 'blur(6px)', opacity: 0.6 }} />
      <div
        style={{
          position: 'relative',
          transformOrigin: 'bottom center',
          transform: `perspective(900px) rotateY(-6deg) rotate(${wob === 'l' ? -7 : wob === 'r' ? 7 : -2}deg) translateX(${wob === 'l' ? -5 : wob === 'r' ? 5 : 0}px)`,
          transition: 'transform .45s cubic-bezier(.34,1.8,.5,1)',
        }}
      >
        <button type="button" onClick={() => nudge('l')} aria-label="Nudge tablet left" style={{ position: 'absolute', left: -24, top: 56, bottom: 56, width: 24, border: 'none', background: 'none', cursor: 'pointer', zIndex: 3 }} />
        <button type="button" onClick={() => nudge('r')} aria-label="Nudge tablet right" style={{ position: 'absolute', right: -24, top: 56, bottom: 56, width: 24, border: 'none', background: 'none', cursor: 'pointer', zIndex: 3 }} />
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 20,
            border: '12px solid #e4e7ec',
            background: 'linear-gradient(155deg,#f5f6f8,#b9c0ca)',
            boxShadow: '0 28px 48px -14px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.08),inset 0 0 0 1px rgba(255,255,255,.6)',
          }}
        >
          {/* dark-island: a black screen inside the page, so the shared
              tokens the vault and notes paint from go back to dark here. */}
          <div className="dark-island" style={{ position: 'relative', height: 420, overflow: 'hidden', borderRadius: 8, background: 'linear-gradient(160deg,#1c1c26,#0a0a10)' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', background: 'linear-gradient(115deg,rgba(255,255,255,.16) 0%,transparent 18%,transparent 82%,rgba(255,255,255,.07) 100%)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 9, width: 10, height: 10, transform: 'translateX(-50%)', borderRadius: '50%', background: 'rgba(0,0,0,.7)', zIndex: 5 }} />
            {!app ? (
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                  gap: '22px 10px',
                  padding: '34px 16px 16px',
                  alignContent: 'start',
                  animation: 'kv-appIn .35s both',
                }}
              >
                {DOCK_APPS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      playClick()
                      setApp(a.key)
                    }}
                    className="kv-app"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <AppIcon icon={a.icon} from={a.from} to={a.to} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>{a.label}</span>
                  </button>
                ))}
                <Link
                  to="/anthem"
                  onClick={() => playClick()}
                  className="kv-app"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#fff' }}
                >
                  <AppIcon icon={Music} from="#fdba74" to="#c2410c" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>Anthem</span>
                </Link>
              </div>
            ) : (
              <div
                key={app}
                style={{ position: 'relative', zIndex: 2, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', padding: '28px 14px 16px', animation: 'kv-appIn .3s cubic-bezier(.2,.9,.2,1) both' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setApp(null)}
                    aria-label="Back"
                    style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                  >
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                  </button>
                  <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 16, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                </div>
                <TabletApp app={app} klass={klass} achievements={achievements} />
              </div>
            )}
            <div style={{ position: 'absolute', left: '50%', bottom: 5, width: 56, height: 4, transform: 'translateX(-50%)', borderRadius: 999, background: 'rgba(255,255,255,.6)', zIndex: 5 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AppIcon({ icon: Icon, from, to }: { icon: LucideIcon; from: string; to: string }) {
  return (
    <span
      style={{
        position: 'relative',
        width: 56,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(155deg,${from},${to})`,
        boxShadow: '0 5px 12px -3px rgba(0,0,0,.55),inset 0 1px 1px rgba(255,255,255,.4),inset 0 -2px 3px rgba(0,0,0,.3)',
      }}
    >
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%,rgba(255,255,255,.5),transparent 55%)' }} />
      <Icon style={{ position: 'relative', width: 24, height: 24, color: '#fff' }} strokeWidth={2.25} />
    </span>
  )
}

/** The tablet's gold "open the full app" button. */
/** The tablet's peek at the Prayer Journal: the two newest prayers. */
function TabPrayers({ onOpen }: { onOpen: () => void }) {
  const [rows, setRows] = useState<Prayer[] | null>(null)
  useEffect(() => {
    listMyPrayers()
      .then((r) => setRows(r.prayers.slice(0, 2)))
      .catch(() => setRows([]))
  }, [])
  const when = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
    return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`
  }
  return (
    <>
      {rows && rows.length === 0 && <p style={tabletEmpty}>No prayers yet. Write your first one in your journal.</p>}
      {rows?.map((p) => <TabRow key={p.id} col="#f9a8d4" lead="♥" t={p.text} s={when(p.at)} tail={p.answered ? 'Answered' : 'Praying'} />)}
      <TabLink onClick={onOpen}>Open my Prayer Journal</TabLink>
    </>
  )
}

function TabLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ marginTop: 6, padding: 12, borderRadius: 14, border: 'none', background: '#f2c94c', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}

function TabRow({ lead, col, t, s, tail }: { lead: ReactNode; col: string; t: string; s?: string; tail?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, background: 'rgba(255,255,255,.05)' }}>
      <span
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          overflow: 'hidden',
          background: col,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          color: '#1a0f2e',
        }}
      >
        {lead}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
        {s && <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>}
      </span>
      {tail && <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: '#f2c94c' }}>{tail}</span>}
    </div>
  )
}

const tabletEmpty: CSSProperties = { margin: 0, paddingTop: 32, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.5)' }

function TabletApp({
  app,
  klass,
  achievements,
}: {
  app: AppKey
  klass: Klass | null
  achievements: EarnedAchievement[]
}) {
  const openPage = useContext(OpenPage)
  if (app === 'chat') {
    return klass ? (
      <ChatScreen teacherId={klass.teacher_id} teacherName={klass.teacher_name} />
    ) : (
      <p style={tabletEmpty}>You&apos;re not in a class yet, so there&apos;s no teacher to message.</p>
    )
  }
  const body = (children: ReactNode) => (
    <div className="kv-tablet-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  )
  switch (app) {
    case 'friends':
      return body(<FriendsScreen klass={klass} />)
    case 'badges':
      return body(
        achievements.length === 0 ? (
          <p style={tabletEmpty}>No badges yet. Keep going!</p>
        ) : (
          achievements.map((a) => {
            const Icon = achievementIcon(a.icon)
            return <TabRow key={a.id} col="#f2c94c" lead={<Icon style={{ width: 14, height: 14 }} strokeWidth={2.25} />} t={a.name} s={a.description ?? undefined} />
          })
        ),
      )
    case 'bank':
      return body(<DigitalBankSection />)
    case 'prayer':
      return body(<TabPrayers onOpen={() => openPage('prayer')} />)
    case 'diary':
      return body(<NotesSection kind="diary" title="Diary" icon={PenLine} accent="var(--lp-accent-anthem)" placeholder="Dear diary…" />)
    case 'calendar':
      return body(<MinistryCalendarReadOnly dark />)
    case 'collection': {
      const heroes = achievements.filter((a) => a.code.startsWith('character_'))
      return body(
        <>
          {heroes.length === 0 ? (
            <p style={tabletEmpty}>No heroes yet. Finish a Bible Journey lesson to unlock your first.</p>
          ) : (
            heroes.slice(0, 4).map((a) => <TabRow key={a.id} col="#fbcfe8" lead={(a.name.replace(/^.*?:\s*/, '')[0] ?? '?').toUpperCase()} t={a.name.replace(/^.*?:\s*/, '')} s={a.description ?? undefined} />)
          )}
          <TabLink onClick={() => openPage('characters')}>See all heroes</TabLink>
        </>,
      )
    }
    case 'world': {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return body(
        <>
          {[0, 1].map((d) => {
            const c = getCountryForOffset(today, d)
            return <TabRow key={d} col="#93c5fd" lead={c.code} t={c.name} s={c.focus} tail={d === 0 ? 'Today' : undefined} />
          })}
          <TabLink onClick={() => openPage('prayer')}>Open the prayer globe</TabLink>
        </>,
      )
    }
    case 'buddy':
      return body(
        <>
          <TabRow col="#a5b4fc" lead="?" t="Ask me anything about the Bible" s="Answers come with real verses" />
          <TabLink onClick={() => openPage('helper')}>Chat with Bible Buddy</TabLink>
        </>,
      )
    default:
      return null
  }
}

const FRIEND_COLOURS = ['#c13bff', '#ff8a3d', '#4f7bff', '#19c99b', '#ff4fa3']

function FriendsScreen({ klass }: { klass: Klass | null }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!klass) {
      setLoading(false)
      return
    }
    getLeaderboard(500)
      .then((all) => setRows(all.filter((r) => r.class_id === klass.id)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [klass])

  if (!klass) return <p style={tabletEmpty}>Join a class to see your classmates here.</p>
  if (loading) return <p style={tabletEmpty}>Loading…</p>
  if (rows.length === 0) return <p style={tabletEmpty}>No classmates yet.</p>
  return (
    <>
      {rows.map((r, i) => (
        <TabRow
          key={r.student_id}
          col={FRIEND_COLOURS[i % FRIEND_COLOURS.length]}
          lead={r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialOf(r.full_name)}
          t={r.full_name}
          s={r.class_name ?? klass.name}
          tail={r.total_points.toLocaleString()}
        />
      ))}
    </>
  )
}

/** The tablet's chat is the same conversation as the My Teacher room. */
function useTeacherChat(teacherId: string) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!myId) return
    getOrCreateConversation(teacherId, myId)
      .then((id) => {
        setConversationId(id)
        return listMessages(id).then(setMessages)
      })
      .catch(() => {})
  }, [teacherId, myId])

  const send = async () => {
    if (!draft.trim() || !conversationId) return
    await sendMessage(conversationId, draft)
    setDraft('')
    playClick()
    listMessages(conversationId).then(setMessages)
  }

  return { messages, draft, setDraft, send, myId }
}

function ChatScreen({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const { messages, draft, setDraft, send, myId } = useTeacherChat(teacherId)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <>
      <div className="kv-tablet-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{teacherName} · Your Sunday school teacher</p>
        {messages.map((m) => {
          const me = m.sender_id === myId
          return (
            <div
              key={m.id}
              style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '8px 12px', borderRadius: 16, background: me ? '#f2c94c' : 'rgba(255,255,255,.1)', color: me ? '#000' : '#fff', fontSize: 13, lineHeight: 1.4 }}
            >
              {m.body}
            </div>
          )
        })}
        {messages.length === 0 && <p style={tabletEmpty}>Say hi to your teacher!</p>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Message…"
          style={{ flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: 999, border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          type="button"
          onClick={send}
          aria-label="Send"
          style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f2c94c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send style={{ width: 15, height: 15, color: '#1a0f2e' }} />
        </button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// My Class
// ---------------------------------------------------------------------------

const CLASS_CHIPS = [
  { key: 'info', label: 'Class Info', icon: Users, from: '#60a5fa', to: '#1d4ed8' },
  { key: 'lessons', label: 'Lessons', icon: BookOpen, from: '#4ade80', to: '#15803d' },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList, from: '#fbbf24', to: '#b45309' },
  { key: 'verse', label: 'Memory Verse', icon: Heart, from: '#fb7185', to: '#be123c' },
  { key: 'notes', label: 'Notebook', icon: FileText, from: '#a78bfa', to: '#6d28d9' },
] as const
type ClassSec = (typeof CLASS_CHIPS)[number]['key']

const SEEN_LECTURES_KEY = 'mfm-seen-lectures'
function loadSeenLectures(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_LECTURES_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function ClassRoom({ klass, student, boom }: { klass: Klass | null; student: StudentRow | null; boom: () => void }) {
  const [sec, setSec] = useState<ClassSec>('lessons')
  const [lessons, setLessons] = useState<LectureRow[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [mates, setMates] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openL, setOpenL] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(loadSeenLectures)
  const [openA, setOpenA] = useState<string | null>(null)

  useEffect(() => {
    if (!klass) {
      setLoading(false)
      return
    }
    Promise.all([listPublishedAssignments(klass.id), listPublishedLectures(klass.id)])
      .then(([a, l]) => {
        setAssignments(a)
        setLessons(l)
        setOpenA(a[0]?.id ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    getLeaderboard(500)
      .then((all) => setMates(all.filter((r) => r.class_id === klass.id)))
      .catch(() => {})
  }, [klass])

  const toggleLesson = (id: string) => {
    playClick()
    setOpenL((cur) => (cur === id ? null : id))
    setSeen((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(SEEN_LECTURES_KEY, JSON.stringify([...next]))
      } catch {
        // private browsing: the badge just resets next visit
      }
      return next
    })
  }

  const locked = !klass
  const muted: CSSProperties = { margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(236,230,250,.7)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))',
          alignItems: 'center',
          gap: 10,
          padding: 'clamp(22px,3vw,34px)',
          borderRadius: 30,
          background: 'radial-gradient(ellipse 70% 90% at 85% 50%,rgba(25,201,155,.35),transparent 65%),linear-gradient(140deg,#0b3d33,#06221d)',
          border: '1px solid rgba(255,255,255,.1)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.1)', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: '#5cf0c8', textTransform: 'uppercase' }}
          >
            <Users style={{ width: 14, height: 14 }} strokeWidth={2.25} />
            {klass ? [klass.name, klass.teacher_name].filter(Boolean).join(' · ') : 'Your class'}
          </span>
          <h2 style={{ margin: '14px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(34px,4.4vw,52px)', lineHeight: 0.95, letterSpacing: '-.04em', color: '#fff' }}>
            Bible learning
            <br />
            for kids
          </h2>
          <p style={{ margin: '12px 0 0', maxWidth: 380, fontSize: 15, lineHeight: 1.6, color: 'rgba(236,230,250,.8)' }}>
            Lessons, assignments and your memory verse from your teacher, all in one place.
          </p>
          <button
            type="button"
            onClick={() => {
              playClick()
              setSec('lessons')
              if (lessons[0]) toggleLesson(lessons[0].id)
            }}
            className="kv-3d-mint"
            style={{
              marginTop: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 22px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(180deg,#5cf0c8,#13b48c)',
              boxShadow: '0 5px 0 #0b7a5e',
              color: '#03231b',
              fontFamily: 'inherit',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Start learning <ArrowRight style={{ width: 16, height: 16 }} strokeWidth={2.5} />
          </button>
        </div>
        <img src="/teacher-isometric.png" alt="" style={{ justifySelf: 'center', width: 'min(100%,320px)', animation: 'kv-bob 4.5s ease-in-out infinite', filter: 'drop-shadow(0 24px 30px rgba(0,0,0,.45))' }} />
      </div>

      <div className="kv-chips" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {CLASS_CHIPS.map((c) => {
          const on = sec === c.key
          const Icon = c.icon
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                playClick()
                setSec(c.key)
              }}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px 8px 8px',
                borderRadius: 999,
                border: `2px solid ${on ? '#5cf0c8' : 'rgba(255,255,255,.12)'}`,
                background: on ? 'rgba(47,224,181,.14)' : 'rgba(255,255,255,.04)',
                color: '#fff',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}
            >
              <span
                style={{
                  position: 'relative',
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(155deg,${c.from},${c.to})`,
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,.4)',
                }}
              >
                <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%,rgba(255,255,255,.45),transparent 55%)' }} />
                <Icon style={{ position: 'relative', width: 17, height: 17, color: '#fff' }} strokeWidth={2.25} />
              </span>
              {c.label}
            </button>
          )
        })}
      </div>

      <div key={sec} style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'kv-roomIn .4s both' }}>
        {loading && sec !== 'notes' && sec !== 'verse' && <p style={muted}>Loading your class…</p>}

        {!loading && locked && (sec === 'info' || sec === 'lessons' || sec === 'assignments') && <JoinClassNotice code={student?.student_code ?? null} />}

        {sec === 'info' && klass && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 20, ...glassCard }}>
              <Face url={klass.teacher_avatar} name={klass.teacher_name} size={52} radius={16} fontSize={22} background="linear-gradient(135deg,#19c99b,#07665a)" />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(236,230,250,.55)' }}>YOUR TEACHER</span>
                <span style={{ display: 'block', marginTop: 2, fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: '#fff' }}>{klass.teacher_name}</span>
              </span>
            </div>
            <div style={{ padding: 20, ...glassCard }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(236,230,250,.55)' }}>CLASS</span>
              <span style={{ display: 'block', marginTop: 2, fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: '#fff' }}>{klass.name}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: 'rgba(236,230,250,.6)' }}>Sunday school</span>
            </div>
            <div style={{ padding: 20, ...glassCard }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(236,230,250,.55)' }}>CLASSMATES</span>
              <span style={{ display: 'flex', marginTop: 8 }}>
                {mates.slice(0, 5).map((m, i) => (
                  <Face
                    key={m.student_id}
                    url={m.avatar_url}
                    name={m.full_name}
                    size={32}
                    fontSize={12}
                    background={FRIEND_COLOURS[i % FRIEND_COLOURS.length]}
                    style={{ marginRight: -8, border: '2px solid #0d0618', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                ))}
              </span>
              <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: 'rgba(236,230,250,.6)' }}>
                {mates.length} {mates.length === 1 ? 'child' : 'children'}
              </span>
            </div>
          </div>
        )}

        {sec === 'lessons' && !loading && klass && lessons.length === 0 && <p style={muted}>No lessons posted yet. When {klass.teacher_name || 'your teacher'} posts one, it shows up here.</p>}
        {sec === 'lessons' && !loading && lessons.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 14 }}>
            {lessons.map((l) => {
              const open = openL === l.id
              const watched = seen.has(l.id)
              const art = lessonArt(l.title)
              const notes = [l.description, l.body].filter(Boolean).join('\n\n')
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLesson(l.id)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    minHeight: 220,
                    padding: 18,
                    borderRadius: 24,
                    border: `2px solid ${open ? 'rgba(47,224,181,.5)' : 'rgba(255,255,255,.1)'}`,
                    background: `linear-gradient(180deg,transparent 10%,rgba(6,34,29,.95) 80%),${art ? `url(${art.image}) center/cover` : 'linear-gradient(140deg,#0b3d33,#06221d)'}`,
                    color: '#fff',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'border-color .2s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: watched ? 'rgba(255,255,255,.08)' : 'rgba(255,201,60,.16)',
                      color: watched ? 'rgba(236,230,250,.6)' : '#ffd84d',
                    }}
                  >
                    {watched ? 'WATCHED' : 'NEW'}
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, paddingRight: 80 }}>{l.title}</span>
                  <span style={{ marginTop: 2, fontSize: 12, opacity: 0.75 }}>
                    {klass?.teacher_name ?? 'Your teacher'} · {new Date(l.publish_at ?? l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  {open && (
                    <span style={{ display: 'block', marginTop: 10, fontSize: 14, lineHeight: 1.6, opacity: 0.92, whiteSpace: 'pre-wrap', animation: 'kv-roomIn .3s both' }}>
                      {notes || 'Your teacher has not written this one up yet.'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {sec === 'assignments' && !loading && klass && assignments.length === 0 && (
          <p style={muted}>No assignments right now. When your teacher posts one, you&apos;ll see it here.</p>
        )}
        {sec === 'assignments' &&
          !loading &&
          assignments.map((a) => (
            <AssignmentItem key={a.id} assignment={a} open={openA === a.id} onToggle={() => setOpenA((cur) => (cur === a.id ? null : a.id))} boom={boom} />
          ))}

        {sec === 'verse' && <MemoryVerse verse={student?.favorite_verse ?? null} />}

        {sec === 'notes' && (
          <div style={{ padding: 20, ...glassCard }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: '.12em', color: '#c4b5fd' }}>MY NOTEBOOK</p>
            <NotesSection kind="notebook" title="Notebook" icon={FileText} accent="#a78bfa" placeholder="Write down what you learned today…" />
          </div>
        )}
      </div>
    </div>
  )
}

function JoinClassNotice({ code }: { code: string | null }) {
  return (
    <div style={{ padding: '20px 22px', textAlign: 'center', ...glassCard }}>
      <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: '#fff' }}>Join a class to unlock this</p>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(236,230,250,.7)' }}>Give this code to your Sunday school teacher and they will add you.</p>
      {code ? (
        <p style={{ margin: '12px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: '.18em', color: '#ffd84d' }}>{code}</p>
      ) : (
        <p style={{ margin: '12px 0 0', fontSize: 14, color: 'rgba(236,230,250,.5)' }}>Your code is still being made.</p>
      )}
    </div>
  )
}

const ASSIGNMENT_LOOK = {
  Open: ['rgba(255,201,60,.16)', '#ffd84d'],
  Submitted: ['rgba(255,255,255,.08)', 'rgba(236,230,250,.7)'],
  Graded: ['rgba(47,224,181,.16)', '#5cf0c8'],
  Overdue: ['rgba(255,91,107,.16)', '#ff8a96'],
} as const

function AssignmentItem({ assignment, open, onToggle, boom }: { assignment: AssignmentRow; open: boolean; onToggle: () => void; boom: () => void }) {
  const [answer, setAnswer] = useState('')
  const [sub, setSub] = useState<{ body: string | null; grade: number | null; feedback: string | null } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMySubmission(assignment.id)
      .then((s) => {
        if (s) {
          setSub({ body: s.body, grade: s.grade, feedback: s.feedback })
          setAnswer(s.body ?? '')
        }
      })
      .catch(() => {})
  }, [assignment.id])

  const overdue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false
  const graded = sub?.grade !== null && sub?.grade !== undefined
  const status: keyof typeof ASSIGNMENT_LOOK = graded ? 'Graded' : sub ? 'Submitted' : overdue ? 'Overdue' : 'Open'
  const [sBg, sFg] = ASSIGNMENT_LOOK[status]

  const submit = async () => {
    if (!answer.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await submitAssignment(assignment.id, answer)
      setSub({ body: answer, grade: null, feedback: null })
      playClick()
      boom()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ overflow: 'hidden', ...glassCard }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '18px 20px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 800, fontSize: 16 }}>{assignment.title}</span>
          {assignment.due_date && (
            <span style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'rgba(236,230,250,.55)' }}>
              Due {new Date(assignment.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          )}
        </span>
        <span style={{ padding: '6px 12px', borderRadius: 999, background: sBg, color: sFg, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{status}</span>
        <ChevronDown style={{ width: 18, height: 18, color: 'rgba(255,255,255,.5)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s', flexShrink: 0 }} />
      </button>
      {open && (status === 'Open' || status === 'Overdue') && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignment.instructions && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(236,230,250,.75)', whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>}
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Type your answer…"
            className="kv-field"
            style={{ ...field, background: 'rgba(0,0,0,.25)', resize: 'vertical', ['--focus' as string]: '#2fe0b5' } as CSSProperties}
          />
          {error && <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="kv-3d-mint"
            style={{
              alignSelf: 'flex-start',
              padding: '12px 22px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(180deg,#5cf0c8,#13b48c)',
              boxShadow: '0 4px 0 #0b7a5e',
              color: '#03231b',
              fontFamily: 'inherit',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </div>
      )}
      {open && status === 'Submitted' && <p style={{ margin: 0, padding: '0 20px 20px', fontSize: 15, color: '#5cf0c8', fontWeight: 700 }}>Submitted. Your teacher will grade it soon.</p>}
      {open && graded && (
        <div style={{ margin: '0 20px 20px', padding: '14px 16px', borderRadius: 16, background: 'rgba(47,224,181,.1)' }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#5cf0c8' }}>
            Grade: {sub?.grade}
            {assignment.max_score ? ` / ${assignment.max_score}` : ''}
          </p>
          {sub?.feedback && <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(236,230,250,.75)' }}>{sub.feedback}</p>}
        </div>
      )}
    </div>
  )
}

function MemoryVerse({ verse }: { verse: string | null }) {
  const [hidden, setHidden] = useState(false)
  if (!verse) {
    return (
      <div style={{ padding: 'clamp(24px,4vw,40px)', borderRadius: 28, background: 'linear-gradient(150deg,#fb7185,#9f1239)', color: '#fff', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.16em', opacity: 0.85 }}>MY MEMORY VERSE</p>
        <p style={{ margin: '14px auto 0', maxWidth: 520, fontSize: 16, lineHeight: 1.6 }}>You haven&apos;t picked a verse yet. Add your favourite one in My Card and it shows up here to practise.</p>
      </div>
    )
  }
  const shown = hidden
    ? verse
        .split(' ')
        .map((w, i) => (i % 3 === 1 ? '_'.repeat(w.length) : w))
        .join(' ')
    : verse
  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(24px,4vw,40px)', borderRadius: 28, background: 'linear-gradient(150deg,#fb7185,#9f1239)', color: '#fff', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.16em', opacity: 0.85 }}>MY MEMORY VERSE</p>
      <p style={{ margin: '14px auto 0', maxWidth: 620, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(24px,3.2vw,36px)', lineHeight: 1.2 }}>&ldquo;{shown}&rdquo;</p>
      <a
        href={bibleComUrl(verse)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => playClick()}
        style={{ display: 'inline-block', margin: '12px 0 0', fontWeight: 800, color: '#fff', opacity: 0.85 }}
      >
        Read it on Bible.com ↗
      </a>
      <div>
        <button
          type="button"
          onClick={() => {
            playClick()
            setHidden((v) => !v)
          }}
          style={{ marginTop: 18, padding: '11px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.4)', background: 'rgba(0,0,0,.15)', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {hidden ? 'Show the whole verse' : 'Hide some words to practise'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sunday School
// ---------------------------------------------------------------------------

const TODAY_START = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

function SundayRoom({
  klass,
  streak,
  onStreak,
  onRead,
  boom,
  setNested,
  openJourney,
  onJourneyOpened,
}: {
  klass: Klass | null
  streak: number
  onStreak: (n: number) => void
  onRead: () => void
  boom: () => void
  setNested: (fn: (() => void) | null) => void
  openJourney: boolean
  onJourneyOpened: () => void
}) {
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [streakOpen, setStreakOpen] = useState(false)
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [reading, setReading] = useState<TodaysReading | null>(null)
  const [readingState, setReadingState] = useState<'loading' | 'ready'>('loading')
  const [readDone, setReadDone] = useState(false)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (openJourney) {
      setJourneyOpen(true)
      onJourneyOpened()
    }
  }, [openJourney, onJourneyOpened])

  useEffect(() => {
    if (!klass) return
    listUnlockedSundays(klass.id)
      .then((dates) => setUnlocked(new Set(dates)))
      .catch(() => {})
  }, [klass])

  useEffect(() => {
    getTodaysBibleReading()
      .then(async (r) => {
        setReading(r)
        if (r) setReadDone(await haveICompletedReading(r.reading_id))
      })
      .catch(() => {})
      .finally(() => setReadingState('ready'))
  }, [])

  useEffect(() => {
    setNested(
      journeyOpen ? () => setJourneyOpen(false) : streakOpen ? () => setStreakOpen(false) : null,
    )
  }, [journeyOpen, streakOpen, setNested])
  useEffect(() => () => setNested(null), [setNested])

  const markRead = async () => {
    if (!reading || marking) return
    setMarking(true)
    try {
      await completeBibleReading(reading.reading_id)
      setReadDone(true)
      onRead()
      boom()
      getMyBibleStreak()
        .then(onStreak)
        .catch(() => {})
    } catch {
      // leave the button there so they can try again
    } finally {
      setMarking(false)
    }
  }

  if (journeyOpen) return <BibleJourneyPanel onExit={() => setJourneyOpen(false)} />
  if (streakOpen) {
    return <StreakScreen onBack={() => setStreakOpen(false)} onContinue={() => window.open('https://www.bible.com/reading-plans', '_blank', 'noopener,noreferrer')} />
  }

  // Fourteen Sundays around this one: the last four, this week, and what is coming.
  let current = SUNDAYS_2026.findIndex((d) => d > TODAY_START) - 1
  if (current < 0) current = SUNDAYS_2026[0] > TODAY_START ? 0 : SUNDAYS_2026.length - 1
  const start = Math.max(0, Math.min(current - 4, SUNDAYS_2026.length - 14))
  const window14 = SUNDAYS_2026.slice(start, start + 14).map((date, j) => {
    const i = start + j
    const theme = SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length]
    const key = sundayDateKey(date)
    const isCurrent = i === current
    const open = date <= TODAY_START || unlocked.has(key)
    return { date, key, theme, isCurrent, open, side: j % 2 ? 'flex-end' : 'flex-start' }
  })
  const thisWeek = SUNDAY_LESSON_THEMES[current % SUNDAY_LESSON_THEMES.length]
  const lastWeek = current > 0 ? SUNDAY_LESSON_THEMES[(current - 1) % SUNDAY_LESSON_THEMES.length] : null

  const heroTile: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 24,
    background: 'rgba(255,255,255,.12)',
    border: '1px solid rgba(255,255,255,.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#fff',
    textAlign: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 22,
          padding: 'clamp(22px,3vw,34px)',
          borderRadius: 30,
          background: 'linear-gradient(180deg,rgba(11,46,26,.3),rgba(11,46,26,.78)),url(/icons/sunday-school-cover.jpg) center/cover',
          border: '1px solid rgba(255,255,255,.12)',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: '#ffd84d' }}>SUNDAY SCHOOL</p>
        <h2 style={{ margin: '8px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px,4.4vw,50px)', lineHeight: 0.95, letterSpacing: '-.04em', color: '#fff' }}>Learn, read, grow</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 22, maxWidth: 560 }}>
          <button
            type="button"
            className="kv-lift"
            onClick={() => {
              playClick()
              setStreakOpen(true)
            }}
            style={{ ...heroTile, ['--rot' as string]: '-1deg' } as CSSProperties}
          >
            <img src="/icons/streak-flame.png" alt="" style={{ width: 84, height: 84, objectFit: 'contain', animation: 'kv-flame 1.6s ease-in-out infinite', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.4))' }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18 }}>Bible Reading Plan</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffab70' }}>{streak}-day streak</span>
          </button>
          <button
            type="button"
            className="kv-lift"
            onClick={() => {
              playClick()
              setJourneyOpen(true)
            }}
            style={{ ...heroTile, ['--rot' as string]: '1deg' } as CSSProperties}
          >
            <img src="/icons/bible-journey-book.png" alt="" style={{ width: 84, height: 84, objectFit: 'contain', animation: 'kv-bob 3.4s ease-in-out infinite', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.4))' }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18 }}>Bible Journey</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#5cf0c8' }}>Genesis · keep going</span>
          </button>
        </div>
      </div>

      <p style={{ ...eyebrow, margin: '6px 0 0' }}>Sunday Calendar</p>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14, margin: '12px 0 30px', padding: '6px 0' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, transform: 'translateX(-50%)', borderRadius: 9, background: 'repeating-linear-gradient(180deg,rgba(255,255,255,.18) 0 10px,transparent 10px 20px)' }} />
        {window14.map((d) => {
          const past = d.open
          return (
            <div key={d.key} style={{ position: 'relative', display: 'flex', justifyContent: d.side }}>
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 16,
                  height: 16,
                  transform: 'translate(-50%,-50%)',
                  borderRadius: '50%',
                  background: d.isCurrent ? '#ffd84d' : past ? '#2fe0b5' : '#3a2560',
                  border: '3px solid #0d0618',
                  boxShadow: `0 0 0 3px ${d.isCurrent ? 'rgba(255,216,77,.35)' : 'transparent'}`,
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!past) return
                  playClick()
                  setJourneyOpen(true)
                }}
                className={past ? 'kv-sunday' : undefined}
                style={{
                  position: 'relative',
                  width: 'calc(50% - 22px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  borderRadius: 20,
                  border: `2px solid ${d.isCurrent ? '#ffd84d' : 'rgba(255,255,255,.1)'}`,
                  background: 'rgba(255,255,255,.05)',
                  color: '#fff',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  cursor: past ? 'pointer' : 'default',
                  opacity: past ? 1 : 0.55,
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: `url(${d.theme.image}) center/cover`,
                    filter: past ? 'none' : 'grayscale(.8)',
                  }}
                >
                  {!past && (
                    <span style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock style={{ width: 20, height: 20, color: '#fff' }} strokeWidth={2.25} />
                    </span>
                  )}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: d.isCurrent ? '#ffd84d' : past ? '#5cf0c8' : 'rgba(236,230,250,.45)' }}>
                    {d.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                  </span>
                  <span style={{ display: 'block', marginTop: 2, fontFamily: DISPLAY, fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>{d.theme.title}</span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'rgba(236,230,250,.55)' }}>
                    {d.isCurrent ? 'This week · open now' : past ? 'Done · tap to review' : 'Unlocks on this Sunday'}
                  </span>
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 16 }}>
          <div style={{ position: 'relative', padding: 26, borderRadius: 28, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
            {readingState === 'loading' && <p style={{ margin: 0, fontSize: 15 }}>Getting today&apos;s reading…</p>}
            {readingState === 'ready' && !reading && (
              <>
                <p style={{ ...eyebrow, color: '#ffab70' }}>Bible Reading Plan</p>
                <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: '-.03em', color: '#fff', margin: '10px 0 0' }}>No reading today</h2>
                <p style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.7, color: 'rgba(236,230,250,.78)' }}>
                  There&apos;s no reading plan running right now. A Bible Journey lesson keeps your streak going too.
                </p>
              </>
            )}
            {reading && (
              <>
                <p style={{ ...eyebrow, color: '#ffab70' }}>
                  {reading.plan_title} · Day {reading.day_number}
                </p>
                <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: '-.03em', color: '#fff', margin: '10px 0 0' }}>{reading.title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ fontWeight: 800, color: '#ffab70' }}>{reading.reference}</span>
                  <a
                    href={bibleComUrl(reading.reference)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.08)', fontSize: 12, fontWeight: 700, color: 'rgba(236,230,250,.75)' }}
                  >
                    Read on Bible.com ↗
                  </a>
                </div>
                {reading.passage_text && <p style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.7, color: 'rgba(236,230,250,.78)' }}>&ldquo;{reading.passage_text}&rdquo;</p>}
                {readDone ? (
                  <p style={{ margin: '20px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#5cf0c8' }}>
                    <Check style={{ width: 18, height: 18 }} strokeWidth={3} />
                    Read today. Come back tomorrow to keep your streak!
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={markRead}
                    disabled={marking}
                    className="kv-grow"
                    style={{
                      marginTop: 20,
                      width: '100%',
                      padding: 16,
                      borderRadius: 18,
                      border: 'none',
                      background: 'linear-gradient(135deg,#ff9a4d,#e0452a)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 16,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: '0 14px 30px -12px rgba(255,138,61,.8)',
                      opacity: marking ? 0.7 : 1,
                    }}
                  >
                    {marking ? 'Saving…' : 'Mark as Read'}
                  </button>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 18, padding: 26, borderRadius: 28, background: 'linear-gradient(145deg,#ff8a3d,#a8231a)', color: '#fff' }}>
              <span style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flame style={{ width: 32, height: 32, animation: 'kv-flame 1.2s ease-in-out infinite' }} strokeWidth={2} />
              </span>
              <span>
                <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 0.9, letterSpacing: '-.04em' }}>{streak}</span>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.85, marginTop: 4 }}>Day Streak</span>
              </span>
            </div>
            <a
              href="https://www.bible.com/reading-plans"
              target="_blank"
              rel="noopener noreferrer"
              className="kv-hov"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', ['--hov' as string]: '#ff8a3d' } as CSSProperties}
            >
              <span style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,138,61,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen style={{ width: 22, height: 22, color: '#ffab70' }} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 16 }}>More Reading Plans ↗</span>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(236,230,250,.6)', marginTop: 2 }}>Browse hundreds more reading plans on Bible.com.</span>
              </span>
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            playClick()
            setStreakOpen(true)
          }}
          className="kv-hov"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '20px 22px',
            borderRadius: 24,
            background: 'linear-gradient(135deg,rgba(255,138,61,.22),rgba(255,138,61,.06))',
            border: '1px solid rgba(255,138,61,.4)',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            ['--hov' as string]: '#ff8a3d',
          } as CSSProperties}
        >
          <span style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(135deg,#ff9a4d,#e0452a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarDays style={{ width: 24, height: 24, color: '#fff' }} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 20 }}>My Reading Streak</span>
            <span style={{ display: 'block', fontSize: 14, color: 'rgba(236,230,250,.7)', marginTop: 2 }}>See your week, your best streak and what to read next.</span>
          </span>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#ffab70', whiteSpace: 'nowrap' }}>Open →</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playClick()
            setJourneyOpen(true)
          }}
          className="kv-lift"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            minHeight: 170,
            padding: 22,
            borderRadius: 26,
            border: 'none',
            background: 'linear-gradient(180deg,transparent 15%,#7a2a0e 85%),url(/scenes/u3.jpg) center/cover,#7a2a0e',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ position: 'absolute', top: 16, right: 16, padding: '6px 12px', borderRadius: 999, background: '#ff8a3d', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', whiteSpace: 'nowrap' }}>OPEN →</span>
          <span>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: '-.02em' }}>Bible Journey</span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.45, opacity: 0.9 }}>Lesson by lesson through the Bible. Earn points and keep your streak.</span>
          </span>
        </button>
        <p style={{ ...eyebrow, margin: '6px 0 0' }}>Sunday School Lessons</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 14 }}>
          <div style={{ padding: 22, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: '#ffab70' }}>THIS WEEK</span>
            <p style={{ margin: '8px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 21, color: '#fff' }}>{thisWeek.title}</p>
            <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: 'rgba(236,230,250,.65)' }}>
              {SUNDAYS_2026[current]?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {lastWeek && (
            <div style={{ padding: 22, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(236,230,250,.5)' }}>LAST WEEK</span>
              <p style={{ margin: '8px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 21, color: '#fff' }}>{lastWeek.title}</p>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: 'rgba(236,230,250,.65)' }}>
                {SUNDAYS_2026[current - 1]?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

const RANGES: { key: LeaderboardRange; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
]

/** Where a child sits in this window against the next wider one, so the arrow is real movement. */
const WIDER: Record<LeaderboardRange, LeaderboardRange | null> = { week: 'month', month: 'year', year: 'all', all: null }

function sortBoard(rows: RankedLeaderboardRow[]) {
  return [...rows].sort((a, b) => b.points - a.points || a.full_name.localeCompare(b.full_name))
}

function movementOf(id: string, range: LeaderboardRange, byRange: Record<LeaderboardRange, RankedLeaderboardRow[]>): 'up' | 'down' | 'same' {
  const wider = WIDER[range]
  if (!wider) return 'same'
  const place = (rows: RankedLeaderboardRow[]) => {
    const i = sortBoard(rows).findIndex((r) => r.student_id === id)
    return i === -1 ? null : i
  }
  const now = place(byRange[range])
  const before = place(byRange[wider])
  if (now === null || before === null || now === before) return 'same'
  return now < before ? 'up' : 'down'
}

function LeaderboardRoom({ myId }: { myId: string | null }) {
  const [range, setRange] = useState<LeaderboardRange>('week')
  const [byRange, setByRange] = useState<Record<LeaderboardRange, RankedLeaderboardRow[]> | null>(null)
  const [failed, setFailed] = useState(false)
  const [sheet, setSheet] = useState<{ row: RankedLeaderboardRow; rank: number } | null>(null)

  const load = () => {
    setFailed(false)
    setByRange(null)
    Promise.all(RANGES.map((r) => getRankedLeaderboard(r.key)))
      .then(([week, month, year, all]) => setByRange({ week, month, year, all }))
      .catch(() => setFailed(true))
  }
  useEffect(load, [])

  const rows = useMemo(() => (byRange ? sortBoard(byRange[range]) : []), [byRange, range])

  if (failed) {
    return (
      <div style={{ padding: 26, textAlign: 'center', ...quietCard }}>
        <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: '#fff' }}>We could not load the board</p>
        <p style={{ margin: '6px 0 16px', fontSize: 14 }}>The connection may have dropped.</p>
        <button type="button" onClick={load} style={pillButton}>
          Try again
        </button>
      </div>
    )
  }

  const podiumOrder = [1, 0, 2]
  const PODIUM_BG = ['linear-gradient(135deg,#ffd84d,#f0a400)', '#c9d2e3', '#ff9a4d']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 4, padding: 4, borderRadius: 18, background: 'rgba(255,255,255,.06)', maxWidth: 520 }}>
        {RANGES.map((r) => {
          const on = range === r.key
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                playClick()
                setRange(r.key)
              }}
              style={{
                padding: '11px 6px',
                borderRadius: 14,
                border: 'none',
                background: on ? '#ffd84d' : 'transparent',
                color: on ? '#1a0f2e' : 'rgba(236,230,250,.75)',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}
            >
              {r.label}
            </button>
          )
        })}
      </div>

      {!byRange && <p style={{ margin: 0, fontSize: 15 }}>Loading the board…</p>}
      {byRange && rows.length === 0 && (
        <div style={{ padding: 26, textAlign: 'center', ...quietCard }}>
          <p style={{ margin: 0, fontSize: 15 }}>Nobody has scored in this window yet. Be the first!</p>
        </div>
      )}

      {byRange && rows.length > 0 && (
        <>
          <div key={range} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(8px,2vw,18px)', paddingTop: 16 }}>
            {podiumOrder.map((i) => {
              const row = rows[i]
              if (!row) return <span key={i} style={{ flex: 1, maxWidth: 210 }} />
              const rk = i + 1
              const first = rk === 1
              const size = first ? 84 : 66
              const dl = first ? 0.3 : rk === 2 ? 0.15 : 0
              return (
                <button
                  key={row.student_id}
                  type="button"
                  onClick={() => {
                    playClick()
                    setSheet({ row, rank: rk })
                  }}
                  style={{ flex: 1, maxWidth: 210, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0, border: 'none', background: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  {first && <Crown style={{ flexShrink: 0, marginBottom: 6, width: 30, height: 30, color: '#ffd84d', fill: '#ffd84d', animation: 'kv-bob 2.4s ease-in-out infinite' }} />}
                  <Face
                    url={row.avatar_url}
                    name={row.full_name}
                    size={size}
                    fontSize={26}
                    background={PODIUM_BG[i]}
                    color="#1a0f2e"
                    style={{ border: `3px solid ${first ? '#fff' : 'rgba(255,255,255,.8)'}`, boxShadow: first ? '0 0 40px rgba(255,216,77,.5)' : 'none', animation: `kv-roomIn .5s ${dl}s both` }}
                  />
                  <span style={{ marginTop: 8, fontWeight: 800, fontSize: 15, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.full_name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#ffd84d' }}>{row.points.toLocaleString()}</span>
                  <span
                    style={{
                      marginTop: 10,
                      width: '100%',
                      height: first ? 160 : rk === 2 ? 116 : 86,
                      borderRadius: '20px 20px 0 0',
                      background: first ? 'linear-gradient(180deg,#ffd84d,rgba(240,164,0,.25))' : 'rgba(255,255,255,.1)',
                      display: 'flex',
                      justifyContent: 'center',
                      paddingTop: 10,
                      boxSizing: 'border-box',
                      fontFamily: DISPLAY,
                      fontWeight: 800,
                      fontSize: 40,
                      color: first ? '#1a0f2e' : '#fff',
                      transformOrigin: 'bottom',
                      animation: `kv-rise .8s cubic-bezier(.34,1.3,.64,1) ${dl}s both`,
                    }}
                  >
                    {rk}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.slice(3).map((r, j) => {
              const me = r.student_id === myId
              const mv = movementOf(r.student_id, range, byRange)
              const MvIcon = mv === 'up' ? ChevronUp : mv === 'down' ? ChevronDown : Minus
              return (
                <button
                  key={r.student_id}
                  type="button"
                  onClick={() => {
                    playClick()
                    setSheet({ row: r, rank: j + 4 })
                  }}
                  className="kv-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 20,
                    background: me ? 'linear-gradient(90deg,rgba(255,201,60,.2),rgba(255,201,60,.04))' : 'rgba(255,255,255,.04)',
                    border: `1px solid ${me ? 'rgba(255,201,60,.55)' : 'rgba(255,255,255,.1)'}`,
                    color: '#fff',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    animation: `kv-roomIn .4s ${(Math.min(j, 20) * 0.05).toFixed(2)}s both`,
                  }}
                >
                  <span style={{ width: 26, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, color: 'rgba(236,230,250,.5)' }}>{j + 4}</span>
                  <MvIcon style={{ width: 16, height: 16, flexShrink: 0, color: mv === 'up' ? '#2fe0b5' : mv === 'down' ? '#ff6b80' : 'rgba(236,230,250,.35)' }} strokeWidth={3} />
                  <Face url={r.avatar_url} name={r.full_name} size={40} fontSize={16} background="#3a2560" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.full_name}</span>
                    <span style={{ display: 'block', fontSize: 13, color: 'rgba(236,230,250,.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.class_name ?? 'No class yet'}</span>
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 19, color: '#ffd84d' }}>{r.points.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {sheet && (
        <div
          onClick={() => setSheet(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(8,3,16,.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              padding: '26px 24px 30px',
              borderRadius: '30px 30px 0 0',
              background: 'linear-gradient(160deg,#3a1660,#170a2c)',
              border: '1px solid rgba(255,255,255,.14)',
              color: '#fff',
              textAlign: 'center',
              animation: 'kv-sheetUp .4s cubic-bezier(.2,.9,.2,1) both',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSheet(null)}
              style={{ display: 'block', margin: '0 auto 18px', width: 44, height: 5, padding: 0, border: 'none', borderRadius: 9, background: 'rgba(255,255,255,.3)', cursor: 'pointer' }}
            />
            <Face url={sheet.row.avatar_url} name={sheet.row.full_name} size={84} fontSize={34} style={{ margin: '0 auto', border: '3px solid #ffd84d' }} />
            <p style={{ margin: '12px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 26 }}>{sheet.row.full_name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, opacity: 0.7 }}>{sheet.row.class_name ?? 'No class yet'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 18 }}>
              {[
                { l: 'RANK', v: `#${sheet.rank}`, c: '#fff' },
                { l: 'POINTS', v: sheet.row.points.toLocaleString(), c: '#ffd84d' },
                { l: 'STREAK', v: String(sheet.row.streak), c: '#fff' },
              ].map((s) => (
                <div key={s.l} style={{ padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.08)' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, opacity: 0.6 }}>{s.l}</p>
                  <p style={{ margin: '4px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// My Card
// ---------------------------------------------------------------------------

function CardRoom({
  student,
  state,
  klass,
  onSaved,
  onRetry,
  boom,
  openApp,
}: {
  student: StudentRow | null
  state: 'loading' | 'ready' | 'error'
  klass: Klass | null
  onSaved: () => void
  onRetry: () => void
  boom: () => void
  openApp: (k: AppKey) => void
}) {
  if (state === 'ready' && student) return <ProfileRoom student={student} klass={klass} onSaved={onSaved} boom={boom} openApp={openApp} />
  if (state === 'loading') {
    return (
      <div style={{ padding: 26, textAlign: 'center', ...quietCard }}>
        <Sparkles style={{ width: 28, height: 28, color: '#ffd84d' }} />
        <p style={{ margin: '8px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: '#fff' }}>Getting your card</p>
      </div>
    )
  }
  return (
    <div style={{ padding: 26, textAlign: 'center', ...quietCard }}>
      <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: '#fff' }}>We couldn&apos;t load your card</p>
      <p style={{ margin: '6px 0 16px', fontSize: 14 }}>Your card is still on its way, or the connection dropped.</p>
      <button type="button" onClick={onRetry} style={pillButton}>
        Try again
      </button>
    </div>
  )
}

function CodeBox({ label, code, note, gold, copied, onCopy }: { label: string; code: string; note: string; gold?: boolean; copied: boolean; onCopy: () => void }) {
  const fg = gold ? '#ffd84d' : '#fff'
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 18,
          background: gold ? 'rgba(255,216,77,.1)' : 'rgba(255,255,255,.05)',
          border: `1px solid ${gold ? 'rgba(255,216,77,.3)' : 'rgba(255,255,255,.14)'}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: gold ? '#ffd84d' : 'rgba(236,230,250,.6)' }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, letterSpacing: '.12em', color: fg }}>{code}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 14px',
            borderRadius: 999,
            border: `1px solid ${gold ? 'rgba(255,216,77,.45)' : 'rgba(255,255,255,.25)'}`,
            background: 'transparent',
            color: fg,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ margin: '-4px 0 0', fontSize: 12, color: 'rgba(236,230,250,.5)' }}>{note}</p>
    </>
  )
}

function ProfileRoom({
  student,
  klass,
  onSaved,
  boom,
  openApp,
}: {
  student: StudentRow
  klass: Klass | null
  onSaved: () => void
  boom: () => void
  openApp: (k: AppKey) => void
}) {
  const openPage = useContext(OpenPage)
  const [bio, setBio] = useState(student.bio ?? '')
  const [verse, setVerse] = useState(student.favorite_verse ?? '')
  const [quote, setQuote] = useState(student.favorite_quote ?? '')
  // Their own newest picture, approved or not: a child sees what they
  // uploaded while it waits on their teacher. Everybody else keeps seeing the
  // last approved one.
  const [avatar, setAvatar] = useState(student.pending_avatar_url ?? student.avatar_url)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [copied, setCopied] = useState<'student' | 'parent' | null>(null)
  const [parentCode, setParentCode] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getOrCreateParentLinkCode()
      .then(setParentCode)
      .catch(() => {})
  }, [])

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setAvatar(await fileToResizedDataUrl(file))
  }

  const copy = async (which: 'student' | 'parent', code: string | null) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(which)
      playClick()
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      // clipboard unavailable: the code is already on screen
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await updateMyStudentProfile({ bio, favorite_verse: verse, favorite_quote: quote, avatar_url: avatar ?? undefined })
      playClick()
      haptics.success()
      setSaved(true)
      onSaved()
      window.setTimeout(() => setSaved(false), 1800)
    } catch (e) {
      // The database screens this text and its message already says what to
      // take out, in words a child can act on.
      setError(e instanceof Error ? e.message : 'That did not save. Please try again.')
      haptics.error()
    } finally {
      setSaving(false)
    }
  }

  const makeCard = async () => {
    setRendering(true)
    try {
      const url = await renderIdCardPng({
        fullName: student.full_name,
        className: klass?.name ?? null,
        points: student.total_points,
        avatarUrl: avatar,
        favoriteVerse: verse || null,
        favoriteQuote: quote || null,
        churchName: "MFM Children's Ministry",
        studentCode: student.student_code,
      })
      setCardUrl(url)
      playNav()
      boom()
    } finally {
      setRendering(false)
    }
  }

  const shareCard = async () => {
    if (!cardUrl) return
    try {
      const blob = await (await fetch(cardUrl)).blob()
      const file = new File([blob], 'my-id-card.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Children's Ministry ID Card" })
        return
      }
    } catch {
      // fall through to opening the image
    }
    window.open(cardUrl, '_blank')
  }

  const linkCard = (title: string, body: string, grad: string, Icon: LucideIcon, onClick: () => void) => (
    <button
      type="button"
      onClick={() => {
        playClick()
        onClick()
      }}
      className="kv-hov"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '18px 20px',
        borderRadius: 24,
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.12)',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        ['--hov' as string]: '#ffd84d',
      } as CSSProperties}
    >
      <span style={{ width: 48, height: 48, borderRadius: 16, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 24, height: 24, color: '#fff' }} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 19 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 13, color: 'rgba(236,230,250,.65)', marginTop: 2 }}>{body}</span>
      </span>
      <span style={{ fontWeight: 800, color: '#ffd84d' }}>→</span>
    </button>
  )

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 14, marginBottom: 18 }}>
        {linkCard('Avatar Studio', 'Choose a new photo for your card.', 'linear-gradient(135deg,#d08af0,#8a1fb0)', SmilePlus, () => fileRef.current?.click())}
        {linkCard('Achievements', 'Your badges and your level.', 'linear-gradient(135deg,#ffd84d,#f0a400)', Trophy, () => openApp('badges'))}
      </div>
      <div style={{ marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => openPage('characters')}
          className="kv-lift"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            width: '100%',
            minHeight: 170,
            padding: 22,
            borderRadius: 26,
            border: 'none',
            background: 'linear-gradient(180deg,transparent 15%,#3d1259 85%),url(/scenes/david.jpg) center/cover,#3d1259',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ position: 'absolute', top: 16, right: 16, padding: '6px 12px', borderRadius: 999, background: '#c13bff', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', whiteSpace: 'nowrap' }}>OPEN →</span>
          <span>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: '-.02em' }}>Bible Heroes</span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.45, opacity: 0.9 }}>Your character card collection. Earn a hero with every story you finish.</span>
          </span>
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 24, borderRadius: 28, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ cursor: 'pointer', flexShrink: 0 }}>
              <Face url={avatar} name={student.full_name} size={76} fontSize={32} style={{ border: '3px solid rgba(255,216,77,.7)' }}>
                <span style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera style={{ width: 14, height: 14, color: '#1a0f2e' }} />
                </span>
              </Face>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
            <div>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(236,230,250,.65)' }}>Tap your photo to change it</p>
              {student.avatar_status === 'pending' && (
                <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: '#ffd84d' }}>Your teacher is having a look at this one. Your class will see it once they say yes.</p>
              )}
              {student.avatar_status === 'rejected' && (
                <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: '#ffd84d' }}>Your teacher asked for a different picture. Tap to pick another one.</p>
              )}
            </div>
          </div>
          {student.student_code && (
            <CodeBox
              label="YOUR STUDENT CODE"
              code={student.student_code}
              note="Give this to your teacher so they can add you to your class."
              gold
              copied={copied === 'student'}
              onCopy={() => copy('student', student.student_code)}
            />
          )}
          {parentCode && (
            <CodeBox
              label="PARENT LINK CODE"
              code={parentCode}
              note="Give this to a parent so they can follow your progress on their own dashboard."
              copied={copied === 'parent'}
              onCopy={() => copy('parent', parentCode)}
            />
          )}
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="A little about me…" className="kv-field" style={{ ...field, resize: 'vertical' }} />
          <input value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="Favorite Bible verse" className="kv-field" style={field} />
          <input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Favorite quote" className="kv-field" style={field} />
          {saved && (
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#5cf0c8' }}>
              <Check style={{ width: 16, height: 16 }} /> Saved
            </p>
          )}
          {error && <p style={{ margin: 0, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,91,107,.12)', fontSize: 14, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ padding: 15, borderRadius: 18, border: 'none', background: 'linear-gradient(135deg,#d08af0,#7a2bd6)', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save My Profile'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24, borderRadius: 28, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={eyebrow}>My Digital ID Card</p>
          {cardUrl ? (
            <img src={cardUrl} alt="My ID card" style={{ width: '100%', maxWidth: 300, borderRadius: 26, boxShadow: '0 30px 60px -20px rgba(0,0,0,.7)' }} />
          ) : (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 300,
                aspectRatio: '5/8',
                borderRadius: 26,
                overflow: 'hidden',
                transform: 'perspective(900px) rotateY(-8deg)',
                background: 'radial-gradient(ellipse 80% 50% at 80% 0%,rgba(255,216,77,.35),transparent 60%),linear-gradient(160deg,#6d1b8f,#2a0d4a)',
                border: '1px solid rgba(255,255,255,.2)',
                boxShadow: '0 30px 60px -20px rgba(0,0,0,.7)',
                color: '#fff',
                padding: 22,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 45%,transparent 60%)', animation: 'kv-shineCard 3.5s ease-in-out infinite', pointerEvents: 'none' }} />
              <div style={{ background: '#fff', borderRadius: 12, padding: '4px 10px' }}>
                <img src="/children-ministry-logo-splash.png" alt="" style={{ height: 30, display: 'block' }} />
              </div>
              <Face url={avatar} name={student.full_name} size={100} fontSize={44} style={{ marginTop: 20, border: '4px solid #ffd84d' }} />
              <p style={{ margin: '14px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, letterSpacing: '-.02em' }}>{student.full_name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.75 }}>
                {klass?.name ?? 'No class yet'} · {student.total_points.toLocaleString()} pts
              </p>
              {(verse || quote) && <p style={{ margin: '16px 0 0', fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', opacity: 0.9 }}>&ldquo;{verse || quote}&rdquo;</p>}
              {student.student_code && (
                <p style={{ margin: 'auto 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 15, letterSpacing: '.18em', color: '#ffd84d' }}>{student.student_code}</p>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={makeCard}
              disabled={rendering}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Sparkles style={{ width: 16, height: 16 }} />
              {rendering ? 'Making…' : cardUrl ? 'Re-generate' : 'Generate Card'}
            </button>
            {cardUrl && (
              <button
                type="button"
                onClick={shareCard}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#d08af0,#7a2bd6)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Share2 style={{ width: 16, height: 16 }} />
                Share
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
        <button
          type="button"
          onClick={() => signOut()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: 'rgba(236,230,250,.75)', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <LogOut style={{ width: 16, height: 16 }} />
          Sign out
        </button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// My Teacher
// ---------------------------------------------------------------------------

function TeacherPhone({ head, children, footer }: { head: ReactNode; children: ReactNode; footer: ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(18px,4vw,48px) 12px', borderRadius: 30, background: '#2a3a2a url(/teacher-home-bg.jpg) center/cover' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 400,
          margin: '0 auto',
          padding: 14,
          borderRadius: 44,
          background: '#111',
          boxShadow: '0 40px 70px -24px rgba(0,0,0,.8),inset 0 0 0 2px #333',
          transform: 'perspective(1100px) rotateX(6deg) rotateY(-8deg)',
          animation: 'kv-roomIn .6s both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 4px' }}>{head}</div>
        <div className="kv-tablet-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 12px', borderRadius: 30, background: 'linear-gradient(180deg,#1b1b24,#0e0e14)', minHeight: 340, maxHeight: '52vh', overflowY: 'auto' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>{footer}</div>
      </div>
    </div>
  )
}

const phoneInput: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '16px 20px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'rgba(0,0,0,.25)',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
}
const phoneSend: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 22px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg,#2fe0b5,#0e9a80)',
  color: '#03231b',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function MessagesRoom({ teacherId, teacherName, teacherAvatar }: { teacherId: string; teacherName: string; teacherAvatar: string | null }) {
  const { messages, draft, setDraft, send, myId } = useTeacherChat(teacherId)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  return (
    <TeacherPhone
      head={
        <>
          <Face url={teacherAvatar} name={teacherName} size={38} fontSize={15} background="linear-gradient(135deg,#19c99b,#07665a)" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          <span>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff', fontSize: 15 }}>{teacherName}</span>
            <span style={{ display: 'block', fontSize: 11, color: '#5cf0c8' }}>Your Sunday school teacher</span>
          </span>
        </>
      }
      footer={
        <>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Message…"
            className="kv-field"
            style={{ ...phoneInput, ['--focus' as string]: '#2fe0b5' } as CSSProperties}
          />
          <button type="button" onClick={send} style={phoneSend}>
            <Send style={{ width: 16, height: 16 }} />
            Send
          </button>
        </>
      }
    >
      {messages.length === 0 && <p style={{ margin: 'auto', fontSize: 14, color: 'rgba(255,255,255,.45)' }}>Say hi to your teacher!</p>}
      {messages.map((m) => {
        const me = m.sender_id === myId
        return (
          <div
            key={m.id}
            style={{
              alignSelf: me ? 'flex-end' : 'flex-start',
              maxWidth: '78%',
              padding: '12px 16px',
              borderRadius: me ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
              background: me ? 'linear-gradient(135deg,#2fe0b5,#0e9a80)' : 'rgba(255,255,255,.08)',
              color: me ? '#03231b' : '#fff',
              fontSize: 15,
              lineHeight: 1.5,
              fontWeight: 600,
              animation: 'kv-roomIn .4s ease both',
            }}
          >
            {m.body}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </TeacherPhone>
  )
}

/** My Teacher before there is a teacher: the same phone, locked, with the code that unlocks it. */
function MessagesLockedRoom({ code }: { code: string | null }) {
  return (
    <TeacherPhone
      head={
        <>
          <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <Lock style={{ width: 16, height: 16 }} />
          </span>
          <span>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff', fontSize: 15 }}>No teacher yet</span>
            <span style={{ display: 'block', fontSize: 11, color: '#5cf0c8' }}>This chat unlocks when you join a class</span>
          </span>
        </>
      }
      footer={
        <>
          <input disabled placeholder="Message…" style={{ ...phoneInput, opacity: 0.5, cursor: 'not-allowed' }} />
          <span style={{ ...phoneSend, opacity: 0.4, cursor: 'not-allowed' }}>
            <Lock style={{ width: 16, height: 16 }} />
          </span>
        </>
      }
    >
      <div style={{ margin: 'auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,.7)' }}>Give this code to your Sunday school teacher and they will add you.</p>
        {code ? (
          <p style={{ margin: '12px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: '.18em', color: '#ffd84d' }}>{code}</p>
        ) : (
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'rgba(255,255,255,.45)' }}>Your code is still being made.</p>
        )}
      </div>
    </TeacherPhone>
  )
}

// ---------------------------------------------------------------------------
// Ears for You
// ---------------------------------------------------------------------------

const EARS_STATUS_LABEL: Record<string, string> = {
  new: 'Sent',
  acknowledged: 'Seen by your teacher',
  in_progress: 'Being looked into',
  escalated: 'With ministry leadership',
  resolved: 'Resolved',
}

const earsCard: CSSProperties = { borderRadius: 10, background: 'rgba(20,12,36,.92)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 18px 40px -20px rgba(0,0,0,.6)' }

function EarsRoom({ klass }: { klass: Klass | null }) {
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<EarsMessageRow[]>([])

  const load = () =>
    listMyEarsMessages()
      .then(setHistory)
      .catch(() => {})
  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    if (!body.trim() || !klass) return
    setSubmitting(true)
    try {
      await submitEarsMessage({ class_id: klass.id, body, is_anonymous: anonymous })
      setBody('')
      playClick()
      haptics.success()
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const choice = (on: boolean): CSSProperties => ({
    padding: 12,
    borderRadius: 6,
    border: `1px solid ${on ? '#f2c94c' : 'rgba(255,255,255,.2)'}`,
    background: on ? 'rgba(242,201,76,.1)' : 'transparent',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 14,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all .2s',
  })

  return (
    <div style={{ position: 'relative', overflow: 'hidden', margin: '0 calc(-1 * clamp(16px,4vw,48px))', padding: '64px 16px 48px', minHeight: 640, background: '#3d6b2f url(/village/ears-grass-bg.jpg) center/cover' }}>
      <div style={{ position: 'relative', maxWidth: 448, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{ padding: 16, borderRadius: 6, border: '1px solid rgba(242,201,76,.25)', background: 'rgba(242,201,76,.1)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', fontSize: 14, lineHeight: 1.5, color: '#f2c94c' }}
        >
          You can talk to us. Share something that&apos;s worrying you, a question, or anything you&apos;d like an adult to know. If you or someone you know is ever in danger, please tell a trusted adult right away.
        </div>
        <div style={{ position: 'relative', paddingTop: 24 }}>
          <img
            src="/village/ears-hearttree.png"
            alt=""
            style={{ position: 'absolute', right: 'clamp(-112px,-8vw,-64px)', top: 'clamp(-80px,-5vw,-56px)', zIndex: 0, width: 'clamp(192px,22vw,256px)', transform: 'rotate(6deg)', filter: 'drop-shadow(0 20px 25px rgba(0,0,0,.35))', pointerEvents: 'none' }}
          />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 20, ...earsCard }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write anything on your mind…"
              className="kv-field"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontSize: 15, outline: 'none', resize: 'vertical', ['--focus' as string]: '#f2c94c' } as CSSProperties}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,160px),1fr))', gap: 8 }}>
              <button type="button" onClick={() => setAnonymous(true)} style={choice(anonymous)}>
                <span style={{ display: 'block', fontWeight: 700 }}>Anonymous</span>
                <span style={{ display: 'block', color: 'rgba(236,230,250,.6)' }}>Your teacher won&apos;t know it&apos;s you.</span>
              </button>
              <button type="button" onClick={() => setAnonymous(false)} style={choice(!anonymous)}>
                <span style={{ display: 'block', fontWeight: 700 }}>With My Name</span>
                <span style={{ display: 'block', color: 'rgba(236,230,250,.6)' }}>Your teacher can follow up with you.</span>
              </button>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !klass}
              style={{ width: '100%', padding: 12, borderRadius: 6, border: 'none', background: '#f2c94c', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: klass ? 'pointer' : 'not-allowed', opacity: submitting || !klass ? 0.6 : 1 }}
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
            {!klass && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'rgba(236,230,250,.65)' }}>
                You need to be in a class first, so this goes to your own teacher. Give your Student Code to your Sunday school teacher and they will add you.
              </p>
            )}
          </div>
        </div>
        {history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.6)' }}>My Messages</p>
            {history.map((m) => (
              <EarsHistoryItem key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EarsHistoryItem({ message }: { message: EarsMessageRow }) {
  const [replies, setReplies] = useState<EarsReplyRow[] | null>(null)
  useEffect(() => {
    listEarsReplies(message.id)
      .then(setReplies)
      .catch(() => {})
  }, [message.id])

  return (
    <div style={{ padding: 16, ...earsCard }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(236,230,250,.65)' }}>{message.body}</p>
        <span style={{ flexShrink: 0, padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, color: 'rgba(236,230,250,.65)' }}>{EARS_STATUS_LABEL[message.status] ?? message.status}</span>
      </div>
      {replies?.map((r) => (
        <div key={r.id} style={{ marginTop: 8, padding: 12, borderRadius: 6, background: 'rgba(242,201,76,.1)', fontSize: 14 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#f2c94c' }}>Your teacher&apos;s reply:</p>
          <p style={{ margin: 0, color: '#fff' }}>{r.body}</p>
        </div>
      ))}
    </div>
  )
}
