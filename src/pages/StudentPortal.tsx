import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  ArrowLeft,
  Trophy,
  Dumbbell,
  Music,
  Gamepad2,
  Send,
  Sparkles,
  Share2,
  Check,
  Copy,
  BookOpen,
  Clock,
  Flame,
  Award,
  Grid3x3,
  Layers,
  Shuffle,
  PencilLine,
  Puzzle,
  Palette,
  Music2,
  Mic2,
  Dice5,
  Brain,
  Bot,
  Globe,
  ArrowRight,
  Lock,
  Wallet,
  PenLine,
  Heart,
  FileText,
  X,
  Users,
  ClipboardList,
  ChevronDown,
  CalendarDays,
  Crown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import VillageMap from '../components/VillageMap'
import BibleJourneyPanel from '../components/BibleJourney'
import IsometricPhone from '../components/IsometricPhone'
import { NotesSection, DigitalBankSection } from '../components/PersonalVault'
import MinistryCalendarReadOnly from '../components/MinistryCalendarView'
import { SUNDAY_LESSON_THEMES, SUNDAYS_2026, sundayDateKey } from '../content/sundaySchoolCalendar'
import { bibleComUrl } from '../lib/bibleLink'
import { getMyJourneyProgress } from '../lib/journey'
import { CharacterCollectionGallery, CharacterRevealModal } from '../components/CharacterCollection'
import { lessonArt } from '../content/bibleBookArt'
import StreakScreen from '../components/StreakScreen'
import KidsSignIn from '../components/KidsSignIn'
import PrayerGlobe from '../components/PrayerGlobe'
import BibleBuddyChat from '../components/BibleBuddy'
import { useAutoHideNav } from '../lib/useAutoHideNav'
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
} from '../lib/ministry'
import { achievementIcon } from '../lib/achievementIcons'
import { fileToResizedDataUrl } from '../lib/image'
import { renderIdCardPng } from '../lib/idCard'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function StudentPortal() {
  const { session, profile, loading, profileError, refreshProfile } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  // Signed in, but the account lookup itself failed. Showing the sign-up
  // screen here would tell a child who has just made an account that they
  // have not got one, so say what actually happened and offer the retry.
  if (session && profileError) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <User className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">We couldn&apos;t load your account</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          You&apos;re signed in, but your details didn&apos;t come through. Check your connection and try again.
        </p>
        <button onClick={refreshProfile} className="btn-solid inline-flex">
          Try again
        </button>
      </div>
    )
  }
  // Signed out, this is the whole page rather than a card inside the shell:
  // the icloud.com landing page, with our own features in the cluster.
  if (!session || profile?.role !== 'student') return <KidsSignIn />
  return <Dashboard />
}

type Tab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears' | 'game'

// Each "room" gets its own colored glow (from the same accent tokens the
// Village Map building already uses) instead of the same flat dark panel
// everywhere - a placeholder for real isometric interior art per building,
// which needs actual image assets to do properly.
const TAB_ACCENT: Record<Tab, string> = {
  home: 'var(--hero-accent)',
  class: 'var(--lp-accent-class)',
  bible: 'var(--lp-accent-bible)',
  leaderboard: 'var(--lp-accent-leaderboard)',
  profile: 'var(--lp-accent-achievements)',
  messages: 'var(--lp-accent-training)',
  ears: 'var(--lp-accent-ears)',
  game: 'var(--lp-accent-compete)',
}

// A mobile browser can unload/reload this tab in the background (low
// memory, coming back from another app) - without this, that reload
// dumps the kid straight back to the village map instead of wherever
// they actually were.
const DASHBOARD_STATE_KEY = 'mfm-kids-dashboard-state'

function loadDashboardState(): { tab: Tab; view: 'map' | 'tab' } | null {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if ((parsed?.view === 'map' || parsed?.view === 'tab') && typeof parsed?.tab === 'string' && parsed.tab in TAB_ACCENT) {
      return { tab: parsed.tab, view: parsed.view }
    }
  } catch {
    // sessionStorage can throw in private/locked-down browsing - just skip restoring.
  }
  return null
}

