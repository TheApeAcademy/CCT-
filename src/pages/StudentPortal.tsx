import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  Swords,
  Star,
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
  Map,
  Compass,
  GraduationCap,
  ArrowRight,
  Lock,
  Wallet,
  PenLine,
  Heart,
  FileText,
  X,
  Users,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import VillageMap from '../components/VillageMap'
import BibleJourneyPanel from '../components/BibleJourney'
import IsometricPhone from '../components/IsometricPhone'
import { NotesSection, DigitalBankSection } from '../components/PersonalVault'
import { useAutoHideNav } from '../lib/useAutoHideNav'
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  getMyClass,
  getLeaderboard,
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
  type EarnedAchievement,
  type StudentRow,
  type LeaderboardRow,
  type MessageRow,
  type EarsMessageRow,
  type EarsReplyRow,
  type ClassRow,
  type LectureRow,
  type AssignmentRow,
} from '../lib/ministry'
import { fileToResizedDataUrl } from '../lib/image'
import { renderIdCardPng } from '../lib/idCard'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function StudentPortal() {
  const { session, profile, loading } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session || profile?.role !== 'student') {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <User className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Children&apos;s Dashboard</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Sign up with just your name and a passcode to get your own dashboard &mdash; no class code needed. Your
          teacher will add you to your class once you&apos;re in.
        </p>
        <Link to="/join" className="btn-solid inline-flex">
          Sign Up
        </Link>
      </div>
    )
  }
  return <Dashboard />
}

type Tab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears' | 'game'

const TAB_TITLE: Record<Tab, string> = {
  home: 'My House',
  class: 'My Class',
  bible: 'Sunday School',
  leaderboard: 'Leaderboard',
  profile: 'My Card',
  messages: 'My Teacher',
  ears: 'Ears for You',
  game: 'Games',
}

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

function Dashboard() {
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<'map' | 'tab'>('map')
  const [student, setStudent] = useState<StudentRow | null>(null)
  const [klass, setKlass] = useState<(ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null>(null)
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])

  const load = () => {
    getMyStudentProfile().then(setStudent)
    getMyClass().then(setKlass)
    listMyAchievements().then(setAchievements)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enterTab = (t: Tab) => {
    playNav()
    setTab(t)
    setView('tab')
  }
  const backToMap = () => {
    playClick()
    setView('map')
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
  const tabNavHidden = useAutoHideNav(tabScrollRef)

  // Fixed, full-viewport: this is the whole kids app once signed in - it
  // deliberately breaks out of KidsShell's padded max-w-3xl column so the
  // village map and each section can go edge to edge, game-screen style.
  return (
    <div className="fixed inset-0 z-30 bg-[var(--ink)]">
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
            <div
              className={`sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--lp-hairline)] bg-[var(--ink)]/80 px-4 py-3 backdrop-blur transition-transform duration-300 ${
                tabNavHidden ? '-translate-y-full' : 'translate-y-0'
              }`}
            >
              <button
                onClick={backToMap}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition hover:scale-105"
                style={{ borderColor: TAB_ACCENT[tab], color: TAB_ACCENT[tab] }}
                aria-label="Back to the village map"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
              </button>
              <h1 className="font-display text-lg font-extrabold text-[var(--lp-heading)]">{TAB_TITLE[tab]}</h1>
            </div>
            <div className={tab === 'bible' || tab === 'game' || tab === 'home' || tab === 'class' || tab === 'ears' || tab === 'messages' ? 'pb-12' : 'mx-auto max-w-2xl p-4 pb-12'}>
              {tab === 'home' && <HomeTab student={student} klass={klass} achievements={achievements} onNavigate={enterTab} />}
              {tab === 'class' && <ClassTab klass={klass} student={student} />}
              {tab === 'bible' && <SundaySchoolTab klass={klass} />}
              {tab === 'leaderboard' && <LeaderboardTab myId={student?.id ?? null} />}
              {tab === 'profile' && student && <ProfileTab student={student} klass={klass} onSaved={load} />}
              {tab === 'messages' &&
                (klass ? (
                  <MessagesTab teacherId={klass.teacher_id} teacherName={klass.teacher_name} teacherAvatar={klass.teacher_avatar} />
                ) : (
                  <div className="mx-auto max-w-2xl p-4">
                    <div className="panel p-6 text-center">
                      <p className="font-display text-lg font-bold">No teacher yet</p>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        Once your teacher adds you to their class, you&apos;ll be able to message them here.
                      </p>
                    </div>
                  </div>
                ))}
              {tab === 'ears' && <EarsTab klass={klass} />}
              {tab === 'game' && <GameTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  swords: Swords,
  trophy: Trophy,
  star: Star,
  'book-open': BookOpen,
  flame: Flame,
  award: Award,
  map: Map,
  compass: Compass,
  'graduation-cap': GraduationCap,
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

      <p className="absolute left-4 top-5 max-w-[45%] font-display text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] sm:text-3xl">
        Welcome back, {student?.full_name?.split(' ')[0] ?? 'friend'}!
      </p>

      <div className="absolute right-4 top-5 w-[46%] max-w-[220px]">
        <ShinyDigitalCard student={student} klass={klass} onViewFull={() => onNavigate('profile')} />
      </div>

      <StandingPhone klass={klass} achievements={achievements} />
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

// A real phone-shaped object standing on the rug in the background photo -
// small, upright, barely tilted (not the big floating card-style mockup),
// with a nudge-left/nudge-right wobble when you tap its edges instead of
// a continuous idle float, since a standing object shouldn't drift.
function StandingPhone({
  klass,
  achievements,
}: {
  klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null
  achievements: EarnedAchievement[]
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
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2" style={{ width: 300 }}>
      {/* contact shadow blending the phone onto the rug */}
      <div
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-8 w-52 -translate-x-1/2 rounded-full opacity-60 blur-md"
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
          className="relative overflow-hidden rounded-[30px] border-[5px]"
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
          <div className="relative overflow-hidden rounded-[24px]" style={{ height: 560, background: 'linear-gradient(160deg, #1c1c26 0%, #0a0a10 100%)' }}>
            {/* glass glare for a bit more "3d" realism */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20"
              style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.07) 100%)' }}
            />
            <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/70" />

            <div className="relative z-10 flex h-full flex-col px-4 pb-4 pt-9">
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
                      const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Award
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

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
      </div>
      <div className="flex gap-2 pt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 rounded-full bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button onClick={send} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-black">
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

const COMING_SOON_GAMES: { title: string; icon: LucideIcon; photo: string }[] = [
  { title: 'Bible Word Search', icon: Grid3x3, photo: '/journey/tower-of-babel.jpg' },
  { title: 'Memory Match', icon: Layers, photo: '/journey/noah-dove-olive-branch.jpg' },
  { title: 'Verse Scramble', icon: Shuffle, photo: '/journey/adam-eve-garden-home.jpg' },
  { title: 'Story Builder', icon: PencilLine, photo: '/journey/jacob-ladder-dream.jpg' },
  { title: 'Bible Bingo', icon: Puzzle, photo: '/journey/abraham-isaac-ram-provided.jpg' },
  { title: 'Coloring Book', icon: Palette, photo: '/journey/cain-abel-offerings.jpg' },
  { title: 'Sing-Along', icon: Music2, photo: '/journey/noah-building-ark.jpg' },
  { title: 'Guess the Sound', icon: Mic2, photo: '/journey/adam-eve-first-sin.jpg' },
  { title: 'Roll & Answer', icon: Dice5, photo: '/feature-rocket.png' },
  { title: 'Brain Teasers', icon: Brain, photo: '/feature-achievements.png' },
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
        <span
          className="relative mt-3 inline-flex items-center gap-1 self-start rounded-full bg-white px-3 py-1.5 text-xs font-extrabold"
          style={{ color: accent }}
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
          title="Bible Word Search"
          icon={Grid3x3}
          accent="var(--ink-faint)"
          dark="#101014"
          photo="/village/game-rocket.png"
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

function ClassTab({ klass, student }: { klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null; student: StudentRow | null }) {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [lessons, setLessons] = useState<LectureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ClassFeatureKey | null>(null)

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

  if (!klass) {
    return (
      <div className="space-y-6">
        <div className="panel p-6 text-center">
          <p className="font-display text-lg font-bold">No class yet</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            You&apos;re not in a class yet. Give your Student Code to your Sunday school teacher and they&apos;ll add you.
          </p>
        </div>
        <NotesSection kind="notebook" title="Notebook" icon={FileText} accent="var(--lp-accent-class)" placeholder="Jot down what you're learning…" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <img src="/classroom-bible-reading-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-16">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md"
            >
              <ClassFeaturePanel
                feature={active}
                klass={klass}
                student={student}
                assignments={assignments}
                lessons={lessons}
                loading={loading}
                onClose={() => setActive(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dial"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center gap-4"
            >
              <ClassDial onSelect={setActive} />
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">Tap an icon to open it</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * GTA V weapon-wheel style hub for the classroom: a glass ring floating over
 * the class photo with the teacher figurine at its center and one wedge icon
 * per feature spaced evenly around the circle.
 */
function ClassDial({ onSelect }: { onSelect: (key: ClassFeatureKey) => void }) {
  const n = CLASS_FEATURES.length
  return (
    <div className="relative" style={{ width: 'min(92vw, 630px)', height: 'min(92vw, 630px)' }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 70%)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 30px 70px -20px rgba(0,0,0,0.65), inset 0 0 50px rgba(255,255,255,0.08), inset 0 0 0 10px rgba(255,255,255,0.05)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      />
      <div className="absolute rounded-full border border-white/20" style={{ inset: '15%' }} />

      <div
        className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full"
        style={{
          width: '46%',
          height: '46%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0.02))',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25), 0 10px 30px -10px rgba(0,0,0,0.55)',
        }}
      >
        <img src="/teacher-isometric.png" alt="" className="h-[82%] w-[82%] object-contain drop-shadow-2xl" />
      </div>

      {CLASS_FEATURES.map((f, i) => {
        const angle = (-90 + (360 / n) * i) * (Math.PI / 180)
        const R = 42
        const x = 50 + R * Math.cos(angle)
        const y = 50 + R * Math.sin(angle)
        const Icon = f.icon
        return (
          <button
            key={f.key}
            onClick={() => {
              playClick()
              onSelect(f.key)
            }}
            className="absolute flex flex-col items-center gap-2 transition hover:scale-110 active:scale-95"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
          >
            <span
              className="relative flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full sm:h-24 sm:w-24"
              style={{
                background: `linear-gradient(155deg, ${f.from} 0%, ${f.to} 100%)`,
                border: '1px solid rgba(255,255,255,0.45)',
                boxShadow: '0 10px 24px -8px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.3)',
              }}
            >
              <span className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45), transparent 55%)' }} />
              <Icon className="relative h-9 w-9 text-white drop-shadow" strokeWidth={2.1} />
            </span>
            <span className="whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">{f.label}</span>
          </button>
        )
      })}
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
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-lg font-extrabold text-white">{titles[feature]}</p>
        <button
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
          {!loading && lessons.map((l) => (
            <div key={l.id} className="rounded-xl bg-white/8 p-3">
              <p className="font-bold text-white">{l.title}</p>
            </div>
          ))}
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
            <p className="font-display text-base font-bold italic leading-relaxed text-white">&ldquo;{student.favorite_verse}&rdquo;</p>
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
    <div className="panel p-4">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-start justify-between gap-2 text-left">
        <div>
          <p className="font-bold">{assignment.title}</p>
          {assignment.due_date && (
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-faint)]">
              <Clock className="h-3 w-3" /> Due {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
            submitted?.grade !== null && submitted?.grade !== undefined
              ? 'bg-emerald-500/15 text-emerald-400'
              : submitted
                ? 'bg-[var(--ink-panel)] text-[var(--ink-muted)]'
                : overdue
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-[var(--gold)]/15 text-[var(--gold)]'
          }`}
        >
          {submitted?.grade !== null && submitted?.grade !== undefined ? 'Graded' : submitted ? 'Submitted' : overdue ? 'Overdue' : 'Open'}
        </span>
      </button>

      {expanded && loaded && (
        <div className="mt-3 space-y-2">
          {assignment.instructions && <p className="whitespace-pre-wrap text-sm text-[var(--ink-muted)]">{assignment.instructions}</p>}
          {submitted?.grade !== null && submitted?.grade !== undefined ? (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm">
              <p className="font-bold text-emerald-400">
                Grade: {submitted.grade}
                {assignment.max_score ? ` / ${assignment.max_score}` : ''}
              </p>
              {submitted.feedback && <p className="mt-1 text-[var(--ink-muted)]">{submitted.feedback}</p>}
            </div>
          ) : (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your answer…"
                rows={3}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--gold)]"
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
  size: number
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

function SundaySchoolTab({ klass }: { klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null }) {
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [streak, setStreak] = useState(0)
  const [lessons, setLessons] = useState<LectureRow[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(true)
  const lessonsSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMyBibleStreak().then(setStreak)
  }, [])

  useEffect(() => {
    if (!klass) {
      setLessonsLoading(false)
      return
    }
    listPublishedLectures(klass.id).then((l) => {
      setLessons(l)
      setLessonsLoading(false)
    })
  }, [klass])

  if (journeyOpen) {
    return <BibleJourneyPanel onExit={() => setJourneyOpen(false)} />
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
          <p className="font-display text-2xl font-extrabold text-white drop-shadow-md">Sunday School</p>
          <p className="mt-1 max-w-xs text-sm text-white/85 drop-shadow-md">
            Everything for growing your faith, one day at a time.
          </p>
        </div>

        <HugeHeroIcon
          image="/icons/streak-flame.png"
          label="Bible Reading Plan"
          value={String(streak)}
          size={170}
          left="40%"
          top={130}
          rotate={-8}
          onClick={() => {
            playClick()
            window.open('https://www.bible.com/reading-plans', '_blank', 'noopener,noreferrer')
          }}
        />
        <HugeHeroIcon
          image="/icons/bible-journey-book.png"
          label="Bible Journey"
          size={200}
          left="60%"
          top={105}
          rotate={5}
          onClick={() => {
            playClick()
            setJourneyOpen(true)
          }}
        />
      </div>

      <div ref={lessonsSectionRef} className="mx-auto max-w-2xl space-y-3 px-4">
        <p className="eyebrow">Sunday School Lessons</p>
        {klass && lessonsLoading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
        {klass && !lessonsLoading && lessons.length > 0 && (
          <div className="space-y-2">
            {lessons.map((l) => (
              <div key={l.id} className="panel p-4">
                <p className="font-bold">{l.title}</p>
                {l.description && <p className="mt-1 text-sm text-[var(--ink-muted)]">{l.description}</p>}
                {l.body && <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-muted)]">{l.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 px-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {SUNDAYS_2026.map((date, i) => {
          const theme = SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length]
          return <SundayLessonCard key={date.toISOString()} date={date} title={theme.title} image={theme.image} locked={date >= LOCK_CUTOFF} />
        })}
      </div>
    </div>
  )
}

const SUNDAY_LESSON_THEMES: { title: string; image: string }[] = [
  { title: "Creation & God's Love", image: '/journey/adam-eve-garden-home.jpg' },
  { title: 'Adam and Eve', image: '/journey/adam-eve-first-sin.jpg' },
  { title: 'Cain and Abel', image: '/journey/cain-abel-offerings.jpg' },
  { title: "Noah's Ark", image: '/journey/noah-building-ark.jpg' },
  { title: "God's Promise", image: '/journey/noah-dove-olive-branch.jpg' },
  { title: 'The Tower of Babel', image: '/journey/tower-of-babel.jpg' },
  { title: "Abraham's Faith", image: '/journey/abraham-isaac-ram-provided.jpg' },
  { title: "Jacob's Ladder", image: '/journey/jacob-ladder-dream.jpg' },
  { title: "Learning God's Word", image: '/feature-bible.png' },
  { title: 'Sunday Worship', image: '/hero-bible.jpg' },
  { title: 'Our Church Family', image: '/mfm-wuye-building.jpg' },
  { title: 'A Message From Pastor', image: '/children-pastor.jpg' },
  { title: 'Fun in Sunday School', image: '/feature-class.png' },
  { title: 'Growing Together', image: '/hero-kids.jpg' },
]

function getSundaysIn2026(): Date[] {
  const sundays: Date[] = []
  const d = new Date(2026, 0, 1)
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  while (d.getFullYear() === 2026) {
    sundays.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return sundays
}

const SUNDAYS_2026 = getSundaysIn2026()
// Sundays from here on haven't actually been taught yet in real life, so they stay locked in this simulated calendar.
const LOCK_CUTOFF = new Date(2026, 8, 16)

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

function LeaderboardTab({ myId }: { myId: string | null }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(setRows).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
  if (rows.length === 0) return <p className="text-sm text-[var(--ink-muted)]">No quiz points recorded yet. Be the first to play!</p>

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.student_id} className={`panel flex items-center justify-between px-4 py-3 ${r.student_id === myId ? 'border-[var(--gold)]/40' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="w-6 text-center font-display font-bold text-[var(--ink-faint)]">{i + 1}</span>
            {r.avatar_url ? (
              <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
                <User className="h-4 w-4" strokeWidth={1.75} />
              </span>
            )}
            <div>
              <p className="font-semibold">{r.full_name}</p>
              <p className="text-xs text-[var(--ink-faint)]">{r.class_name}</p>
            </div>
          </div>
          <p className="font-bold text-[var(--gold)]">{r.total_points.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

function ProfileTab({ student, klass, onSaved }: { student: StudentRow; klass: (ClassRow & { teacher_name: string; teacher_avatar: string | null }) | null; onSaved: () => void }) {
  const [bio, setBio] = useState(student.bio ?? '')
  const [verse, setVerse] = useState(student.favorite_verse ?? '')
  const [quote, setQuote] = useState(student.favorite_quote ?? '')
  const [avatar, setAvatar] = useState(student.avatar_url)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

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

  const save = async () => {
    setSaving(true)
    try {
      await updateMyStudentProfile({ bio, favorite_verse: verse, favorite_quote: quote, avatar_url: avatar ?? undefined })
      playClick()
      haptics.success()
      setSaved(true)
      onSaved()
      window.setTimeout(() => setSaved(false), 1800)
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
          <p className="text-sm text-[var(--ink-muted)]">Tap your photo to change it</p>
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
        <p className="text-xs text-[var(--ink-faint)]">Give this to your teacher so they can add you to your class.</p>

        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about me…" rows={2} className={inputClass} />
        <input value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="Favorite Bible verse" className={inputClass} />
        <input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Favorite quote" className={inputClass} />
        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-400">
            <Check className="h-4 w-4" /> Saved
          </p>
        )}
        <button onClick={save} disabled={saving} className="btn-solid w-full py-3">
          {saving ? 'Saving…' : 'Save My Profile'}
        </button>
      </div>

      <div className="panel space-y-3 p-5 text-center">
        <p className="eyebrow">My Digital ID Card</p>
        {cardUrl ? (
          <img src={cardUrl} alt="My ID card" className="mx-auto max-w-[260px] rounded-lg shadow-xl" />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">Generate a shareable card with your photo, verse, and points.</p>
        )}
        <div className="flex justify-center gap-2">
          <button onClick={makeCard} disabled={rendering} className="btn-outline flex items-center gap-1.5 text-sm">
            <Sparkles className="h-4 w-4" /> {rendering ? 'Making…' : cardUrl ? 'Re-generate' : 'Generate Card'}
          </button>
          {cardUrl && (
            <button onClick={shareCard} className="btn-solid flex items-center gap-1.5 text-sm">
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--ink-faint)]">Built by Zebraish</p>
    </div>
  )
}

function MessagesTab({ teacherId, teacherName, teacherAvatar }: { teacherId: string; teacherName: string; teacherAvatar: string | null }) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

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