// Today's Loop - no new table, no new reward, just today's activity across
// features that already exist, rolled into one glance on the village map.
// Nothing here is a forced order; a kid can do these in any order or skip
// straight past it.
function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function TodayLoopBanner({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [streak, setStreak] = useState(0)
  const [journeyToday, setJourneyToday] = useState(false)
  const [earsToday, setEarsToday] = useState(false)

  useEffect(() => {
    getMyBibleStreak().then(setStreak)
    getMyJourneyProgress().then((rows) => setJourneyToday(rows.some((r) => isToday(r.completed_at))))
    listMyEarsMessages().then((rows) => setEarsToday(rows.some((m) => isToday(m.created_at))))
  }, [])

  const pill = (done: boolean, label: string, tab: Tab) => (
    <button
      key={label}
      onClick={() => onNavigate(tab)}
      className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--lp-heading)] shadow-lg backdrop-blur transition hover:scale-105"
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: done ? 'var(--hero-accent)' : 'var(--lp-hairline-strong)' }}
      >
        {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 pb-1">
      <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--lp-heading)] shadow-lg backdrop-blur">
        <Flame className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} strokeWidth={2.25} />
        {streak} day{streak === 1 ? '' : 's'}
      </span>
      {pill(journeyToday, 'Bible Journey', 'bible')}
      {pill(earsToday, 'Ears for You', 'ears')}
    </div>
  )
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>(() => loadDashboardState()?.tab ?? 'home')
  const [view, setView] = useState<'map' | 'tab'>(() => loadDashboardState()?.view ?? 'map')
  const [student, setStudent] = useState<StudentRow | null>(null)
  // My Card used to render literally nothing whenever this was null -
  // no spinner, no message, no error - so a child whose record had not
  // arrived (or whose lookup failed) got a blank screen with a back
  // button on it. Tracking why it is null is what lets every state draw
  // something.
  const [studentState, setStudentState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [klass, setKlass] = useState<(ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null>(null)
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [revealCharacter, setRevealCharacter] = useState<BibleCharacterRow | null>(null)
  const [characterCatalog, setCharacterCatalog] = useState<BibleCharacterRow[]>([])

  useEffect(() => {
    try {
      sessionStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify({ tab, view }))
    } catch {
      // ignore - same private-browsing case as loadDashboardState
    }
  }, [tab, view])

  // A character unlock is a DB-side side effect of earning points (see
  // check_character_unlocks() in Supabase) - the frontend only finds out
  // by noticing a new "character_*" achievement that hasn't been shown as
  // a reveal yet. "Shown" is tracked per-device in localStorage since it's
  // just a one-time celebration, not anything that needs to sync.
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
      // ignore - worst case the same reveal shows again once
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
    getMyClass().then(setKlass)
    Promise.all([listMyAchievements(), characterCatalog.length ? Promise.resolve(characterCatalog) : listBibleCharacters()]).then(
      ([earned, catalog]) => {
        setAchievements(earned)
        if (catalog !== characterCatalog) setCharacterCatalog(catalog)
        checkForNewCharacterReveal(earned, catalog)
      },
    )
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A tab with its own nested navigation (Bible Journey's books/path/lesson
  // steps, the classroom dial's open feature panel) has its own back
  // control for stepping back one level within itself - while that's
  // showing, hide the map-level back button instead of leaving two "back"
  // buttons on screen where the wrong one skips past the nested view
  // straight to the village map.
  const [hideMapBack, setHideMapBack] = useState(false)

  const enterTab = (t: Tab) => {
    playNav()
    setTab(t)
    setView('tab')
    setHideMapBack(false)
  }
  const backToMap = () => {
    playClick()
    setView('map')
    load()
  }

  // My House sits near the bottom of the map art, so kids should land there
  // first (their home) and scroll up to discover the rest, not the reverse.
  const mapScrollRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (view !== 'map') return
    const el = mapScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [view])
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const mapNavHidden = useAutoHideNav(mapScrollRef)

  // Fixed, full-viewport: this is the whole kids app once signed in - it
  // deliberately breaks out of KidsShell's padded max-w-3xl column so the
  // village map and each section can go edge to edge, game-screen style.
  return (
    <div className="fixed inset-0 z-[45] bg-[var(--ink)]">
      <AnimatePresence mode="wait" initial={false}>
        {view === 'map' ? (
          <motion.div
            key="map"
            ref={mapScrollRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          >
            <div
              className={`sticky top-0 z-10 flex items-center justify-between gap-3 p-3 transition-transform duration-300 ${
                mapNavHidden ? '-translate-y-24' : 'translate-y-0'
              }`}
            >
              <div className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3 shadow-lg backdrop-blur">
                {student?.avatar_url ? (
                  <img src={student.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--gold)]/60" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--lp-hairline-strong)] text-[var(--gold)]">
                    <User className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                )}
                <div className="leading-tight">
                  <p className="font-display text-sm font-extrabold text-[var(--lp-heading)]">{student?.full_name ?? 'My Dashboard'}</p>
                  <p className="text-[11px] text-[var(--lp-muted)]">{klass?.name ?? 'No class yet'}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[var(--lp-muted)] shadow-lg backdrop-blur transition hover:text-[var(--lp-heading)]"
              >
                Sign Out
              </button>
            </div>
            <TodayLoopBanner onNavigate={enterTab} />
            <VillageMap active={tab} onNavigate={enterTab} avatarUrl={student?.avatar_url} />
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            ref={tabScrollRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 overflow-y-auto"
            style={{
              background: `radial-gradient(ellipse 100% 55% at 50% -8%, color-mix(in srgb, ${TAB_ACCENT[tab]} 30%, transparent), transparent 60%), var(--ink)`,
            }}
          >
            {/* No sliding title bar here - it would hold nothing but this back
                button, so it stays a plain fixed button instead of a nav bar
                that has to disappear and reappear. */}
            {!hideMapBack && (
              <button
                onClick={backToMap}
                className="fixed left-3 top-3 z-40 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-black/50 backdrop-blur transition hover:scale-105"
                style={{ borderColor: TAB_ACCENT[tab], color: TAB_ACCENT[tab] }}
                aria-label="Back to the village map"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
              </button>
            )}
            {(tab === 'leaderboard' || tab === 'profile') && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0"
                style={{ backgroundImage: 'radial-gradient(var(--lp-hairline-strong) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
              />
            )}
            {/* Leaderboard and My Card were the only two stops capped at a
                narrow column. On a phone that is invisible; on a laptop it
                left the list as a thin strip with most of the screen empty
                either side while every other stop ran edge to edge. */}
            <div
              className={`relative z-10 ${tab === 'bible' || tab === 'game' || tab === 'home' || tab === 'class' || tab === 'ears' || tab === 'messages' ? 'pb-12' : 'mx-auto w-full max-w-6xl px-4 pt-24 pb-12 sm:pt-16'}`}
            >
              {tab === 'home' && <HomeTab student={student} klass={klass} achievements={achievements} onNavigate={enterTab} />}
              {tab === 'class' && <ClassTab klass={klass} student={student} onNestedViewChange={setHideMapBack} />}
              {tab === 'bible' && <SundaySchoolTab klass={klass} onNestedViewChange={setHideMapBack} />}
              {tab === 'leaderboard' && <LeaderboardTab myId={student?.id ?? null} />}
              {tab === 'profile' && <CardTab student={student} state={studentState} klass={klass} onSaved={load} onRetry={load} />}
              {tab === 'messages' &&
                (klass ? (
                  <MessagesTab teacherId={klass.teacher_id} teacherName={klass.teacher_name} teacherAvatar={klass.teacher_avatar} />
                ) : (
                  <MessagesLockedTab code={student?.student_code ?? null} />
                ))}
              {tab === 'ears' && <EarsTab klass={klass} />}
              {tab === 'game' && <GameTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {revealCharacter && (
        <CharacterRevealModal
          character={revealCharacter}
          onClose={() => setRevealCharacter(null)}
          onGoToJourney={() => {
            setRevealCharacter(null)
            enterTab('bible')
          }}
        />
      )}
    </div>
  )
}

function HomeTab({
  student,
  klass,
  achievements,
  onNavigate,
}: {
  student: StudentRow | null
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  achievements: EarnedAchievement[]
  onNavigate: (tab: Tab) => void
}) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Bright, uncovered - no dark scrim, no blur, per feedback. Just the
          photo, full brightness, with the phone standing on the rug. */}
      <img src="/village-home-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />

      {/* The floating back button is fixed at left-3 top-3 and is 36px across,
          so a greeting starting at left-4 top-5 sat directly underneath it and
          the first word was unreadable. On a phone the greeting drops below
          the button; from sm up there is room to sit beside it. */}
      <p className="absolute left-4 top-16 max-w-[45%] font-display text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] sm:left-16 sm:top-5 sm:text-3xl">
        Welcome back, {student?.full_name?.split(' ')[0] ?? 'friend'}!
      </p>

      <div className="absolute right-4 top-5 w-[46%] max-w-[220px]">
        <ShinyDigitalCard student={student} klass={klass} onViewFull={() => onNavigate('profile')} />
      </div>

      <StandingPhone klass={klass} achievements={achievements} onNavigate={onNavigate} />
    </div>
  )
}

const DOCK_APPS = [
  { key: 'chat' as const, label: 'Chat', icon: Send, from: '#60a5fa', to: '#1d4ed8' },
  { key: 'friends' as const, label: 'Friends', icon: Users, from: '#6ee7b7', to: '#047857' },
  { key: 'badges' as const, label: 'Badges', icon: Award, from: '#fde68a', to: '#b45309' },
  { key: 'bank' as const, label: 'Bank', icon: Wallet, from: '#c4b5fd', to: '#6d28d9' },
  { key: 'prayer' as const, label: 'Prayer', icon: Heart, from: '#f9a8d4', to: '#be185d' },
  { key: 'diary' as const, label: 'Diary', icon: PenLine, from: '#5eead4', to: '#0f766e' },
  { key: 'calendar' as const, label: 'Calendar', icon: CalendarDays, from: '#fca5a5', to: '#b91c1c' },
  { key: 'collection' as const, label: 'Collection', icon: Layers, from: '#fbcfe8', to: '#9d174d' },
  { key: 'world' as const, label: 'Pray for World', icon: Globe, from: '#93c5fd', to: '#1e3a8a' },
  { key: 'buddy' as const, label: 'Bible Buddy', icon: Bot, from: '#a5b4fc', to: '#4338ca' },
]
type DockApp = (typeof DOCK_APPS)[number]['key']

function DockIcon({ icon: Icon, from, to }: { icon: LucideIcon; from: string; to: string }) {
  return (
    <span
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition group-active:scale-90 group-hover:scale-105"
      style={{
        background: `linear-gradient(155deg, ${from} 0%, ${to} 100%)`,
        boxShadow: '0 5px 12px -3px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 3px rgba(0,0,0,0.3)',
      }}
    >
      <span className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 55%)' }} />
      <Icon className="relative h-6 w-6 text-white drop-shadow" strokeWidth={2.25} />
    </span>
  )
}

// A real iPad-shaped object standing on the rug in the background photo -
// small, upright, barely tilted (not the big floating card-style mockup),
// with a nudge-left/nudge-right wobble when you tap its edges instead of
// a continuous idle float, since a standing object shouldn't drift.
function StandingPhone({
  klass,
  achievements,
  onNavigate,
}: {
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  achievements: EarnedAchievement[]
  onNavigate: (tab: Tab) => void
}) {
  const [screen, setScreen] = useState<DockApp | null>(null)
  const [wobble, setWobble] = useState<'left' | 'right' | null>(null)

  const nudge = (dir: 'left' | 'right') => {
    playClick()
    setWobble(dir)
    window.setTimeout(() => setWobble(null), 380)
  }

  const backButton = (
    <button onClick={() => setScreen(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
      <ArrowLeft className="h-4 w-4" />
    </button>
  )
  const header = (title: string) => (
    <div className="flex items-center gap-2 pb-3">
      {backButton}
      <p className="font-display text-base font-extrabold text-white">{title}</p>
    </div>
  )

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2" style={{ width: 340 }}>
      {/* contact shadow blending the tablet onto the rug */}
      <div
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-8 w-60 -translate-x-1/2 rounded-full opacity-60 blur-md"
        style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.65), transparent 72%)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: wobble === 'left' ? -7 : wobble === 'right' ? 7 : -2,
          x: wobble === 'left' ? -5 : wobble === 'right' ? 5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d', transform: 'perspective(900px) rotateY(-6deg)' }}
        className="relative"
      >
        <button aria-label="Nudge phone left" onClick={() => nudge('left')} className="absolute -left-6 top-14 bottom-14 z-30 w-6" />
        <button aria-label="Nudge phone right" onClick={() => nudge('right')} className="absolute -right-6 top-14 bottom-14 z-30 w-6" />

        <div
          className="relative overflow-hidden rounded-[20px] border-[12px]"
          style={{
            borderColor: '#e4e7ec',
            background: 'linear-gradient(155deg, #f5f6f8 0%, #b9c0ca 100%)',
            boxShadow: '0 28px 48px -14px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)',
          }}
        >
          {/* metal side-frame highlight for a bit more realism */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-30 w-1"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.1))' }}
          />
          {/* dark-island: this is a black phone screen sitting inside a light
              page, so the shared tokens have to go back to their dark values
              for anything nested in here. Without it a token-built component
              (the vault widget) paints a near-white card in the middle of the
              screen. */}
          <div
            className="dark-island relative overflow-hidden rounded-[8px]"
            style={{ height: 420, background: 'linear-gradient(160deg, #1c1c26 0%, #0a0a10 100%)' }}
          >
            {/* glass glare for a bit more "3d" realism */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20"
              style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.07) 100%)' }}
            />
            <div className="absolute left-1/2 top-2.5 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-black/70" />

            <div className="relative z-10 flex h-full flex-col px-4 pb-4 pt-6">
              {screen === null && (
                <div className="grid flex-1 grid-cols-3 content-start gap-x-3 gap-y-6 pt-3">
                  {DOCK_APPS.map((app) => (
                    <button key={app.key} onClick={() => setScreen(app.key)} className="group flex flex-col items-center gap-1.5">
                      <DockIcon icon={app.icon} from={app.from} to={app.to} />
                      <span className="text-[11px] font-bold text-white drop-shadow">{app.label}</span>
                    </button>
                  ))}
                  <Link to="/anthem" onClick={() => playClick()} className="group flex flex-col items-center gap-1.5">
                    <DockIcon icon={Music} from="#fdba74" to="#c2410c" />
                    <span className="text-[11px] font-bold text-white drop-shadow">Anthem</span>
                  </Link>
                </div>
              )}

              {screen === 'chat' && klass && (
                <>
                  {header(klass.teacher_name)}
                  <ChatScreen teacherId={klass.teacher_id} teacherName={klass.teacher_name} />
                </>
              )}
              {screen === 'chat' && !klass && (
                <>
                  {header('Chat')}
                  <p className="pt-8 text-center text-xs text-white/50">You&apos;re not in a class yet, so there&apos;s no teacher to message.</p>
                </>
              )}

              {screen === 'friends' && (
                <>
                  {header('Friends')}
                  <FriendsScreen klass={klass} />
                </>
              )}

              {screen === 'badges' && (
                <>
                  {header('My Badges')}
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                    {achievements.length === 0 && <p className="pt-8 text-center text-xs text-white/40">No badges yet - keep going!</p>}
                    {achievements.map((a) => {
                      const Icon = achievementIcon(a.icon)
                      return (
                        <div key={a.id} className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: '#f2c94c' }}>
                            <Icon className="h-3.5 w-3.5 text-black" strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white">{a.name}</p>
                            <p className="truncate text-[10px] text-white/50">{a.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {screen === 'bank' && (
                <>
                  <div className="pb-2.5">{backButton}</div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <DigitalBankSection />
                  </div>
                </>
              )}

              {screen === 'prayer' && (
                <>
                  <div className="pb-2.5">{backButton}</div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <NotesSection kind="prayer" title="Prayer Journal" icon={Heart} accent="var(--lp-accent-bible)" placeholder="What's on your heart today?" />
                  </div>
                </>
              )}

              {screen === 'diary' && (
                <>
                  <div className="pb-2.5">{backButton}</div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <NotesSection kind="diary" title="Diary" icon={PenLine} accent="var(--lp-accent-anthem)" placeholder="Dear diary…" />
                  </div>
                </>
              )}

              {screen === 'calendar' && (
                <>
                  {header('Ministry Calendar')}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <MinistryCalendarReadOnly dark />
                  </div>
                </>
              )}
              {screen === 'collection' && (
                <>
                  {header('My Collection')}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <CharacterCollectionGallery achievements={achievements} onGoToJourney={() => onNavigate('bible')} />
                  </div>
                </>
              )}
              {screen === 'world' && (
                <>
                  {header('Pray for the World')}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <PrayerGlobe />
                  </div>
                </>
              )}
              {screen === 'buddy' && (
                <>
                  {header('Bible Buddy')}
                  <div className="min-h-0 flex-1">
                    <BibleBuddyChat
                      onAskTeacher={() => {
                        setScreen(null)
                        onNavigate('messages')
                      }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="absolute bottom-1 left-1/2 z-20 h-1 w-14 -translate-x-1/2 rounded-full bg-white/60" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function FriendsScreen({ klass }: { klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!klass) {
      setLoading(false)
      return
    }
    getLeaderboard(500)
      .then((all) => setRows(all.filter((r) => r.class_id === klass.id)))
      .finally(() => setLoading(false))
  }, [klass])

  if (!klass) return <p className="pt-8 text-center text-xs text-white/50">Join a class to see your classmates here.</p>
  if (loading) return <p className="pt-8 text-center text-xs text-white/40">Loading…</p>

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
      {rows.length === 0 && <p className="pt-8 text-center text-xs text-white/40">No classmates yet.</p>}
      {rows.map((r) => (
        <div key={r.student_id} className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-2.5">
          {r.avatar_url ? (
            <img src={r.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
              {r.full_name.charAt(0).toUpperCase()}
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-xs font-bold text-white">{r.full_name}</p>
          <span className="shrink-0 text-[10px] font-bold text-[var(--gold)]">{r.total_points.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// Home's chat is the same conversation as the standalone Messages tab
// (Ears for You is separate on purpose) - this is just the fun way in.
function ChatScreen({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

  // Land on the newest message, not the oldest one.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  useEffect(() => {
    if (!myId) return
    getOrCreateConversation(teacherId, myId).then((id) => {
      setConversationId(id)
      listMessages(id).then(setMessages)
    })
  }, [teacherId, myId])

  const send = async () => {
    if (!draft.trim() || !conversationId) return
    await sendMessage(conversationId, draft)
    setDraft('')
    playClick()
    listMessages(conversationId).then(setMessages)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="pb-2 text-xs text-white/50">{teacherName} · Your Sunday school teacher</p>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-[var(--gold)] text-black' : 'bg-white/10 text-white'}`}
          >
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="pt-8 text-center text-sm text-white/40">Say hi to your teacher!</p>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 pt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 rounded-full bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button onClick={send} aria-label="Send message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-black">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ShinyDigitalCard({
  student,
  klass,
  onViewFull,
}: {
  student: StudentRow | null
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  onViewFull: () => void
}) {
  return (
    <button
      onClick={() => {
        playClick()
        onViewFull()
      }}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-4 text-left shadow-xl transition hover:scale-[1.02]"
      style={{ background: 'linear-gradient(135deg, #7b2ff7 0%, #4a1a8a 55%, #2b0f5c 100%)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 45%, transparent 60%)' }}
      />
      {student?.avatar_url ? (
        <img src={student.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/50" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-extrabold text-white ring-2 ring-white/50">
          {(student?.full_name ?? '?').charAt(0).toUpperCase()}
        </span>
      )}
      <div className="relative z-10 min-w-0 flex-1">
        <p className="truncate font-display text-base font-extrabold text-white">{student?.full_name ?? 'My Card'}</p>
        <p className="truncate text-[11px] text-white/70">{klass?.name ?? 'No class yet'}</p>
        <p className="mt-0.5 text-xs font-bold text-white">{(student?.total_points ?? 0).toLocaleString()} pts</p>
      </div>
      <ArrowRight className="relative z-10 h-5 w-5 shrink-0 text-white/70" />
    </button>
  )
}

// Each picture is the story the game is actually about, so the art on a card
// says something rather than being whatever painting came next. The two that
// used cut-out feature props (a rocket, a trophy) sat in a row of paintings
// and read as placeholders, which is what they were.
const COMING_SOON_GAMES: { title: string; icon: LucideIcon; photo: string }[] = [
  // Words hidden in a grid, so the book of wise sayings.
  { title: 'Bible Word Search', icon: Grid3x3, photo: '/journey/books/proverbs.jpg' },
  // Matching pairs, so the animals going in two by two.
  { title: 'Memory Match', icon: Layers, photo: '/journey/noah-building-ark.jpg' },
  // Words put back in order, so the tower where language was scrambled.
  { title: 'Verse Scramble', icon: Shuffle, photo: '/journey/tower-of-babel.jpg' },
  // Building a story, so the book the first story is in.
  { title: 'Story Builder', icon: PencilLine, photo: '/journey/books/genesis.jpg' },
  // Numbers called out, so the book of Numbers.
  { title: 'Bible Bingo', icon: Puzzle, photo: '/journey/books/numbers.jpg' },
  // Colour, so the garden.
  { title: 'Coloring Book', icon: Palette, photo: '/journey/adam-eve-garden-home.jpg' },
  // Songs, so the songbook.
  { title: 'Sing-Along', icon: Music2, photo: '/journey/books/psalms.jpg' },
  // Sounds to name, so the trumpets at Jericho.
  { title: 'Guess the Sound', icon: Mic2, photo: '/journey/books/joshua.jpg' },
  // Casting a die, so the book whose feast is named after casting lots.
  { title: 'Roll & Answer', icon: Dice5, photo: '/journey/books/esther.jpg' },
  // Riddles, so Samson's riddle.
  { title: 'Brain Teasers', icon: Brain, photo: '/journey/books/judges.jpg' },
]

function BentoTile({
  title,
  description,
  icon: Icon,
  accent,
  dark,
  photo,
  cta,
  to,
  href,
  col,
  row,
}: {
  title: string
  description?: string
  icon: LucideIcon
  accent: string
  dark: string
  /** A cover photo behind the tile - jpg scene photos fill the whole tile; feature-*.png mascots stay contained and pinned to the bottom-right so their transparency reads cleanly. */
  photo: string
  cta?: string
  to?: string
  href?: string
  col: string
  row: string
}) {
  const big = row === '1 / 3'
  const isMascotPng = photo.endsWith('.png')
  const content = (
    <>
      {isMascotPng ? (
        <img src={photo} alt="" className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-auto object-contain opacity-90" />
      ) : (
        <img src={photo} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 70%, ${dark}) 0%, color-mix(in srgb, ${accent} 15%, ${dark}) 100%)`,
          opacity: isMascotPng ? 0.88 : 0.72,
        }}
      />
      <span
        className={`relative inline-flex items-center justify-center rounded-2xl bg-white/15 ${big ? 'h-12 w-12' : 'h-9 w-9'}`}
      >
        <Icon className={big ? 'h-6 w-6 text-white' : 'h-4 w-4 text-white'} strokeWidth={1.75} />
      </span>
      <p className={`relative font-display font-extrabold text-white drop-shadow ${big ? 'mt-3 text-xl' : 'mt-2 text-sm'}`}>{title}</p>
      {description && <p className="relative mt-1 max-w-[85%] text-xs text-white/85 drop-shadow">{description}</p>}
      {cta && (to || href) && (
        // The pill is white, and several of these accents (the gold one
        // especially) are unreadable on white at their own brightness -
        // "Practice Solo" measured 1.84:1 against it. Darkened enough to
        // clear 4.5:1 while staying the tile's own hue.
        <span
          className="relative mt-3 inline-flex items-center gap-1 self-start rounded-full bg-white px-3 py-1.5 text-xs font-extrabold"
          style={{ color: `color-mix(in srgb, ${accent} 58%, #000)` }}
        >
          {cta} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  )
  const className =
    'relative flex flex-col items-start overflow-hidden rounded-2xl p-4 transition hover:scale-[1.015] active:scale-[0.98]'
  const style: React.CSSProperties = { gridColumn: col, gridRow: row }

  if (to) {
    return (
      <Link to={to} onClick={() => playClick()} className={className} style={style}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => playClick()} className={className} style={style}>
        {content}
      </a>
    )
  }
  return (
    <div className={className} style={style}>
      {content}
    </div>
  )
}

function GameTab() {
  return (
    <div className="space-y-8 px-3 pt-3 sm:px-4">
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: '150px 96px' }}
      >
        <BentoTile
          title="Bible Quiz Live Match"
          description="Ask your teacher to start a live match! When they do, you'll join right from here."
          icon={Gamepad2}
          accent="var(--lp-accent-compete)"
          dark="#180a2e"
          photo="/hero-quiz.jpg"
          cta="Practice Solo"
          to="/training"
          col="1 / 4"
          row="1 / 3"
        />
        <BentoTile
          title="Practice Bible Quiz"
          description="Unlimited solo practice, no timer."
          icon={Dumbbell}
          accent="var(--lp-accent-training)"
          dark="#0b2e1a"
          photo="/feature-quiz.png"
          to="/training"
          col="4 / 6"
          row="1 / 2"
        />
        <BentoTile
          title="SuperBook Games"
          icon={Gamepad2}
          accent="var(--lp-accent-compete)"
          dark="#180a2e"
          photo="/trophy-leaderboard.jpg"
          href="https://id.superbook.cbn.com/games"
          col="4 / 5"
          row="2 / 3"
        />
        <BentoTile
          title="Question Bank"
          icon={BookOpen}
          accent="var(--lp-accent-questions)"
          dark="#0a1a2e"
          photo="/village/game-rocket.png"
          to="/questions"
          col="5 / 6"
          row="2 / 3"
        />
      </div>

      <GameRow title="More Games Coming Soon">
        {COMING_SOON_GAMES.map(({ title, icon, photo }) => (
          <GameTile key={title} title={title} icon={icon} photo={photo} accent="var(--ink-faint)" comingSoon />
        ))}
      </GameRow>
    </div>
  )
}

function GameRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <div className="mt-2 flex gap-2.5 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {children}
      </div>
    </div>
  )
}

function GameTile({
  title,
  icon: Icon,
  photo,
  accent,
  to,
  href,
  comingSoon,
}: {
  title: string
  icon: LucideIcon
  photo: string
  accent: string
  to?: string
  href?: string
  comingSoon?: boolean
}) {
  const isMascotPng = photo.endsWith('.png')
  const content = (
    <>
      {isMascotPng ? (
        <div className="flex h-20 w-full items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${accent} 14%, var(--ink-raised))` }}>
          <img src={photo} alt="" className="h-16 w-16 object-contain" />
        </div>
      ) : (
        <div className="relative h-20 w-full overflow-hidden rounded-xl">
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}
      <span
        className="relative -mt-6 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--ink-panel)]"
        style={{ background: `color-mix(in srgb, ${accent} 20%, var(--ink-panel))`, color: accent }}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <p className="mt-1 text-xs font-bold leading-tight">{title}</p>
      {comingSoon && (
        <span className="mt-1 rounded-full bg-[var(--ink-raised)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
          Soon
        </span>
      )}
    </>
  )
  const className = `flex w-32 shrink-0 flex-col items-center gap-0.5 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--ink-panel)] pb-3 text-center ${
    comingSoon ? 'opacity-75' : 'transition hover:scale-[1.05] active:scale-[0.96]'
  }`
  const style: React.CSSProperties = { scrollSnapAlign: 'start' }

  if (to) {
    return (
      <Link to={to} onClick={() => playClick()} className={className} style={style}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => playClick()} className={className} style={style}>
        {content}
      </a>
    )
  }
  return (
    <div className={className} style={style}>
      {content}
    </div>
  )
}

const CLASS_FEATURES = [
  { key: 'info', label: 'Class Info', icon: Users, from: '#60a5fa', to: '#1d4ed8' },
  { key: 'lessons', label: 'Lessons', icon: BookOpen, from: '#4ade80', to: '#15803d' },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList, from: '#fbbf24', to: '#b45309' },
  { key: 'verse', label: 'Memory Verse', icon: Heart, from: '#fb7185', to: '#be123c' },
  { key: 'notes', label: 'Notebook', icon: FileText, from: '#a78bfa', to: '#6d28d9' },
] as const
type ClassFeatureKey = (typeof CLASS_FEATURES)[number]['key']

function ClassTab({
  klass,
  student,
  onNestedViewChange,
}: {
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  student: StudentRow | null
  onNestedViewChange: (nested: boolean) => void
}) {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [lessons, setLessons] = useState<LectureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ClassFeatureKey | null>(null)
  const [openLesson, setOpenLesson] = useState<string | null>(null)

  useEffect(() => {
    if (!klass) {
      setLoading(false)
      return
    }
    Promise.all([listPublishedAssignments(klass.id), listPublishedLectures(klass.id)]).then(([a, l]) => {
      setAssignments(a)
      setLessons(l)
      setLoading(false)
    })
  }, [klass])

  useEffect(() => {
    onNestedViewChange(active !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Without a class there is nothing for a teacher to have posted, so the page
  // keeps its shape and the lesson column carries the join code instead of an
  // empty list. Notebook still opens, because it never needed a class.
  const locked = !klass
  const lesson = openLesson ? lessons.find((l) => l.id === openLesson) ?? null : null

  return (
    <div className="cp-screen min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-20 sm:pt-16">
        <div className="cp-body">
          <div className="flex flex-col items-center text-center">
            <p className="cp-eyebrow">{klass?.name ?? 'Your class'}</p>
            <h1 className="cp-head mt-3">
              Bible learning
              <br />
              for kids
            </h1>
            <div className="cp-hero my-5">
              <img src="/teacher-isometric.png" alt="" />
            </div>
            <p className="cp-cap">{klass ? `The easy way to learn the Bible with ${klass.teacher_name}` : 'The easy way to learn the Bible with your class'}</p>
            <button
              type="button"
              className="cp-go mt-5"
              onClick={() => {
                playClick()
                const first = lessons[0]
                if (first) setOpenLesson(first.id)
                else setActive('notes')
              }}
            >
              Start learning
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {/* The four class features that are not the lesson list itself.
                They were wedges on a dial before; here they are the row under
                the figure, and each opens the same panel it always did. */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {CLASS_FEATURES.filter((f) => f.key !== 'lessons').map((f) => {
                const isLocked = locked && f.key !== 'notes'
                const Icon = f.icon
                return (
                  <button
                    key={f.key}
                    type="button"
                    disabled={isLocked}
                    className="cp-chip"
                    onClick={() => {
                      playClick()
                      setActive(f.key)
                    }}
                  >
                    {isLocked ? <Lock className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />}
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'var(--cp-chip)', border: '1px solid var(--cp-line)' }}
              >
                <BookOpen className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <p className="text-left text-lg font-bold leading-tight">
                Choose
                <span className="block font-semibold" style={{ color: 'var(--cp-sub)' }}>
                  the lesson
                </span>
              </p>
            </div>

            {loading && <p className="text-sm" style={{ color: 'var(--cp-sub)' }}>Loading the lessons…</p>}
            {!loading && locked && <JoinClassNotice code={student?.student_code ?? null} />}
            {!loading && !locked && lessons.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--cp-sub)' }}>
                No lessons posted yet. When {klass?.teacher_name ?? 'your teacher'} posts one, it shows up here.
              </p>
            )}
            {!loading && lessons.length > 0 && (
              <div className="cp-cards">
                {lessons.map((l, i) => {
                  const art = lessonArt(l.title)
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`cp-card${i === 0 ? ' is-on' : ''}`}
                      onClick={() => {
                        playClick()
                        setOpenLesson(l.id)
                      }}
                    >
                      {art ? (
                        <img className="cp-shot" src={art.image} alt="" loading="lazy" />
                      ) : (
                        <span className="cp-shot flex items-center justify-center font-display text-3xl font-extrabold" style={{ color: 'var(--cp-sub)' }}>
                          {l.title.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <b>{l.title}</b>
                      <small>{i === 0 ? 'Start here' : art && art.scene.toLowerCase() !== l.title.toLowerCase() ? art.scene : 'Not started'}</small>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {lesson && <LessonSheet lecture={lesson} onClose={() => setOpenLesson(null)} />}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-md animate-page-in" onClick={(e) => e.stopPropagation()}>
            {klass ? (
              <ClassFeaturePanel
                feature={active}
                klass={klass}
                student={student}
                assignments={assignments}
                lessons={lessons}
                loading={loading}
                onClose={() => setActive(null)}
              />
            ) : (
              <ClassGlassPanel title="Notebook" onClose={() => setActive(null)}>
                <NotesSection
                  kind="notebook"
                  title="Notebook"
                  icon={FileText}
                  accent="var(--lp-accent-class)"
                  placeholder="Jot down what you're learning…"
                />
              </ClassGlassPanel>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** One lesson, opened from a card. The painting runs across the top the way it
 *  does on the card, so tapping through does not change what you were looking
 *  at, only how much of it you can read. */
function LessonSheet({ lecture, onClose }: { lecture: LectureRow; onClose: () => void }) {
  const art = lessonArt(lecture.title)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        style={{ background: '#fff', color: 'var(--cp-navy)', maxHeight: '86vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {art && <img src={art.image} alt="" className="block h-44 w-full object-cover" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the lesson"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto p-5" style={{ maxHeight: '60vh' }}>
          <p className="font-display text-xl font-extrabold leading-tight">{lecture.title}</p>
          {lecture.description && <p className="text-sm leading-relaxed">{lecture.description}</p>}
          {lecture.body && <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--cp-sub)' }}>{lecture.body}</p>}
          {!lecture.description && !lecture.body && (
            <p className="text-sm" style={{ color: 'var(--cp-sub)' }}>Your teacher has not written this one up yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** The glass shell ClassFeaturePanel uses, on its own so the locked screen can
 *  open the Notebook in exactly the same frame instead of a different card. */
function ClassGlassPanel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="w-full rounded-[28px] p-5"
      style={{
        background: 'rgba(12,10,20,0.72)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 30px 70px -20px rgba(0,0,0,0.65)',
        maxHeight: '72vh',
        overflowY: 'auto',
      }}
    >
      <div className="relative z-10 mb-3 flex items-center justify-between">
        <p className="font-display text-lg font-extrabold text-white">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Back to the dial"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}

/** What a child sees under the locked dial: what to do, and the code to do it
 *  with. Shown in the room rather than in place of it. */
function JoinClassNotice({ code }: { code: string | null }) {
  return (
    <div
      className="w-full max-w-sm rounded-2xl px-5 py-4 text-center"
      style={{
        background: 'rgba(12,10,20,0.72)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
      }}
    >
      <p className="font-display text-base font-extrabold text-white">Join a class to unlock these</p>
      <p className="mt-1 text-sm text-white/70">Give this code to your Sunday school teacher and they will add you.</p>
      {code ? (
        <p className="mt-3 font-display text-2xl font-extrabold tracking-[0.2em]" style={{ color: 'var(--gold)' }}>
          {code}
        </p>
      ) : (
        <p className="mt-3 text-sm text-white/50">Your code is still being made.</p>
      )}
    </div>
  )
}

function ClassFeaturePanel({
  feature,
  klass,
  student,
  assignments,
  lessons,
  loading,
  onClose,
}: {
  feature: ClassFeatureKey
  klass: ClassRow & { teacher_name: string; teacher_avatar: string | null }
  student: StudentRow | null
  assignments: AssignmentRow[]
  lessons: LectureRow[]
  loading: boolean
  onClose: () => void
}) {
  const titles: Record<ClassFeatureKey, string> = {
    info: 'Class Info',
    lessons: 'Lessons',
    assignments: 'Assignments',
    verse: 'Memory Verse',
    notes: 'Notebook',
  }

  return (
    <div
      className="w-full rounded-[28px] p-5"
      style={{
        background: 'rgba(12,10,20,0.72)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 30px 70px -20px rgba(0,0,0,0.65)',
        maxHeight: '72vh',
        overflowY: 'auto',
      }}
    >
      <div className="relative z-10 mb-3 flex items-center justify-between">
        <p className="font-display text-lg font-extrabold text-white">{titles[feature]}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Back to the dial"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {feature === 'info' && (
        <div className="rounded-2xl bg-white/8 p-4">
          <p className="font-bold text-white">{klass.name}</p>
          <p className="mt-1 text-sm text-white/70">Taught by {klass.teacher_name}</p>
        </div>
      )}

      {feature === 'lessons' && (
        <div className="space-y-2">
          {loading && <p className="text-sm text-white/60">Loading…</p>}
          {!loading && lessons.length === 0 && <p className="text-sm text-white/60">No lessons posted yet.</p>}
          {!loading && lessons.map((l) => <LessonCard key={l.id} lecture={l} />)}
        </div>
      )}

      {feature === 'assignments' && (
        <div className="space-y-2">
          {loading && <p className="text-sm text-white/60">Loading…</p>}
          {!loading && assignments.length === 0 && (
            <p className="text-sm text-white/60">No assignments right now. When your teacher posts one, you&apos;ll see it here.</p>
          )}
          {!loading && assignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
        </div>
      )}

      {feature === 'verse' && (
        <div className="rounded-2xl bg-white/8 p-5 text-center">
          {student?.favorite_verse ? (
            <>
              <p className="font-display text-base font-bold italic leading-relaxed text-white">&ldquo;{student.favorite_verse}&rdquo;</p>
              <a
                href={bibleComUrl(student.favorite_verse)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playClick()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#be123c]"
              >
                Read the Full Verse on Bible.com <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </>
          ) : (
            <p className="text-sm text-white/70">
              You haven&apos;t added a favourite verse yet. Add one from your Profile and it&apos;ll show up here.
            </p>
          )}
        </div>
      )}

      {feature === 'notes' && (
        <NotesSection kind="notebook" title="Notebook" icon={FileText} accent="var(--lp-accent-class)" placeholder="Jot down what you're learning…" />
      )}
    </div>
  )
}

function LessonCard({ lecture }: { lecture: LectureRow }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = Boolean(lecture.description || lecture.body)

  return (
    <button
      type="button"
      onClick={() => hasDetails && setExpanded((v) => !v)}
      className="w-full rounded-xl bg-white/8 p-3 text-left transition hover:bg-white/12"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-white">{lecture.title}</p>
        {hasDetails && <ChevronDown className={`h-4 w-4 shrink-0 text-white/60 transition ${expanded ? 'rotate-180' : ''}`} />}
      </div>
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {lecture.description && <p className="text-sm text-white/80">{lecture.description}</p>}
          {lecture.body && <p className="whitespace-pre-wrap text-sm text-white/70">{lecture.body}</p>}
        </div>
      )}
    </button>
  )
}

function AssignmentCard({ assignment }: { assignment: AssignmentRow }) {
  const [expanded, setExpanded] = useState(false)
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState<{ body: string | null; grade: number | null; feedback: string | null } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMySubmission(assignment.id).then((s) => {
      if (s) {
        setSubmitted({ body: s.body, grade: s.grade, feedback: s.feedback })
        setBody(s.body ?? '')
      }
      setLoaded(true)
    })
  }, [assignment.id])

  const overdue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false

  const submit = async () => {
    if (!body.trim()) return
    setSubmitting(true)
    try {
      await submitAssignment(assignment.id, body)
      setSubmitted({ body, grade: null, feedback: null })
      playClick()
      haptics.success()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl bg-white/8 p-3">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-start justify-between gap-2 text-left">
        <div>
          <p className="font-bold text-white">{assignment.title}</p>
          {assignment.due_date && (
            <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
              <Clock className="h-3 w-3" /> Due {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
            submitted?.grade !== null && submitted?.grade !== undefined
              ? 'bg-emerald-500/20 text-emerald-300'
              : submitted
                ? 'bg-white/10 text-white/60'
                : overdue
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-[var(--gold)]/20 text-[var(--gold)]'
          }`}
        >
          {submitted?.grade !== null && submitted?.grade !== undefined ? 'Graded' : submitted ? 'Submitted' : overdue ? 'Overdue' : 'Open'}
        </span>
      </button>

      {expanded && loaded && (
        <div className="mt-3 space-y-2">
          {assignment.instructions && <p className="whitespace-pre-wrap text-sm text-white/70">{assignment.instructions}</p>}
          {submitted?.grade !== null && submitted?.grade !== undefined ? (
            <div className="rounded-md bg-emerald-500/15 p-3 text-sm">
              <p className="font-bold text-emerald-300">
                Grade: {submitted.grade}
                {assignment.max_score ? ` / ${assignment.max_score}` : ''}
              </p>
              {submitted.feedback && <p className="mt-1 text-white/70">{submitted.feedback}</p>}
            </div>
          ) : (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your answer…"
                rows={3}
                className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
              />
              <button onClick={submit} disabled={submitting} className="btn-solid px-4 py-2 text-sm">
                {submitting ? 'Submitting…' : submitted ? 'Update Submission' : 'Submit'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A huge, freestanding icon that floats directly over the Sunday School
 * hero photo - no card/panel behind it, positioned by the caller (percentage
 * `left` + a slight rotation) so a row of these reads as scattered stickers
 * rather than a uniform grid.
 */
function HugeHeroIcon({
  image,
  label,
  value,
  size,
  left,
  rotate,
  top,
  onClick,
}: {
  image: string
  label: string
  value?: string
  /** Any CSS length, so it can scale with the viewport instead of a fixed pixel size. */
  size: string
  left: string
  rotate: number
  top: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="absolute flex flex-col items-center gap-2 transition hover:scale-[1.06] active:scale-[0.96]"
      style={{ left, top, transform: `translateX(-50%) rotate(${rotate}deg)` }}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          height: size,
          width: size,
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.38)',
          boxShadow: '0 14px 32px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        <img src={image} alt="" className="h-[66%] w-[66%] object-contain drop-shadow-xl" />
      </span>
      {value && <span className="font-display text-xl font-extrabold text-white drop-shadow-md">{value}</span>}
      <span className="max-w-[8rem] text-center text-xs font-bold leading-tight text-white drop-shadow-md">{label}</span>
    </button>
  )
}

function SundaySchoolTab({
  klass,
  onNestedViewChange,
}: {
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  onNestedViewChange: (nested: boolean) => void
}) {
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [streakOpen, setStreakOpen] = useState(false)
  const [streak, setStreak] = useState(0)
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!klass) {
      setUnlockedDates(new Set())
      return
    }
    listUnlockedSundays(klass.id).then((dates) => setUnlockedDates(new Set(dates)))
  }, [klass])

  useEffect(() => {
    getMyBibleStreak().then(setStreak)
  }, [])

  useEffect(() => {
    onNestedViewChange(journeyOpen || streakOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyOpen, streakOpen])

  if (journeyOpen) {
    return <BibleJourneyPanel onExit={() => setJourneyOpen(false)} />
  }

  if (streakOpen) {
    return (
      <StreakScreen
        onBack={() => setStreakOpen(false)}
        onContinue={() => window.open('https://www.bible.com/reading-plans', '_blank', 'noopener,noreferrer')}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div
        className="relative w-full overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(11,46,26,0.3) 0%, rgba(11,46,26,0.72) 100%), url(/icons/sunday-school-cover.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 65%',
          minHeight: 400,
        }}
      >
        <div className="px-5 pt-5">
          <p className="max-w-xs text-sm text-white/85 drop-shadow-md">
            Everything for growing your faith, one day at a time.
          </p>
        </div>

        <HugeHeroIcon
          image="/icons/streak-flame.png"
          label="Bible Reading Plan"
          value={String(streak)}
          size="min(38vw, 170px)"
          left="27%"
          top={130}
          rotate={-8}
          onClick={() => {
            playClick()
            setStreakOpen(true)
          }}
        />
        <HugeHeroIcon
          image="/icons/bible-journey-book.png"
          label="Bible Journey"
          size="min(44vw, 200px)"
          left="72%"
          top={105}
          rotate={5}
          onClick={() => {
            playClick()
            setJourneyOpen(true)
          }}
        />
      </div>

      <div className="space-y-3 px-4">
        <p className="eyebrow mx-auto max-w-2xl">Calendar</p>
        <SundayCalendarPath unlockedDates={unlockedDates} />
      </div>
    </div>
  )
}

// A Sunday is unlocked once it's actually happened (kids shouldn't be
// stuck waiting on a teacher to unlock last month) or once the teacher has
// unlocked it early for their class.
const TODAY_START = new Date()
TODAY_START.setHours(0, 0, 0, 0)

const CALENDAR_COLS = 4
const CALENDAR_MAX_WIDTH = 1040
const CALENDAR_CARD_GAP = 18
// The card is aspect-square, so its rendered height always equals its
// rendered width - row height has to be derived from that same width
// (not an independent guess) or rows overlap as soon as the container
// gets wide enough to make the cards bigger than a fixed row height.
const CALENDAR_CARD_WIDTH = CALENDAR_MAX_WIDTH / CALENDAR_COLS - CALENDAR_CARD_GAP
const CALENDAR_ROW_HEIGHT = CALENDAR_CARD_WIDTH + 34

// The weekly calendar cards laid out as a snaking, roped-together path
// (left-to-right, then right-to-left down the next row, like a board game
// track) instead of a plain grid, so it reads as one step-by-step journey
// and fills the full width instead of being capped to a narrow column.
function SundayCalendarPath({ unlockedDates }: { unlockedDates: Set<string> }) {
  const rows = Math.ceil(SUNDAYS_2026.length / CALENDAR_COLS)
  const totalHeight = rows * CALENDAR_ROW_HEIGHT

  const positions = SUNDAYS_2026.map((_, i) => {
    const row = Math.floor(i / CALENDAR_COLS)
    const colInRow = i % CALENDAR_COLS
    const col = row % 2 === 0 ? colInRow : CALENDAR_COLS - 1 - colInRow
    const xPct = ((col + 0.5) / CALENDAR_COLS) * 100
    const y = row * CALENDAR_ROW_HEIGHT + CALENDAR_ROW_HEIGHT / 2
    return { xPct, y }
  })
  const pathD = positions.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPct} ${p.y}`).join(' ')

  return (
    <div className="relative mx-auto" style={{ height: totalHeight, maxWidth: CALENDAR_MAX_WIDTH }}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none">
        <path
          d={pathD}
          fill="none"
          stroke="#8b5e3c"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray="3 16"
          opacity={0.6}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {SUNDAYS_2026.map((date, i) => {
        const theme = SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length]
        const key = sundayDateKey(date)
        // Every Sunday up to today is open to any child, whether or not they
        // have been put in a class yet. The old rule started with `!klass ||`,
        // so a child with no class saw a padlock on every single week
        // including ones months in the past. A teacher can still open a future
        // Sunday early for their own class, which is what unlockedDates is.
        const locked = date > TODAY_START && !unlockedDates.has(key)
        const { xPct, y } = positions[i]
        return (
          <div
            key={key}
            className="absolute"
            style={{ left: `${xPct}%`, top: y, transform: 'translate(-50%, -50%)', width: `calc(${100 / CALENDAR_COLS}% - ${CALENDAR_CARD_GAP}px)` }}
          >
            <SundayLessonCard date={date} title={theme.title} image={theme.image} locked={locked} />
          </div>
        )
      })}
    </div>
  )
}

function SundayLessonCard({ date, title, image, locked }: { date: Date; title: string; image: string; locked: boolean }) {
  const isMascotPng = image.endsWith('.png')
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--ink-panel)]">
      {isMascotPng ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--lp-accent-bible) 16%, var(--ink-panel))' }}
        >
          <img src={image} alt="" className={`h-2/3 w-2/3 object-contain ${locked ? 'opacity-40' : ''}`} />
        </div>
      ) : (
        <img src={image} alt="" className={`h-full w-full object-cover ${locked ? 'opacity-40' : ''}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55">
            <Lock className="h-4 w-4 text-white" />
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-xs font-bold leading-tight text-white">{title}</p>
      </div>
    </div>
  )
}

const RANGES: { key: LeaderboardRange; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
]

type BoardKey = 'points' | 'streak'

/** "5th", "1st". The board shows a child their own place as a word, not a
 *  bare number in a column, so it reads at a glance. */
function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** Two initials, for a child who has no picture yet. Never an icon at a
 *  different size to everybody else's photo: that is what made the old rows
 *  different heights. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** A stable colour per child, so the same name always gets the same plate. */
function plateFor(id: string): string {
  const hues = [265, 292, 210, 24, 150, 340, 190, 45]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return `hsl(${hues[h % hues.length]} 42% 42%)`
}

function Avatar({ row, size = 32 }: { row: RankedLeaderboardRow; size?: number }) {
  const style: CSSProperties = { width: size, height: size }
  if (row.avatar_url) {
    return <img src={row.avatar_url} alt="" className="shrink-0 rounded-full object-cover" style={style} />
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ ...style, background: plateFor(row.student_id), fontSize: size * 0.36 }}
    >
      {initialsOf(row.full_name)}
    </span>
  )
}

/** Where a child sits in the current window against the next wider one. The
 *  reference board carries an up/down arrow per row, and all four windows are
 *  already loaded, so this is real movement rather than decoration. */
const WIDER: Record<LeaderboardRange, LeaderboardRange | null> = { week: 'month', month: 'year', year: 'all', all: null }

function movementOf(
  id: string,
  range: LeaderboardRange,
  byRange: Record<LeaderboardRange, RankedLeaderboardRow[]>,
  board: BoardKey,
): 'up' | 'down' | 'same' {
  const wider = WIDER[range]
  if (!wider) return 'same'
  const place = (rows: RankedLeaderboardRow[]) => {
    const sorted = [...rows].sort((a, b) => (board === 'points' ? b.points - a.points : b.streak - a.streak))
    const i = sorted.findIndex((r) => r.student_id === id)
    return i === -1 ? null : i
  }
  const now = place(byRange[range])
  const before = place(byRange[wider])
  if (now === null || before === null || now === before) return 'same'
  return now < before ? 'up' : 'down'
}

function PodiumFace({ row, place }: { row: RankedLeaderboardRow; place: number }) {
  return (
    <div className={`pod is-${place}`}>
      <Crown className="crown" strokeWidth={2.25} aria-hidden />
      <div className="ring">
        {row.avatar_url ? <img src={row.avatar_url} alt="" /> : initialsOf(row.full_name).slice(0, 1)}
        <b>{place}</b>
      </div>
      <div className="nm truncate">{row.full_name.split(/\s+/)[0]}</div>
      <div className="pt">{row.points.toLocaleString()}</div>
    </div>
  )
}

function LeaderboardTab({ myId }: { myId: string | null }) {
  const [range, setRange] = useState<LeaderboardRange>('week')
  const [board, setBoard] = useState<BoardKey>('points')
  // Every window is loaded once, because opening a child's card shows where
  // they sit in all four of them and a second round trip per tap would make
  // the sheet feel slow.
  const [byRange, setByRange] = useState<Record<LeaderboardRange, RankedLeaderboardRow[]> | null>(null)
  const [failed, setFailed] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = () => {
    setFailed(false)
    setByRange(null)
    Promise.all(RANGES.map((r) => getRankedLeaderboard(r.key)))
      .then(([week, month, year, all]) => setByRange({ week, month, year, all }))
      .catch(() => setFailed(true))
  }
  useEffect(load, [])

  const sorted = useMemo(() => {
    if (!byRange) return []
    const rows = [...byRange[range]]
    rows.sort((a, b) =>
      board === 'points' ? b.points - a.points || a.full_name.localeCompare(b.full_name) : b.streak - a.streak || b.points - a.points,
    )
    return rows
  }, [byRange, range, board])

  const open = openId && byRange ? byRange[range].find((r) => r.student_id === openId) : null

  if (failed) {
    return (
      <div className="panel space-y-3 p-6 text-center">
        <p className="font-display text-lg font-bold">We could not load the board</p>
        <p className="text-sm text-[var(--ink-muted)]">The connection may have dropped.</p>
        <button onClick={load} className="btn-solid">
          Try again
        </button>
      </div>
    )
  }
  if (!byRange) return <p className="p-4 text-sm text-[var(--ink-muted)]">Loading the board…</p>

  const podium = sorted.slice(0, 3)
  const rest = sorted.slice(3)
  const myPlace = myId ? sorted.findIndex((r) => r.student_id === myId) : -1
  const mine = myPlace === -1 ? null : sorted[myPlace]
  const value = (r: RankedLeaderboardRow) => (board === 'points' ? r.points.toLocaleString() : String(r.streak))
  const unit = board === 'points' ? 'pts' : 'days'

  const rowFor = (r: RankedLeaderboardRow, place: number, cls: string) => (
    <button
      key={r.student_id}
      onClick={() => {
        playClick()
        setOpenId(r.student_id)
      }}
      className={cls}
    >
      <span className="lb-rank">{place}</span>
      <i className={`lb-arrow is-${movementOf(r.student_id, range, byRange, board)}`} />
      <Avatar row={r} />
      <span className="lb-name truncate">
        {r.full_name}
        <span className="truncate">{r.class_name ?? 'No class yet'}</span>
      </span>
      <span className="lb-pts">
        {value(r)} {unit}
      </span>
    </button>
  )

  return (
    <div className="lb-screen -mx-4 -mt-2 space-y-4 rounded-2xl px-4 py-4 sm:mx-0 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="lb-tabs min-w-[240px] flex-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                playClick()
                setRange(r.key)
              }}
              className={`lb-tab${range === r.key ? ' is-on' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="lb-tabs">
          {(['points', 'streak'] as const).map((b) => (
            <button
              key={b}
              onClick={() => {
                playClick()
                setBoard(b)
              }}
              className={`lb-tab flex items-center gap-1.5${board === b ? ' is-on' : ''}`}
            >
              {b === 'points' ? <Trophy className="h-3.5 w-3.5" strokeWidth={2} /> : <Flame className="h-3.5 w-3.5" strokeWidth={2} />}
              {b === 'points' ? 'Points' : 'Streak'}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="lb-list p-6 text-center text-sm" style={{ color: 'var(--lb-mute)' }}>
          Nobody has scored in this window yet. Be the first!
        </p>
      ) : (
        <div className="lb-body">
          <div className="space-y-4">
            <div className="lb-podium">
              {/* Second, first, third - the winner stands in the middle. */}
              {podium[1] && <PodiumFace row={podium[1]} place={2} />}
              {podium[0] && <PodiumFace row={podium[0]} place={1} />}
              {podium[2] && <PodiumFace row={podium[2]} place={3} />}
            </div>
            {mine && (
              <div className="lb-stat">
                <div>
                  <b>{value(mine)}</b>
                  <span>{board === 'points' ? 'Your points' : 'Your streak'}</span>
                </div>
                <div>
                  <b>{ordinal(myPlace + 1)}</b>
                  <span>Your place</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {rest.length > 0 && <div className="lb-list">{rest.map((r, i) => rowFor(r, i + 4, 'lb-row'))}</div>}
            {/* Pinned only when you are not already on the podium, so the board
                never shows the same child twice. */}
            {mine && myPlace >= 3 && rowFor(mine, myPlace + 1, 'lb-you')}
          </div>
        </div>
      )}

      {open && <PlayerSheet row={open} byRange={byRange} onClose={() => setOpenId(null)} />}
    </div>
  )
}

/**
 * A child's card, opened from the board. It rises over the list rather than
 * replacing the page, so you keep your place in the standings.
 */
function PlayerSheet({
  row,
  byRange,
  onClose,
}: {
  row: RankedLeaderboardRow
  byRange: Record<LeaderboardRange, RankedLeaderboardRow[]>
  onClose: () => void
}) {
  const rankIn = (key: LeaderboardRange) => {
    const rows = [...byRange[key]].sort((a, b) => b.points - a.points || a.full_name.localeCompare(b.full_name))
    const idx = rows.findIndex((r) => r.student_id === row.student_id)
    return idx < 0 ? null : idx + 1
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/45" />
      <div className="relative w-full max-w-md rounded-t-3xl bg-[var(--ink-raised)] p-5 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--hairline-strong)] sm:hidden" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-panel)] text-[var(--ink-muted)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-4">
          <Avatar row={row} size={64} />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-extrabold text-[var(--fg)]">{row.full_name}</p>
            <p className="truncate text-sm text-[var(--ink-muted)]">{row.class_name ?? 'No class yet'}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Points', value: row.points.toLocaleString() },
            { label: 'Games', value: String(row.games) },
            { label: 'Streak', value: `${row.streak}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-[var(--ink-panel)] px-2 py-3">
              <p className="font-display text-xl font-extrabold tabular-nums text-[var(--fg)]">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">Where they rank</p>
        <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--hairline)]">
          {RANGES.map((r) => {
            const place = rankIn(r.key)
            return (
              <div
                key={r.key}
                className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="text-[var(--ink-muted)]">{r.label}</span>
                <span className="font-display font-bold tabular-nums text-[var(--fg)]">{place === null ? '-' : `#${place}`}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Every state My Card can be in. The tab used to render ProfileTab only when
 * the student row was loaded and nothing at all otherwise, which is why a
 * failed or slow lookup showed as an empty page rather than as a problem.
 */
function CardTab({
  student,
  state,
  klass,
  onSaved,
  onRetry,
}: {
  student: StudentRow | null
  state: 'loading' | 'ready' | 'error'
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  onSaved: () => void
  onRetry: () => void
}) {
  if (state === 'ready' && student) return <ProfileTab student={student} klass={klass} onSaved={onSaved} />

  if (state === 'loading') {
    return (
      <div className="panel space-y-3 p-6 text-center">
        <Sparkles className="mx-auto h-7 w-7 animate-pulse" style={{ color: 'var(--gold)' }} strokeWidth={1.75} />
        <p className="font-display text-lg font-bold">Getting your card</p>
        <p className="text-sm text-[var(--ink-muted)]">One second.</p>
      </div>
    )
  }

  // 'error', or 'ready' with no row at all - a signed-in child should always
  // have one, so either way this is something gone wrong rather than an empty
  // state a child can act on.
  return (
    <div className="panel space-y-3 p-6 text-center">
      <p className="font-display text-lg font-bold">We couldn&apos;t load your card</p>
      <p className="text-sm text-[var(--ink-muted)]">
        Your card is still on its way, or the connection dropped. Tap to try again.
      </p>
      <button onClick={onRetry} className="btn-solid inline-flex">
        Try again
      </button>
    </div>
  )
}

function ProfileTab({ student, klass, onSaved }: { student: StudentRow; klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null; onSaved: () => void }) {
  const [bio, setBio] = useState(student.bio ?? '')
  const [verse, setVerse] = useState(student.favorite_verse ?? '')
  const [quote, setQuote] = useState(student.favorite_quote ?? '')
  // Their own newest picture, approved or not - a child should see what they
  // uploaded, even while it is waiting on their teacher. Everybody else keeps
  // seeing the last approved one.
  const [avatar, setAvatar] = useState(student.pending_avatar_url ?? student.avatar_url)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [parentCode, setParentCode] = useState<string | null>(null)
  const [parentCodeCopied, setParentCodeCopied] = useState(false)

  useEffect(() => {
    getOrCreateParentLinkCode().then(setParentCode)
  }, [])

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setAvatar(await fileToResizedDataUrl(file))
  }

  const copyStudentCode = async () => {
    if (!student.student_code) return
    try {
      await navigator.clipboard.writeText(student.student_code)
      setCodeCopied(true)
      playClick()
      window.setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // clipboard unavailable — the code is already visible on screen
    }
  }

  const copyParentCode = async () => {
    if (!parentCode) return
    try {
      await navigator.clipboard.writeText(parentCode)
      setParentCodeCopied(true)
      playClick()
      window.setTimeout(() => setParentCodeCopied(false), 2000)
    } catch {
      // clipboard unavailable — the code is already visible on screen
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
      // The database screens this text before it saves anything, and the
      // message it sends back already says what to take out, in words a child
      // can act on. Show it as it is rather than replacing it with "something
      // went wrong", which would leave them guessing.
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel space-y-3 p-5">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            {avatar ? (
              <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--gold)]/60" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
                <User className="h-7 w-7" strokeWidth={1.75} />
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          <div>
            <p className="text-sm text-[var(--ink-muted)]">Tap your photo to change it</p>
            {student.avatar_status === 'pending' && (
              <p className="mt-1 text-xs font-bold text-[var(--gold)]">
                Your teacher is having a look at this one. Your class will see it once they say yes.
              </p>
            )}
            {student.avatar_status === 'rejected' && (
              <p className="mt-1 text-xs font-bold text-[var(--gold)]">
                Your teacher asked for a different picture. Tap to pick another one.
              </p>
            )}
          </div>
        </div>

        {student.student_code && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">Your Student Code</p>
              <p className="font-display text-lg font-extrabold tracking-widest text-[var(--gold)]">{student.student_code}</p>
            </div>
            <button
              onClick={copyStudentCode}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--gold)]/40 px-3 py-1.5 text-xs font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
            >
              {codeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {codeCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
        {student.student_code && (
          <p className="text-xs text-[var(--ink-faint)]">Give this to your teacher so they can add you to your class.</p>
        )}

        {parentCode && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--hairline-strong)] px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">Parent Link Code</p>
              <p className="font-display text-lg font-extrabold tracking-widest">{parentCode}</p>
            </div>
            <button
              onClick={copyParentCode}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] px-3 py-1.5 text-xs font-bold transition hover:bg-[var(--ink-panel)]"
            >
              {parentCodeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {parentCodeCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
        {parentCode && (
          <p className="text-xs text-[var(--ink-faint)]">
            Give this to a parent so they can follow your progress on their own dashboard.
          </p>
        )}

        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about me…" rows={2} className={inputClass} />
        <input value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="Favorite Bible verse" className={inputClass} />
        <input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Favorite quote" className={inputClass} />
        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" /> Saved
          </p>
        )}
        {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <button onClick={save} disabled={saving} className="btn-solid w-full py-3">
          {saving ? 'Saving…' : 'Save My Profile'}
        </button>
      </div>

      <div
        className="space-y-3 rounded-2xl p-5 text-center"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--lp-accent-achievements) 70%, #180a2e) 0%, color-mix(in srgb, var(--lp-accent-achievements) 15%, #180a2e) 100%)',
        }}
      >
        <p className="eyebrow text-white/70">My Digital ID Card</p>
        {cardUrl ? (
          <img src={cardUrl} alt="My ID card" className="mx-auto max-w-[260px] rounded-lg shadow-xl" />
        ) : (
          <p className="text-sm text-white/70">Generate a shareable card with your photo, verse, and points.</p>
        )}
        <div className="flex justify-center gap-2">
          <button onClick={makeCard} disabled={rendering} className="flex items-center gap-1.5 rounded-md border border-white/25 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
            <Sparkles className="h-4 w-4" /> {rendering ? 'Making…' : cardUrl ? 'Re-generate' : 'Generate Card'}
          </button>
          {cardUrl && (
            <button onClick={shareCard} className="flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-bold" style={{ color: 'var(--lp-accent-achievements)' }}>
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--ink-faint)]">Built by Zebraish</p>
    </div>
  )
}

/**
 * My Teacher before a teacher exists. Same room, same phone, same chat shape
 * as the real thing - the conversation is simply locked, with the code that
 * unlocks it on the screen. It used to throw all of that away for a white
 * card on an empty page, which read as broken rather than as not-yet.
 */
function MessagesLockedTab({ code }: { code: string | null }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <img src="/teacher-home-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <IsometricPhone accent="var(--lp-accent-training)">
          <div className="flex flex-1 flex-col overflow-hidden px-4 pb-5">
            <div className="flex items-center gap-3 pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-2 ring-white/20">
                <Lock className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-extrabold text-white">No teacher yet</p>
                <p className="text-xs text-white/50">This chat unlocks when you join a class</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-white/70">Give this code to your Sunday school teacher and they will add you.</p>
              {code ? (
                <p className="font-display text-2xl font-extrabold tracking-[0.2em]" style={{ color: 'var(--gold)' }}>
                  {code}
                </p>
              ) : (
                <p className="text-sm text-white/40">Your code is still being made.</p>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                disabled
                placeholder="Write a message…"
                className="flex-1 cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/40 outline-none placeholder:text-white/25"
              />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/35">
                <Lock className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
          </div>
        </IsometricPhone>
      </div>
    </div>
  )
}

function MessagesTab({ teacherId, teacherName, teacherAvatar }: { teacherId: string; teacherName: string; teacherAvatar: string | null }) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

  // Land on the newest message, not the oldest one.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  useEffect(() => {
    if (!myId) return
    getOrCreateConversation(teacherId, myId).then((id) => {
      setConversationId(id)
      listMessages(id).then(setMessages)
    })
  }, [teacherId, myId])

  const send = async () => {
    if (!draft.trim() || !conversationId) return
    await sendMessage(conversationId, draft)
    setDraft('')
    playClick()
    listMessages(conversationId).then(setMessages)
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <img src="/teacher-home-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <IsometricPhone accent="var(--lp-accent-training)">
          <div className="flex flex-1 flex-col overflow-hidden px-4 pb-5">
            <div className="flex items-center gap-3 pb-4">
              {teacherAvatar ? (
                <img src={teacherAvatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/30" />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-extrabold text-white ring-2 ring-white/30">
                  {teacherName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-base font-extrabold text-white">{teacherName}</p>
                <p className="text-xs text-white/50">Your Sunday school teacher</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-[var(--gold)] text-black' : 'bg-white/10 text-white'}`}
                >
                  {m.body}
                </div>
              ))}
              {messages.length === 0 && <p className="pt-8 text-center text-sm text-white/40">Say hi to your teacher!</p>}
              <div ref={bottomRef} />
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                onClick={send}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--gold)' }}
                aria-label="Send"
              >
                <Send className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        </IsometricPhone>
      </div>
    </div>
  )
}

const EARS_STATUS_LABEL: Record<string, string> = {
  new: 'Sent',
  acknowledged: 'Seen by your teacher',
  in_progress: 'Being looked into',
  escalated: 'With ministry leadership',
  resolved: 'Resolved',
}

function EarsTab({ klass }: { klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null }) {
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<EarsMessageRow[]>([])

  const load = () => listMyEarsMessages().then(setHistory)
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

  return (
    <div className="fixed inset-0 z-0">
      <img src="/village/ears-grass-bg.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10 h-full overflow-y-auto px-4 pb-12 pt-16 sm:pt-20">
        <div className="mx-auto max-w-md space-y-6">
          <div className="rounded-md border border-[var(--gold)]/25 bg-[var(--gold)]/10 p-4 text-sm text-[var(--gold)] backdrop-blur">
            You can talk to us. Share something that's worrying you, a question, or anything you'd like an adult to know. If you or someone you know
            is ever in danger, please tell a trusted adult right away.
          </div>

          <div className="relative pt-6">
            <img
              src="/village/ears-hearttree.png"
              alt=""
              className="pointer-events-none absolute -right-16 -top-14 z-0 w-48 rotate-6 drop-shadow-xl sm:-right-28 sm:-top-20 sm:w-64"
            />
            <div className="panel relative z-10 space-y-3 p-5">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write anything on your mind…"
                rows={4}
                className={`${inputClass} relative z-10`}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAnonymous(true)}
                  className={`rounded-md border p-3 text-left text-sm transition ${anonymous ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-[var(--hairline-strong)] hover:border-[var(--ink-muted)]'}`}
                >
                  <p className="font-bold">Anonymous</p>
                  <p className="text-[var(--ink-muted)]">Your teacher won&apos;t know it&apos;s you.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAnonymous(false)}
                  className={`rounded-md border p-3 text-left text-sm transition ${!anonymous ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-[var(--hairline-strong)] hover:border-[var(--ink-muted)]'}`}
                >
                  <p className="font-bold">With My Name</p>
                  <p className="text-[var(--ink-muted)]">Your teacher can follow up with you.</p>
                </button>
              </div>
              <button type="button" onClick={submit} disabled={submitting || !klass} className="btn-solid w-full py-3">
                {submitting ? 'Sending…' : 'Send'}
              </button>
              {!klass && (
                <p className="text-center text-xs text-[var(--ink-muted)]">
                  You need to be in a class first, so this goes to your own teacher. Give your Student Code to your
                  Sunday school teacher and they will add you.
                </p>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">My Messages</p>
              {history.map((m) => (
                <EarsHistoryItem key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EarsHistoryItem({ message }: { message: EarsMessageRow }) {
  const [replies, setReplies] = useState<EarsReplyRow[] | null>(null)

  useEffect(() => {
    listEarsReplies(message.id).then(setReplies)
  }, [message.id])

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[var(--ink-muted)]">{message.body}</p>
        <span className="shrink-0 rounded px-2 py-1 text-xs font-bold text-[var(--ink-muted)]">{EARS_STATUS_LABEL[message.status] ?? message.status}</span>
      </div>
      {replies?.map((r) => (
        <div key={r.id} className="mt-2 rounded-md bg-[var(--gold)]/10 p-3 text-sm">
          <p className="mb-1 font-semibold text-[var(--gold)]">Your teacher&apos;s reply:</p>
          <p>{r.body}</p>
        </div>
      ))}
    </div>
  )
}
