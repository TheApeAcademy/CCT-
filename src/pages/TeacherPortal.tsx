import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  ClipboardList,
  Smartphone,
  HeartHandshake,
  Settings,
  ArrowLeft,
  Archive,
  Check,
  X,
  Copy,
  Gamepad2,
  LayoutDashboard,
  Users,
  Calendar,
  Lock,
  ClipboardCheck,
  Sparkles,
  EyeOff,
  CircleCheck,
  Circle,
  MessageCircle,
  FileText,
  History as HistoryIcon,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { supabase, signOut, type Profile } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import PortalShell from '../components/PortalShell'
import { NotesSection, DigitalBankSection } from '../components/PersonalVault'
import Sheet from '../components/ui/Sheet'
import AvatarReviewQueue from '../components/AvatarReviewQueue'
import PortalSearch from '../components/PortalSearch'
import { renderCertificatePng } from '../lib/certificate'
import { SUNDAY_LESSON_THEMES, SUNDAYS_2026, sundayDateKey } from '../content/sundaySchoolCalendar'
import {
  getMyTeacherApplication,
  submitTeacherApplication,
  listMyClasses,
  createClass,
  archiveClass,
  listStudentsInClass,
  moveStudent,
  enrollStudentByCode,
  resetStudentPasscode,
  listLectures,
  createLecture,
  setLectureStatus,
  listAssignments,
  createAssignment,
  setAssignmentStatus,
  listSubmissionsForAssignment,
  gradeSubmission,
  listUnlockedSundays,
  unlockSunday,
  lockSunday,
  listMinistryEvents,
  type LectureRow,
  type LectureStatus,
  type AssignmentRow,
  type SubmissionRow,
  listMyConversations,
  listMessages,
  sendMessage,
  listEarsTeacherInbox,
  listEarsReplies,
  listEarsInternalNotes,
  acknowledgeEarsMessage,
  setEarsStatus,
  escalateEarsMessage,
  addEarsReply,
  addEarsInternalNote,
  getLeaderboard,
  aggregateClassLeaderboard,
  listAttendanceForDate,
  listAttendanceHistory,
  saveAttendance,
  type SearchResult,
  type AttendanceHistory,
  listBibleBuddyTeacherLog,
  type AiCompanionTeacherLogRow,
  type TeacherApplication,
  type ClassRow,
  type StudentRow,
  type ConversationSummary,
  type MessageRow,
  type MinistryEventRow,
  type EarsMessageRow,
  type EarsReplyRow,
  type EarsNoteRow,
  type EarsStatus,
  type LeaderboardRow,
} from '../lib/ministry'
import { fileToResizedDataUrl } from '../lib/image'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { setLastPortal } from '../lib/lastPortal'
import '../design/teacher.css'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

// The Claude Design handoff's Teacher Portal (Teacher Portal.dc.html): a dark
// sidebar workspace. Every number and list is the teacher's own data; where
// the design shows something the ministry does not record (unread chats,
// flagged Bible Buddy questions) it is left out rather than faked.

const display = "'Bricolage Grotesque', sans-serif"
const AV = ['#c13bff', '#ff8a3d', '#4f7bff', '#19c99b', '#ff4fa3', '#e0a400', '#7a5cff', '#e0405a']
const card: CSSProperties = { padding: 22, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }
const h2: CSSProperties = { margin: '0 0 6px', fontFamily: display, fontWeight: 800, fontSize: 20, color: '#fff' }
const dim = 'rgba(236,230,250,.55)'
const line = '1px solid rgba(255,255,255,.08)'
const smallBtn: CSSProperties = { padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }
const greenBtn: CSSProperties = { padding: '12px 20px', borderRadius: 12, border: 'none', background: '#19c99b', color: '#03231b', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }
const TITLES = /^(sis|sister|bro|brother|mr|mrs|ms|miss|dr|pastor|pst|rev|deacon|deaconess|evang)\.?$/i
/** The first name, past any title: "Sis. Grace Obi" is Grace. */
const first = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/).find((w) => w && !TITLES.test(w)) || 'Teacher'
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const y = new Date(today)
  y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return `Today ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** A child's or adult's picture, or their first letter on a colour. */
function Face({ url, name, i, size = 36 }: { url?: string | null; name: string; i: number; size?: number }) {
  const box: CSSProperties = { flexShrink: 0, width: size, height: size, borderRadius: '50%' }
  if (url) return <img src={url} alt="" style={{ ...box, objectFit: 'cover', display: 'block' }} />
  return <span style={{ ...box, background: AV[i % AV.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.4, color: '#fff' }}>{(name.trim()[0] ?? '?').toUpperCase()}</span>
}

export default function TeacherPortal() {
  const auth = useMinistryAuth()
  const { session, profile, loading, refreshProfile } = auth

  // Remembered so an installed home-screen icon can launch straight into
  // /teacher next time (see the redirect script in index.html), instead of
  // always opening the marketing landing page first.
  useEffect(() => {
    if (session && profile?.role === 'teacher') setLastPortal('teacher')
  }, [session, profile])

  if (session && profile?.role === 'teacher') return <TeacherDashboard profile={profile} onProfile={refreshProfile} />
  return (
    <PortalShell eyebrow="Teacher Portal">
      {loading ? (
        <div className="py-20 text-center text-xl">Loading…</div>
      ) : !session ? (
        <AuthCard icon={GraduationCap} title="Teacher Portal" subtitle="Sign in, or create an account and apply to teach." />
      ) : (
        <ApplicationGate onChange={refreshProfile} />
      )}
    </PortalShell>
  )
}

// ---------- main dashboard ----------

type Tab = 'home' | 'chat' | 'classes' | 'quiz' | 'ears' | 'buddy' | 'calendar' | 'profile'
type ClassSub = 'students' | 'attendance' | 'lectures' | 'calendar' | 'assign' | 'certs'
interface ClassTarget {
  classId: string
  sub: ClassSub
}

const TABS: [Tab, string, LucideIcon][] = [
  ['home', 'Home', LayoutDashboard],
  ['chat', 'Chat', Smartphone],
  ['classes', 'Classes', GraduationCap],
  ['quiz', 'Quiz', Gamepad2],
  ['ears', 'Ears for You', HeartHandshake],
  ['buddy', 'Bible Buddy', Sparkles],
  ['calendar', 'Ministry Calendar', Calendar],
  ['profile', 'Profile', Settings],
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function TeacherDashboard({ profile, onProfile }: { profile: Profile; onProfile: () => void }) {
  const [tab, setTab] = useState<Tab>('home')
  const [target, setTarget] = useState<ClassTarget | null>(null)
  const [earsNew, setEarsNew] = useState(0)

  const refreshEars = useCallback(() => {
    listEarsTeacherInbox()
      .then((rows) => setEarsNew(rows.filter((r) => r.status === 'new').length))
      .catch(() => {})
  }, [])
  useEffect(() => {
    refreshEars()
  }, [refreshEars, tab])

  const go = (t: Tab, to?: ClassTarget) => {
    playClick()
    setTarget(to ?? null)
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  // A result is only worth showing if tapping it goes somewhere, so every
  // kind this portal can return is handled here. Everything the teacher can
  // find belongs to one of their classes, so all of it opens that class.
  const goToResult = (r: SearchResult) => {
    if (!r.class_id) return
    go('classes', { classId: r.class_id, sub: r.kind === 'assignment' ? 'assign' : r.kind === 'lecture' ? 'lectures' : 'students' })
  }

  const head: Record<Tab, [string, string]> = {
    home: [`${greeting()}, ${first(profile.full_name)}`, 'Overview'],
    chat: ['Messages from your class', 'Chat'],
    classes: ['Manage your classes', 'Classes'],
    quiz: ['Run a Bible quiz', 'Quiz'],
    ears: ['Private notes from your class', 'Ears for You'],
    buddy: ['What children asked the AI helper', 'Bible Buddy'],
    calendar: ['Ministry-wide dates', 'Ministry Calendar'],
    profile: ['Your teacher profile', 'Profile'],
  }
  const navLink: CSSProperties = { padding: '7px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12 }

  return (
    <div data-dc-screen="teacher">
      <aside style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0, width: 'clamp(72px,18vw,240px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 12px', borderRight: line, background: 'rgba(10,5,22,.7)', overflowY: 'auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 16px' }}>
          <span style={{ flexShrink: 0, display: 'flex', background: '#fff', borderRadius: 10, padding: '3px 6px' }}>
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 26, display: 'block' }} />
          </span>
        </Link>
        {TABS.map(([id, label, Icon]) => {
          const on = id === tab
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-current={on ? 'page' : undefined}
              className="tp-tab"
              onClick={() => go(id)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 14, border: 'none', background: on ? 'rgba(193,59,255,.2)' : 'transparent', color: on ? '#fff' : 'rgba(236,230,250,.65)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, textAlign: 'left', cursor: 'pointer', transition: 'background .2s' }}
            >
              <Icon style={{ flexShrink: 0, width: 20, height: 20 }} strokeWidth={2} />
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
              {id === 'ears' && earsNew > 0 && (
                <span className="tp-badge" style={{ minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: '#ff4f6b', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tp-ping 1.6s infinite' }}>{earsNew}</span>
              )}
            </button>
          )
        })}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px 0', borderTop: line }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#19c99b,#07665a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>{first(profile.full_name)[0]}</span>
          )}
          <span className="tp-who" style={{ minWidth: 0, fontSize: 13, lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name || 'Teacher'}</span>
            <span style={{ display: 'block', color: 'rgba(236,230,250,.5)', whiteSpace: 'nowrap' }}>Teacher</span>
          </span>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: 'clamp(18px,3vw,36px) clamp(14px,3vw,40px) 80px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: dim }}>{head[tab][0]}</p>
            <h1 style={{ margin: '4px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>{head[tab][1]}</h1>
          </div>
          <nav style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)' }}>
            <Link to="/" className="tp-navlink" style={navLink}>
              Home
            </Link>
            <span style={{ ...navLink, background: '#fff', color: '#0f0820' }}>Teacher</span>
            <button type="button" className="tp-navlink" onClick={() => signOut()} style={{ ...navLink, border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              Sign out
            </button>
          </nav>
        </div>

        <div style={{ marginTop: 18, maxWidth: 560 }}>
          <PortalSearch placeholder="Find a child, a class, a lesson…" onPick={goToResult} />
        </div>

        <div key={`${tab}-${target?.classId ?? ''}-${target?.sub ?? ''}`} style={{ marginTop: 24, animation: 'tp-up .4s both' }}>
          {tab === 'home' && <HomeTab go={go} />}
          {tab === 'chat' && <ChatTab />}
          {tab === 'classes' && <ClassesTab target={target} teacherName={profile.full_name || 'Your Teacher'} />}
          {tab === 'quiz' && <QuizTab />}
          {tab === 'ears' && <EarsInboxTab onChange={refreshEars} />}
          {tab === 'buddy' && <BibleBuddyLogTab />}
          {tab === 'calendar' && <CalendarTab />}
          {tab === 'profile' && <ProfileTab profile={profile} onSaved={onProfile} />}
        </div>
      </main>
    </div>
  )
}

// ---------- Home ----------

interface Todo {
  t: string
  s: string
  col: string
  to: [Tab, ClassTarget?]
}

function HomeTab({ go }: { go: (t: Tab, to?: ClassTarget) => void }) {
  const [stats, setStats] = useState<{ students: number; toGrade: number; ears: number; chats: number } | null>(null)
  const [todo, setTodo] = useState<Todo[] | null>(null)

  useEffect(() => {
    ;(async () => {
      const [classes, ears, chats] = await Promise.all([listMyClasses(), listEarsTeacherInbox().catch(() => [] as EarsMessageRow[]), listMyConversations().catch(() => [] as ConversationSummary[])])
      const live = classes.filter((c) => !c.archived)
      const items: Todo[] = []
      let students = 0
      let toGrade = 0
      const soon = Date.now() + 7 * 864e5
      await Promise.all(
        live.map(async (c) => {
          const [kids, work, lessons] = await Promise.all([listStudentsInClass(c.id), listAssignments(c.id), listLectures(c.id).catch(() => [] as LectureRow[])])
          students += kids.length
          await Promise.all(
            work
              .filter((a) => a.status === 'published')
              .map(async (a) => {
                const subs = await listSubmissionsForAssignment(a.id).catch(() => [] as SubmissionRow[])
                const n = subs.filter((x) => x.grade === null).length
                toGrade += n
                if (n) items.push({ t: `${n} submission${n === 1 ? '' : 's'} to grade · ${a.title}`, s: c.name, col: '#ffd84d', to: ['classes', { classId: c.id, sub: 'assign' }] })
                if (a.due_date && new Date(a.due_date).getTime() >= Date.now() && new Date(a.due_date).getTime() <= soon) {
                  items.push({ t: `“${a.title}” is due ${new Date(a.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`, s: c.name, col: '#7fa2ff', to: ['classes', { classId: c.id, sub: 'assign' }] })
                }
              }),
          )
          for (const l of lessons.filter((x) => x.status === 'draft').slice(0, 2)) items.push({ t: `Lesson “${l.title}” is still a draft`, s: c.name, col: '#9db8ff', to: ['classes', { classId: c.id, sub: 'lectures' }] })
        }),
      )
      const newEars = ears.filter((e) => e.status === 'new').length
      if (newEars) items.unshift({ t: `${newEars} new Ears for You note${newEars === 1 ? '' : 's'}`, s: 'Ears', col: '#ff6b80', to: ['ears'] })
      setStats({ students, toGrade, ears: newEars, chats: chats.length })
      setTodo(items)
    })().catch(() => {
      setStats({ students: 0, toGrade: 0, ears: 0, chats: 0 })
      setTodo([])
    })
  }, [])

  const kpis: [string, string, LucideIcon, string, () => void][] = [
    ['STUDENTS', stats ? String(stats.students) : '…', Users, '#19c99b', () => go('classes')],
    ['TO GRADE', stats ? String(stats.toGrade) : '…', ClipboardCheck, '#ffd84d', () => go('classes')],
    ['NEW EARS NOTES', stats ? String(stats.ears) : '…', HeartHandshake, '#ff6b80', () => go('ears')],
    ['CONVERSATIONS', stats ? String(stats.chats) : '…', MessageCircle, '#7fa2ff', () => go('chat')],
  ]

  return (
    <>
      {/* Sits above everything else and disappears the moment the queue is
          empty. A picture a child has uploaded is not visible to their class
          until this is dealt with, so it should not be somewhere a teacher
          has to remember to go and look. */}
      <div style={{ marginBottom: 16 }}>
        <AvatarReviewQueue />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 12 }}>
        {kpis.map(([l, v, Icon, col, onClick]) => (
          <button key={l} type="button" onClick={onClick} className="tp-kpi" style={{ ['--kpi' as string]: col, padding: 20, borderRadius: 22, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: dim }}>{l}</span>
              <Icon style={{ width: 18, height: 18, color: col }} strokeWidth={2.25} />
            </span>
            <span style={{ display: 'block', marginTop: 10, fontFamily: display, fontWeight: 800, fontSize: 40, lineHeight: 1 }}>{v}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 16, marginTop: 16 }}>
        <div style={card}>
          <h2 style={h2}>Needs your attention</h2>
          {todo === null && <p style={{ margin: '10px 0 0', color: dim }}>Looking…</p>}
          {todo?.length === 0 && <p style={{ margin: '10px 0 0', color: dim }}>All caught up. Nothing needs you right now.</p>}
          {todo?.slice(0, 6).map((d, i) => (
            <button key={i} type="button" onClick={() => go(...d.to)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 0', border: 'none', borderTop: line, background: 'none', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
              <span style={{ flexShrink: 0, width: 10, height: 10, borderRadius: '50%', background: d.col }} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{d.t}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(236,230,250,.5)', whiteSpace: 'nowrap' }}>{d.s} →</span>
            </button>
          ))}
        </div>
        <Link to="/setup" onClick={() => playClick()} style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220, padding: 24, borderRadius: 24, background: 'linear-gradient(180deg,transparent 20%,#3d1259 85%),url(/hero-quiz.jpg) center/cover,#3d1259', color: '#fff' }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ffd84d' }}>QUIZ SHOW</span>
          <span style={{ marginTop: 6, fontFamily: display, fontWeight: 800, fontSize: 28 }}>Host a Bible Quiz on the big screen</span>
          <span style={{ marginTop: 12, alignSelf: 'flex-start', padding: '10px 16px', borderRadius: 999, background: '#ffd84d', color: '#1a0f2e', fontWeight: 800, fontSize: 14 }}>Set up a match →</span>
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 16, marginTop: 16 }}>
        <div className="panel p-5">
          <NotesSection kind="notebook" title="Notes" icon={FileText} accent="var(--gold)" placeholder="Jot something down…" />
        </div>
        <div className="panel p-5">
          <DigitalBankSection />
        </div>
      </div>
    </>
  )
}

// ---------- Chat ----------

function ChatTab() {
  const [threads, setThreads] = useState<ConversationSummary[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(() => {
    listMyConversations()
      .then((c) => {
        setThreads(c)
        setOpen((o) => o ?? c[0]?.id ?? null)
      })
      .catch(() => setThreads([]))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const cur = threads?.find((t) => t.id === open) ?? null

  if (threads?.length === 0) return <p style={{ ...card, margin: 0, color: dim }}>No conversations yet. When a child in your class messages you, it shows up here.</p>

  return (
    <div className="tp-chat" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,280px) minmax(0,1fr)', gap: 16, minHeight: 520 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
        {threads === null && <p style={{ margin: 10, color: dim }}>Loading…</p>}
        {threads?.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              playClick()
              setOpen(c.id)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, border: 'none', background: c.id === open ? 'rgba(255,255,255,.08)' : 'transparent', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
          >
            <Face url={c.other_avatar} name={c.other_name} i={i} size={38} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>{c.other_name}</span>
              <span style={{ display: 'block', fontSize: 12, color: dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last_message ?? 'Tap to open the conversation'}</span>
            </span>
          </button>
        ))}
      </div>
      {cur ? <ChatThread key={cur.id} convo={cur} onSent={load} /> : <div style={{ ...card, color: dim }}>Pick a conversation.</div>}
    </div>
  )
}

function ChatThread({ convo, onSent }: { convo: ConversationSummary; onSent: () => void }) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => listMessages(convo.id).then(setMessages), [convo.id])
  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [load])

  // Land on the newest message, not the oldest one.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const send = async () => {
    if (!draft.trim()) return
    await sendMessage(convo.id, draft)
    setDraft('')
    playClick()
    load()
    onSent()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', minHeight: 0, maxHeight: '70vh' }}>
      <p style={{ margin: '0 0 12px', fontWeight: 800, color: '#fff' }}>{convo.other_name}</p>
      <div ref={listRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 200 }}>
        {messages.length === 0 && <p style={{ margin: 'auto', color: dim, fontSize: 14 }}>No messages yet.</p>}
        {messages.map((m) => {
          const me = m.sender_id === myId
          return (
            <div key={m.id} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '75%', padding: '10px 14px', borderRadius: me ? '18px 18px 6px 18px' : '18px 18px 18px 6px', background: me ? '#19c99b' : 'rgba(255,255,255,.08)', color: me ? '#03231b' : '#fff', fontSize: 14, lineHeight: 1.5, animation: 'tp-up .3s both', whiteSpace: 'pre-wrap' }}>
              {m.body}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Write a message…"
          aria-label="Message"
          style={{ flex: 1, minWidth: 0, padding: '13px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(0,0,0,.25)', color: '#fff', fontSize: 14, outline: 'none' }}
        />
        <button type="button" onClick={send} style={{ padding: '0 20px', borderRadius: 999, border: 'none', background: '#19c99b', color: '#03231b', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  )
}

// ---------- Classes ----------

const SUBS: [ClassSub, string][] = [
  ['students', 'Students'],
  ['attendance', 'Attendance'],
  ['lectures', 'Lectures'],
  ['calendar', 'Sunday Calendar'],
  ['assign', 'Assignments'],
  ['certs', 'Certificates'],
]

function ClassesTab({ target, teacherName }: { target: ClassTarget | null; teacherName: string }) {
  const [classes, setClasses] = useState<ClassRow[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [sel, setSel] = useState<string | null>(target?.classId ?? null)
  const [sub, setSub] = useState<ClassSub>(target?.sub ?? 'students')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [students, setStudents] = useState<StudentRow[] | null>(null)

  const load = useCallback(() => {
    listMyClasses()
      .then((list) => {
        setClasses(list)
        setSel((s) => (s && list.some((c) => c.id === s) ? s : (list.find((c) => !c.archived) ?? list[0])?.id ?? null))
        for (const c of list) listStudentsInClass(c.id).then((k) => setCounts((n) => ({ ...n, [c.id]: k.length })))
      })
      .catch(() => setClasses([]))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const loadStudents = useCallback(() => {
    if (!sel) return
    listStudentsInClass(sel).then((k) => {
      setStudents(k)
      setCounts((n) => ({ ...n, [sel]: k.length }))
    })
  }, [sel])
  useEffect(() => {
    setStudents(null)
    loadStudents()
  }, [loadStudents])

  const create = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createClass(newName)
      setNewName('')
      setAdding(false)
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  const klass = classes?.find((c) => c.id === sel) ?? null

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {classes?.map((c) => {
          const on = c.id === sel
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                playClick()
                setSel(c.id)
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 16, border: `2px solid ${on ? '#c13bff' : 'rgba(255,255,255,.12)'}`, background: on ? 'rgba(193,59,255,.14)' : 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', opacity: c.archived ? 0.6 : 1 }}
            >
              {c.name}
              <span style={{ fontSize: 12, color: dim }}>{c.archived ? 'archived' : counts[c.id] == null ? '…' : `${counts[c.id]} ${counts[c.id] === 1 ? 'child' : 'children'}`}</span>
            </button>
          )
        })}
        <button type="button" onClick={() => setAdding((a) => !a)} style={{ padding: '12px 16px', borderRadius: 16, border: '1px dashed rgba(255,255,255,.25)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + New class
        </button>
      </div>
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, maxWidth: 560 }}>
          <input className="tp-field" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder='New class name, e.g. "Sparklers (Ages 6-8)"' />
          <button type="button" onClick={create} disabled={creating} style={greenBtn}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}
      {classes === null && <p style={{ marginTop: 16, color: dim }}>Loading…</p>}
      {classes?.length === 0 && !adding && <p style={{ ...card, marginTop: 16, color: dim }}>No classes yet. Tap New class to make your first one.</p>}

      {klass && (
        <>
          <div className="tp-noscroll" style={{ display: 'flex', gap: 4, marginTop: 16, padding: 4, borderRadius: 16, background: 'rgba(255,255,255,.04)', overflowX: 'auto' }}>
            {SUBS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playClick()
                  setSub(id)
                }}
                style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 12, border: 'none', background: sub === id ? '#fff' : 'transparent', color: sub === id ? '#0f0820' : 'rgba(236,230,250,.7)', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {label}
              </button>
            ))}
          </div>
          <div key={`${klass.id}-${sub}`} style={{ marginTop: 14, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', animation: 'tp-up .3s both' }}>
            {sub === 'students' && <StudentsPanel klass={klass} students={students} onChange={loadStudents} onArchive={load} />}
            {sub === 'attendance' && (students ? <AttendanceManager classId={klass.id} students={students} /> : <p style={{ margin: 0, color: dim }}>Loading…</p>)}
            {sub === 'lectures' && <LecturesManager classId={klass.id} />}
            {sub === 'calendar' && <SundayCalendarManager classId={klass.id} />}
            {sub === 'assign' && <AssignmentsManager classId={klass.id} />}
            {sub === 'certs' && <CertificatesPanel students={students ?? []} className={klass.name} teacherName={teacherName} />}
          </div>
        </>
      )}
    </>
  )
}

function StudentsPanel({ klass, students, onChange, onArchive }: { klass: ClassRow; students: StudentRow[] | null; onChange: () => void; onArchive: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [passcodeFor, setPasscodeFor] = useState<StudentRow | null>(null)

  const enroll = async () => {
    if (!code.trim()) return
    setEnrolling(true)
    setError('')
    setOk('')
    try {
      const result = await enrollStudentByCode(klass.id, code)
      setOk(`${result.full_name} added to the class.`)
      setCode('')
      haptics.success()
      playClick()
      onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not find that Student Code.')
      haptics.error()
    } finally {
      setEnrolling(false)
    }
  }

  const remove = async (s: StudentRow) => {
    if (!confirm(`Remove ${s.full_name} from the class? Their account stays, just unassigned.`)) return
    await moveStudent(s.id, null)
    haptics.tap()
    onChange()
  }

  const toggleArchive = async () => {
    await archiveClass(klass.id, !klass.archived)
    onArchive()
  }

  return (
    <>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: dim }}>
        Join code <b style={{ color: '#ffd84d', letterSpacing: '.1em' }}>{klass.join_code}</b> · add a child with their Student Code
      </p>
      <div style={{ display: 'flex', gap: 8, maxWidth: 460, marginBottom: 8 }}>
        <input className="tp-field" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && enroll()} placeholder="Student Code, e.g. MFM4827" aria-label="Student Code" style={{ padding: '10px 14px', fontSize: 14, letterSpacing: '.08em' }} />
        <button type="button" onClick={enroll} disabled={enrolling} style={{ ...greenBtn, padding: '10px 16px' }}>
          {enrolling ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
      {ok && <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#5cf0c8' }}>{ok}</p>}
      {students === null && <p style={{ margin: '12px 0 0', color: dim }}>Loading…</p>}
      {students?.length === 0 && <p style={{ margin: '12px 0 0', color: dim }}>No one has joined yet.</p>}
      {students?.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: line, flexWrap: 'wrap' }}>
          <Face url={s.avatar_url} name={s.full_name} i={i} />
          <span style={{ flex: 1, minWidth: 140 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{s.full_name}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'rgba(236,230,250,.5)' }}>
              {s.student_code ?? s.username} · {s.total_points.toLocaleString()} pts
            </span>
          </span>
          {/* A child has no email, so no reset link can ever reach them.
              Forgetting a passcode used to mean losing the account for good;
              this is the way back, and it sits with the teacher because that
              is who a child asks. */}
          <button type="button" onClick={() => setPasscodeFor(s)} style={smallBtn}>
            Reset passcode
          </button>
          <button type="button" onClick={() => remove(s)} style={{ ...smallBtn, borderColor: 'rgba(255,107,128,.35)', color: '#ff8a96' }}>
            Remove
          </button>
        </div>
      ))}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: line }}>
        <button type="button" onClick={toggleArchive} style={{ ...smallBtn, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Archive style={{ width: 14, height: 14 }} /> {klass.archived ? 'Unarchive this class' : 'Archive this class'}
        </button>
      </div>
      {passcodeFor && <PasscodeResetModal student={passcodeFor} onClose={() => setPasscodeFor(null)} />}
    </>
  )
}

function AttendanceManager({ classId, students }: { classId: string; students: StudentRow[] }) {
  const [view, setView] = useState<'register' | 'history'>('register')
  const pill = (on: boolean): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', background: on ? 'rgba(255,255,255,.12)' : 'transparent', color: on ? '#fff' : dim, fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' })

  return (
    <>
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', marginBottom: 14 }}>
        <button type="button" onClick={() => setView('register')} style={pill(view === 'register')}>
          <ClipboardCheck style={{ width: 14, height: 14 }} /> Take the register
        </button>
        <button type="button" onClick={() => setView('history')} style={pill(view === 'history')}>
          <HistoryIcon style={{ width: 14, height: 14 }} /> Over the weeks
        </button>
      </div>
      {view === 'register' ? <AttendanceRegister classId={classId} students={students} /> : <AttendanceOverWeeks classId={classId} students={students} />}
    </>
  )
}

function AttendanceRegister({ classId, students }: { classId: string; students: StudentRow[] }) {
  const [date, setDate] = useState(todayDateKey())
  const [present, setPresent] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    listAttendanceForDate(classId, date).then((rows) => {
      const marked = new Map(rows.map((r) => [r.student_id, r.present]))
      // Default to present for anyone not yet marked today - it's rarer to be absent.
      setPresent(Object.fromEntries(students.map((s) => [s.id, marked.get(s.id) ?? true])))
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, students.length])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await saveAttendance(
        classId,
        date,
        students.map((s) => ({ student_id: s.id, present: present[s.id] ?? true })),
      )
      haptics.success()
      playClick()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = students.filter((s) => present[s.id]).length
  const label = new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <p style={{ margin: 0, fontWeight: 800, color: '#fff' }}>{label} · tap to mark</p>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Register date" className="tp-field" style={{ width: 'auto', padding: '8px 12px', fontSize: 14 }} />
      </div>
      {loading && <p style={{ margin: 0, color: dim }}>Loading…</p>}
      {!loading && students.length === 0 && <p style={{ margin: 0, color: dim }}>No students in this class yet.</p>}
      {!loading && students.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8 }}>
            {students.map((s) => {
              const on = !!present[s.id]
              const Icon = on ? CircleCheck : Circle
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPresent((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, border: `2px solid ${on ? '#2fe0b5' : 'rgba(255,255,255,.12)'}`, background: on ? 'rgba(47,224,181,.12)' : 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all .2s', textAlign: 'left' }}
                >
                  <Icon style={{ flexShrink: 0, width: 18, height: 18, color: on ? '#2fe0b5' : 'rgba(236,230,250,.35)' }} strokeWidth={2.25} />
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{first(s.full_name)}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#5cf0c8' }}>
              {presentCount} of {students.length} present
            </p>
            <button type="button" onClick={save} disabled={saving} style={greenBtn}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save register'}
            </button>
          </div>
        </>
      )}
    </>
  )
}

const LCOL: Record<LectureStatus, [string, string]> = {
  draft: ['rgba(255,255,255,.1)', 'rgba(236,230,250,.7)'],
  scheduled: ['rgba(79,123,255,.18)', '#9db8ff'],
  published: ['rgba(47,224,181,.18)', '#5cf0c8'],
  unpublished: ['rgba(255,138,61,.18)', '#ffab70'],
  expired: ['rgba(255,255,255,.06)', 'rgba(236,230,250,.45)'],
  archived: ['rgba(255,255,255,.06)', 'rgba(236,230,250,.45)'],
}

function LecturesManager({ classId }: { classId: string }) {
  const [lectures, setLectures] = useState<LectureRow[] | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => listLectures(classId).then(setLectures), [classId])
  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!title.trim()) return
    setCreating(true)
    try {
      await createLecture({ class_id: classId, title, body })
      setTitle('')
      setBody('')
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (l: LectureRow) => {
    await setLectureStatus(l.id, l.status === 'published' ? 'unpublished' : 'published')
    haptics.tap()
    playClick()
    load()
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560, marginBottom: 14 }}>
        <input className="tp-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New lesson title" aria-label="Lesson title" />
        <textarea className="tp-field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What are you teaching this week?" rows={3} style={{ resize: 'vertical' }} />
        <button type="button" onClick={create} disabled={creating} style={{ ...greenBtn, alignSelf: 'flex-start' }}>
          {creating ? 'Creating…' : 'Create as draft'}
        </button>
      </div>
      {lectures === null && <p style={{ margin: 0, color: dim }}>Loading…</p>}
      {lectures?.length === 0 && <p style={{ margin: 0, color: dim }}>No Sunday School lessons yet.</p>}
      {lectures?.map((l) => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: line }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{l.title}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'rgba(236,230,250,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.body || `Added ${new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}</span>
          </span>
          <button
            type="button"
            onClick={() => toggle(l)}
            title={l.status === 'published' ? 'Tap to unpublish' : 'Tap to publish'}
            style={{ padding: '6px 12px', borderRadius: 999, border: 'none', background: LCOL[l.status][0], color: LCOL[l.status][1], fontFamily: 'inherit', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {l.status.toUpperCase()}
          </button>
        </div>
      ))}
      {!!lectures?.length && <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(236,230,250,.45)' }}>Tap a status to publish a lesson, or to take it down again.</p>}
    </>
  )
}

// The same themed weekly lessons the kids see in their Sunday room. Here the
// teacher taps a Sunday to unlock it for their own class, instead of it
// following the automatic date rule.
function SundayCalendarManager({ classId }: { classId: string }) {
  const [unlocked, setUnlocked] = useState<Set<string> | null>(null)
  const [all, setAll] = useState(false)

  const load = useCallback(() => listUnlockedSundays(classId).then((dates) => setUnlocked(new Set(dates))), [classId])
  useEffect(() => {
    load()
  }, [load])

  const toggle = async (key: string) => {
    haptics.tap()
    if (unlocked?.has(key)) await lockSunday(classId, key)
    else await unlockSunday(classId, key)
    playClick()
    load()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let current = SUNDAYS_2026.findIndex((d) => d >= today)
  if (current < 0) current = SUNDAYS_2026.length - 1
  const from = all ? 0 : Math.max(0, current - 2)
  const to = all ? SUNDAYS_2026.length : Math.min(SUNDAYS_2026.length, current + 10)

  return (
    <>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: dim }}>Tap a Sunday to unlock it for your class. Children only see the lessons you have unlocked.</p>
      {unlocked === null && <p style={{ margin: 0, color: dim }}>Loading…</p>}
      {unlocked && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 10 }}>
          {SUNDAYS_2026.slice(from, to).map((date, j) => {
            const i = from + j
            const key = sundayDateKey(date)
            const now = i === current
            const open = unlocked.has(key)
            return (
              <button
                key={key}
                type="button"
                aria-pressed={open}
                onClick={() => toggle(key)}
                style={{ padding: 14, borderRadius: 16, background: now ? 'rgba(255,216,77,.12)' : open ? 'rgba(47,224,181,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${now ? 'rgba(255,216,77,.45)' : open ? 'rgba(47,224,181,.35)' : 'rgba(255,255,255,.08)'}`, color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: now ? '#ffd84d' : 'rgba(236,230,250,.5)' }}>{date.getDate()} {MON[date.getMonth()]}</span>
                  {open ? <Check style={{ width: 14, height: 14, color: '#5cf0c8' }} strokeWidth={3} /> : <Lock style={{ width: 13, height: 13, color: 'rgba(236,230,250,.4)' }} />}
                </span>
                <span style={{ display: 'block', marginTop: 6, fontWeight: 800 }}>{SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length].title}</span>
              </button>
            )
          })}
        </div>
      )}
      <button type="button" onClick={() => setAll((a) => !a)} style={{ ...smallBtn, marginTop: 12 }}>
        {all ? 'Show the next few Sundays' : 'Show every Sunday this year'}
      </button>
    </>
  )
}

function AssignmentsManager({ classId }: { classId: string }) {
  const [assignments, setAssignments] = useState<AssignmentRow[] | null>(null)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<AssignmentRow | null>(null)

  const load = useCallback(() => listAssignments(classId).then(setAssignments), [classId])
  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!title.trim()) return
    setCreating(true)
    try {
      await createAssignment({ class_id: classId, title, instructions, due_date: dueDate || undefined })
      setTitle('')
      setInstructions('')
      setDueDate('')
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (a: AssignmentRow) => {
    await setAssignmentStatus(a.id, a.status === 'published' ? 'closed' : 'published')
    haptics.tap()
    load()
  }

  if (open) return <SubmissionsView assignment={open} onBack={() => setOpen(null)} />

  const tone: Record<AssignmentRow['status'], string> = { draft: '#ffd84d', published: '#5cf0c8', closed: 'rgba(236,230,250,.5)' }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560, marginBottom: 14 }}>
        <input className="tp-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New assignment title" aria-label="Assignment title" />
        <textarea className="tp-field" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions" rows={3} style={{ resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" className="tp-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" style={{ width: 'auto' }} />
          <button type="button" onClick={create} disabled={creating} style={greenBtn}>
            {creating ? 'Creating…' : 'Create as draft'}
          </button>
        </div>
      </div>
      {assignments === null && <p style={{ margin: 0, color: dim }}>Loading…</p>}
      {assignments?.length === 0 && <p style={{ margin: 0, color: dim }}>No assignments yet.</p>}
      {assignments?.map((a) => (
        <div key={a.id} style={{ padding: '14px 0', borderTop: line }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#fff' }}>{a.title}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: dim }}>
              {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ` : ''}
              <span style={{ color: tone[a.status] }}>{a.status}</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <button type="button" onClick={() => setOpen(a)} style={{ ...smallBtn, borderColor: 'rgba(255,216,77,.4)', background: 'rgba(255,216,77,.08)' }}>
              Grade submissions
            </button>
            <button type="button" onClick={() => toggle(a)} style={smallBtn}>
              {a.status === 'published' ? 'Close' : 'Publish'}
            </button>
          </div>
        </div>
      ))}
    </>
  )
}

function CertificatesPanel({ students, className, teacherName }: { students: StudentRow[]; className: string; teacherName: string }) {
  const [who, setWho] = useState('')
  const [achievement, setAchievement] = useState(`For outstanding dedication and growth in ${className}.`)
  const [rendering, setRendering] = useState(false)
  const kid = students.find((s) => s.id === who) ?? students[0]

  const download = async () => {
    if (!kid) return
    setRendering(true)
    try {
      const url = await renderCertificatePng({
        studentName: kid.full_name,
        className,
        teacherName,
        achievement: achievement.trim() || 'For outstanding dedication and growth.',
        churchName: "MFM Children's Ministry",
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      })
      const a = document.createElement('a')
      a.href = url
      a.download = `${kid.full_name.replace(/\s+/g, '-')}-certificate.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      haptics.success()
    } finally {
      setRendering(false)
    }
  }

  if (!students.length) return <p style={{ margin: 0, color: dim }}>Add children to this class to make their certificates.</p>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <div style={{ flex: '1 1 280px', aspectRatio: '1.4/1', maxWidth: 420, padding: 22, boxSizing: 'border-box', borderRadius: 18, background: 'linear-gradient(135deg,#fff8e6,#ffe9b3)', color: '#3a2400', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '6px double #c99a2e' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.2em' }}>CERTIFICATE OF ACHIEVEMENT</p>
        <p style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 26 }}>{kid?.full_name}</p>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>{achievement.trim() || 'For outstanding dedication and growth.'}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 220px', maxWidth: 320 }}>
        <select value={kid?.id} onChange={(e) => setWho(e.target.value)} aria-label="Child" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,.16)', background: '#1a0f2e', color: '#fff', fontSize: 14 }}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <textarea className="tp-field" value={achievement} onChange={(e) => setAchievement(e.target.value)} rows={3} aria-label="What the certificate is for" style={{ fontSize: 14, resize: 'vertical' }} />
        <button type="button" onClick={download} disabled={rendering} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: '#ffd84d', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          {rendering ? 'Making it…' : 'Download PNG'}
        </button>
      </div>
    </div>
  )
}

// ---------- Quiz ----------

function QuizTab() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<'students' | 'classes'>('students')

  useEffect(() => {
    Promise.all([listMyClasses(), getLeaderboard(1000)])
      .then(([classes, leaderboard]) => {
        const myClassIds = new Set(classes.map((c) => c.id))
        setRows(leaderboard.filter((r) => r.class_id && myClassIds.has(r.class_id)))
      })
      .finally(() => setLoading(false))
  }, [])

  const classRows = useMemo(() => aggregateClassLeaderboard(rows), [rows])
  const cardLink = (bg: string): CSSProperties => ({ padding: 24, borderRadius: 24, background: bg, color: '#fff' })
  const k: CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '.14em' }
  const t: CSSProperties = { margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 26 }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 16 }}>
        <Link to="/setup" onClick={() => playClick()} style={cardLink('linear-gradient(150deg,#c13bff,#5a128a)')}>
          <span style={{ ...k, color: '#ffd84d' }}>BIG SCREEN</span>
          <p style={t}>Start a quiz show</p>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.85 }}>Teams, ladder, lifelines and scoreboard.</p>
        </Link>
        <Link to="/history" onClick={() => playClick()} style={cardLink('linear-gradient(150deg,#ff4fa3,#7a1446)')}>
          <span style={{ ...k, color: '#ffd84d' }}>HISTORY</span>
          <p style={t}>Past matches</p>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.85 }}>Every finished match, team scores and the full recap.</p>
        </Link>
        <Link to="/questions" onClick={() => playClick()} style={{ ...cardLink('rgba(255,255,255,.04)'), border: '1px solid rgba(255,255,255,.1)' }}>
          <span style={{ ...k, color: dim }}>QUESTIONS</span>
          <p style={t}>Question Bank</p>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(236,230,250,.65)' }}>Build and manage your questions and sets.</p>
        </Link>
      </div>
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <h2 style={{ ...h2, margin: 0 }}>Your classes’ leaderboard</h2>
          {classRows.length > 1 && (
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,.04)' }}>
              {(['students', 'classes'] as const).map((b) => (
                <button key={b} type="button" onClick={() => setBoard(b)} style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: board === b ? '#fff' : 'transparent', color: board === b ? '#0f0820' : dim, fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {b === 'students' ? 'Children' : 'Class vs class'}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading && <p style={{ margin: 0, color: dim }}>Loading…</p>}
        {!loading && rows.length === 0 && <p style={{ margin: 0, color: dim }}>No quiz results recorded yet for your children.</p>}
        {(board === 'students' || classRows.length <= 1 ? rows.map((r) => ({ id: r.student_id, n: r.full_name, s: r.class_name ?? '', p: r.total_points })) : classRows.map((c) => ({ id: c.class_id, n: c.class_name, s: `${c.student_count} children`, p: c.total_points }))).map((r, i) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: line, fontSize: 14 }}>
            <span style={{ width: 24, fontWeight: 800, color: i < 3 ? '#ffd84d' : dim }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.n} {r.s && <span style={{ fontWeight: 600, fontSize: 12, color: dim }}>· {r.s}</span>}
            </span>
            <span style={{ fontWeight: 800, color: '#5cf0c8' }}>{r.p.toLocaleString()} pts</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ---------- Ears for You ----------

const ESTAT: [EarsStatus, string, string][] = [
  ['new', 'New', '#ff8a96'],
  ['acknowledged', 'Acknowledged', '#9db8ff'],
  ['in_progress', 'In progress', '#ffd84d'],
  ['escalated', 'Escalated', '#ff6b80'],
  ['resolved', 'Resolved', '#5cf0c8'],
]

function EarsInboxTab({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<EarsMessageRow[] | null>(null)
  const [open, setOpen] = useState<EarsMessageRow | null>(null)

  const load = useCallback(() => {
    listEarsTeacherInbox()
      .then(setItems)
      .catch(() => setItems([]))
    onChange()
  }, [onChange])
  useEffect(() => {
    load()
  }, [load])

  const openItem = async (m: EarsMessageRow) => {
    playClick()
    setOpen(m)
    if (m.status === 'new') {
      await acknowledgeEarsMessage(m.id)
      load()
    }
  }

  const change = async (m: EarsMessageRow, s: EarsStatus) => {
    await setEarsStatus(m.id, s)
    haptics.tap()
    load()
  }

  if (open)
    return (
      <EarsDetail
        message={open}
        onBack={() => {
          setOpen(null)
          load()
        }}
      />
    )

  return (
    <>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(236,230,250,.6)' }}>A safe channel from children in your classes. Anonymous notes never reveal who sent them, even to you.</p>
      {items === null && <p style={{ color: dim }}>Loading…</p>}
      {items?.length === 0 && <p style={{ ...card, margin: 0, color: dim }}>Nothing here yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items?.map((m) => {
          const E = ESTAT.find((x) => x[0] === m.status) ?? ESTAT[0]
          return (
            <div key={m.id} style={{ padding: '18px 20px', borderRadius: 22, background: 'rgba(255,255,255,.04)', border: `1px solid ${m.status === 'new' ? 'rgba(255,107,128,.45)' : 'rgba(255,255,255,.1)'}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'rgba(236,230,250,.6)' }}>
                  {m.is_anonymous && <EyeOff style={{ width: 13, height: 13 }} />}
                  {m.is_anonymous ? 'Anonymous' : m.student_name || 'A child'} · {dayLabel(m.created_at)}
                </span>
                <select
                  value={m.status}
                  onChange={(e) => change(m, e.target.value as EarsStatus)}
                  aria-label="Status"
                  style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${E[2]}`, background: '#1a0f2e', color: E[2], fontSize: 12, fontWeight: 800 }}
                >
                  {/* Escalating asks why, so it lives on the note itself. */}
                  {ESTAT.filter(([v]) => v !== 'escalated' || m.status === 'escalated').map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => openItem(m)} style={{ display: 'block', width: '100%', margin: '10px 0 0', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', textAlign: 'left', fontSize: 16, lineHeight: 1.55, color: '#fff', cursor: 'pointer', whiteSpace: 'pre-wrap' }}>
                {m.body}
              </button>
              <button type="button" onClick={() => openItem(m)} style={{ ...smallBtn, marginTop: 12 }}>
                Reply or add a note
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ---------- Bible Buddy ----------

function BibleBuddyLogTab() {
  const [items, setItems] = useState<AiCompanionTeacherLogRow[] | null>(null)

  useEffect(() => {
    listBibleBuddyTeacherLog(50)
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  return (
    <>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(236,230,250,.6)' }}>Every question your children ask Bible Buddy, newest first, for safeguarding review. Anonymous ones never reveal who asked.</p>
      {items === null && <p style={{ color: dim }}>Loading…</p>}
      {items?.length === 0 && <p style={{ ...card, margin: 0, color: dim }}>No questions asked yet.</p>}
      {items?.map((b, i) => {
        const name = b.is_anonymous ? 'Anonymous' : b.student_name || 'A child'
        return (
          <div key={b.id} style={{ display: 'flex', gap: 14, padding: '16px 18px', marginBottom: 10, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
            {b.is_anonymous ? (
              <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EyeOff style={{ width: 16, height: 16, color: dim }} />
              </span>
            ) : (
              <Face name={name} i={i + 4} />
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 800, color: '#fff' }}>{name}</span>
                <span style={{ fontSize: 12, color: 'rgba(236,230,250,.45)', whiteSpace: 'nowrap' }}>{dayLabel(b.created_at)}</span>
              </span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 15, color: '#fff' }}>“{b.question}”</span>
              <span style={{ display: 'block', marginTop: 6, fontSize: 14, lineHeight: 1.55, color: 'rgba(236,230,250,.65)' }}>{b.answer}</span>
            </span>
          </div>
        )
      })}
    </>
  )
}

// ---------- Ministry Calendar ----------

const EVENT_COLS = ['#d12a7a', '#0e9a80', '#8a1fb0', '#e0a400', '#4f7bff']

function CalendarTab() {
  const [events, setEvents] = useState<MinistryEventRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    listMinistryEvents()
      .then(setEvents)
      .catch(() => {
        setFailed(true)
        setEvents([])
      })
  }, [])

  const today = todayDateKey()
  const upcoming = (events ?? []).filter((e) => e.event_date >= today)
  const past = (events ?? []).filter((e) => e.event_date < today).reverse().slice(0, 5)

  const row = (e: MinistryEventRow, i: number, faded = false) => {
    const d = new Date(`${e.event_date.slice(0, 10)}T00:00:00`)
    const col = EVENT_COLS[i % EVENT_COLS.length]
    return (
      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', marginBottom: 10, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', opacity: faded ? 0.6 : 1 }}>
        <span style={{ flexShrink: 0, width: 56, textAlign: 'center', padding: '8px 0', borderRadius: 14, background: col + '26' }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: col }}>{MON[d.getMonth()]}</span>
          <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 24, color: '#fff' }}>{d.getDate()}</span>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{e.title}</span>
          <span style={{ display: 'block', fontSize: 13, color: dim }}>{e.description || d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </span>
      </div>
    )
  }

  if (events === null) return <p style={{ color: dim }}>Loading…</p>
  if (failed) return <p style={{ ...card, margin: 0, color: dim }}>The calendar could not be loaded. Check your connection and open this tab again.</p>
  if (!events.length) return <p style={{ ...card, margin: 0, color: dim }}>No ministry events yet. Children’s Days, camps and parties appear here as soon as an admin adds them.</p>
  return (
    <>
      {upcoming.length === 0 && <p style={{ margin: '0 0 12px', color: dim }}>Nothing coming up yet.</p>}
      {upcoming.map((e, i) => row(e, i))}
      {past.length > 0 && <p style={{ margin: '22px 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: dim }}>EARLIER</p>}
      {past.map((e, i) => row(e, i + upcoming.length, true))}
    </>
  )
}

// ---------- Profile ----------

function ProfileTab({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url)
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setAvatar(await fileToResizedDataUrl(file))
    setSaved(false)
  }

  const save = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    await supabase.from('profiles').update({ full_name: fullName.trim(), avatar_url: avatar }).eq('id', data.user.id)
    playClick()
    haptics.success()
    setSaved(true)
    onSaved()
  }

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12, padding: 22, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {avatar ? (
          <img src={avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#19c99b,#07665a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 800, fontSize: 28, color: '#fff' }}>{first(fullName)[0]}</span>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          Change photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
      </div>
      <input
        className="tp-field"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value)
          setSaved(false)
        }}
        placeholder="Full name"
        aria-label="Full name"
      />
      <input className="tp-field" value={email} readOnly aria-label="Email" style={{ color: 'rgba(236,230,250,.6)' }} />
      <button type="button" onClick={save} style={{ ...greenBtn, alignSelf: 'flex-start', padding: '13px 22px' }}>
        {saved ? 'Saved ✓' : 'Save profile'}
      </button>
    </div>
  )
}

// ---------- application gate (between signup and approval) ----------

function ApplicationGate({ onChange }: { onChange: () => void }) {
  const [app, setApp] = useState<TeacherApplication | null | 'loading'>('loading')

  const load = () => getMyTeacherApplication().then(setApp)
  useEffect(() => {
    load()
  }, [])

  // The admin who approves an application is in another browser. Poll so the
  // teacher sitting on the pending screen is let in without signing out and
  // back in, which is what it used to take. onChange re-reads the profile
  // role, load() re-reads the application row.
  useEffect(() => {
    const id = setInterval(() => {
      load()
      onChange()
    }, 10000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange])

  if (app === 'loading') return <div className="py-20 text-center text-xl">Loading…</div>

  if (!app) {
    return (
      <ApplyForm
        onSubmitted={() => {
          load()
          onChange()
        }}
      />
    )
  }

  if (app.status === 'pending') {
    return (
      <StatusScreen
        icon={ClipboardList}
        title="Application Pending"
        body={`Thanks, ${app.full_name}! Your application is with the ministry admin for review. You'll be able to sign in as soon as you're approved.`}
      />
    )
  }

  return (
    <StatusScreen
      icon={X}
      title="Application Not Approved"
      body="Your application wasn't approved this time. Reach out to the ministry admin if you think this is a mistake."
    />
  )
}

function StatusScreen({ icon: Icon, title, body }: { icon: typeof ClipboardList; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <p className="text-sm text-[var(--ink-muted)]">{body}</p>
      <p className="text-xs text-[var(--ink-faint)]">This page is watching. If your account is approved while it is open, it will let you straight in.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => signOut()} className="btn-solid text-sm">
          Sign In as a Teacher
        </button>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>
    </div>
  )
}

function ApplyForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!fullName.trim()) return setError('Your full name is required.')
    setSubmitting(true)
    setError('')
    try {
      const { data } = await supabase.auth.getUser()
      await submitTeacherApplication({ full_name: fullName, email: data.user?.email ?? '', phone, message })
      playClick()
      haptics.success()
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Apply to Teach</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Tell us about yourself. A ministry admin will review your application.</p>
      </div>
      <div className="panel space-y-3 p-5">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" className={inputClass} />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us a bit about yourself and why you'd like to teach (optional)"
          rows={4}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting} className="btn-solid w-full py-3 text-base">
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}

function todayDateKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "14 Sep" - short enough to head a narrow column. */
function shortDate(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface AttendanceSummary {
  student: StudentRow
  /** present / marked, over every register in the window. */
  presentCount: number
  markedCount: number
  /** How many registers in a row, counting back from the latest, they were marked absent. */
  missedRun: number
}

function summarise(students: StudentRow[], history: AttendanceHistory): AttendanceSummary[] {
  return students.map((student) => {
    const marks = history.byStudent[student.id] ?? {}
    let presentCount = 0
    let markedCount = 0
    let missedRun = 0
    let runOpen = true

    // dates are newest first, so walking them in order counts back from the
    // most recent Sunday. A date the child was never marked on at all (they
    // joined later, the register was taken before they enrolled) neither
    // breaks the run nor counts toward it.
    for (const date of history.dates) {
      const mark = marks[date]
      if (mark === undefined) continue
      markedCount += 1
      if (mark) {
        presentCount += 1
        runOpen = false
      } else if (runOpen) {
        missedRun += 1
      }
    }

    return { student, presentCount, markedCount, missedRun }
  })
}

/**
 * Attendance across weeks, rather than one Sunday at a time.
 *
 * The register answers "who is here today". The question that actually needs
 * answering is the one it cannot: which child has quietly stopped coming. So
 * the run of missed Sundays leads, and the grid of every register sits under
 * it as the working.
 */
function AttendanceOverWeeks({ classId, students }: { classId: string; students: StudentRow[] }) {
  const [history, setHistory] = useState<AttendanceHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listAttendanceHistory(classId)
      .then(setHistory)
      .catch(() => setHistory(null))
      .finally(() => setLoading(false))
  }, [classId])

  const summaries = useMemo(() => (history ? summarise(students, history) : []), [students, history])
  const concerns = useMemo(
    () => summaries.filter((s) => s.missedRun >= 2).sort((a, b) => b.missedRun - a.missedRun),
    [summaries],
  )

  if (loading) return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
  if (!history || history.dates.length === 0) {
    return (
      <p className="panel p-5 text-sm text-[var(--ink-muted)]">
        No registers taken yet. Once you have marked a couple of Sundays, this is where the pattern shows up.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {concerns.length > 0 && (
        <div className="panel space-y-3 p-5">
          <p className="flex items-center gap-2 font-display font-bold">
            <AlertTriangle className="h-4 w-4 text-[var(--gold)]" />
            Worth a phone call
          </p>
          <div className="space-y-2">
            {concerns.map((c) => (
              <div key={c.student.id} className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] pb-2 last:border-b-0 last:pb-0">
                <p className="font-semibold">{c.student.full_name}</p>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${c.missedRun >= 3 ? 'bg-red-500/15 text-red-700' : 'bg-[var(--gold)]/15 text-[var(--gold)]'}`}
                >
                  Missed the last {c.missedRun}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel overflow-hidden p-0">
        {/* Wide on purpose - one column per register. The table scrolls
            sideways inside this box so the page itself never does. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline-strong)]">
                <th className="sticky left-0 z-10 bg-[var(--ink-panel)] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                  Child
                </th>
                {history.dates.map((d) => (
                  <th key={d} className="whitespace-nowrap px-3 py-3 text-center text-xs font-semibold text-[var(--ink-muted)]">
                    {shortDate(d)}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                  Came
                </th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.student.id} className="border-b border-[var(--hairline)] last:border-b-0">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-[var(--ink-panel)] px-4 py-2.5 font-semibold">{s.student.full_name}</td>
                  {history.dates.map((d) => {
                    const mark = history.byStudent[s.student.id]?.[d]
                    return (
                      <td key={d} className="px-3 py-2.5 text-center">
                        <span
                          aria-label={mark === undefined ? 'Not marked' : mark ? 'Present' : 'Absent'}
                          title={mark === undefined ? 'Not marked' : mark ? 'Present' : 'Absent'}
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            mark === undefined ? 'bg-[var(--hairline-strong)]' : mark ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                      </td>
                    )
                  })}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[var(--ink-muted)]">
                    {s.presentCount} of {s.markedCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[var(--ink-faint)]">
        Green is present, red is absent, grey means no register was taken for that child that day. Last {history.dates.length} registers.
      </p>
    </div>
  )
}

/**
 * Gives a child a brand new passcode when they have forgotten the old one.
 *
 * Confirms first, because the old passcode stops working the moment this
 * runs, and a child signed in on a tablet somewhere gets logged out of an
 * account they can no longer get back into unless the teacher actually hands
 * the new one over. Shown once, here, then gone.
 */
function PasscodeResetModal({ student, onClose }: { student: StudentRow; onClose: () => void }) {
  const [working, setWorking] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const run = async () => {
    setWorking(true)
    setError('')
    try {
      const result = await resetStudentPasscode(student.id)
      setPasscode(result.passcode)
      haptics.success()
      playClick()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset that passcode.')
      haptics.error()
    } finally {
      setWorking(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(passcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked. The passcode is already on screen to read out.
    }
  }

  return (
    <Sheet title={passcode ? 'New passcode' : `Reset ${student.full_name}'s passcode?`} onClose={onClose}>
      {passcode ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ink-muted)]">
            Read this out to {student.full_name.split(' ')[0]} now. You will not be able to see it again.
          </p>
          <p
            className="rounded-lg border border-[var(--hairline-strong)] bg-[var(--gold)]/10 py-4 text-center font-display text-2xl font-extrabold tracking-wide text-[var(--gold)]"
          >
            {passcode}
          </p>
          <button onClick={copy} className="btn-outline flex w-full items-center justify-center gap-1.5 py-2 text-sm">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy passcode'}
          </button>
          <button onClick={onClose} className="btn-solid w-full py-3 text-sm">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ink-muted)]">
            Their old passcode stops working straight away, and they will be signed out on any device. Only do this with {student.full_name.split(' ')[0]} there
            with you, so you can give them the new one.
          </p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button onClick={run} disabled={working} className="btn-solid w-full py-3 text-sm">
            {working ? 'Resetting…' : 'Give them a new passcode'}
          </button>
          <button onClick={onClose} className="btn-outline w-full py-2 text-sm">
            Cancel
          </button>
        </div>
      )}
    </Sheet>
  )
}

function SubmissionsView({ assignment, onBack }: { assignment: AssignmentRow; onBack: () => void }) {
  const [subs, setSubs] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, { grade: string; feedback: string }>>({})

  const load = () => listSubmissionsForAssignment(assignment.id).then((s) => { setSubs(s); setLoading(false) })
  useEffect(() => { load() }, [assignment.id])

  const save = async (id: string) => {
    const d = drafts[id]
    if (!d) return
    const grade = parseFloat(d.grade)
    if (Number.isNaN(grade)) return
    await gradeSubmission(id, grade, d.feedback ?? '')
    playClick()
    haptics.success()
    load()
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--fg)]">
        <ArrowLeft className="h-4 w-4" /> Back to assignments
      </button>
      <h3 className="font-display text-lg font-bold">{assignment.title}</h3>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && subs.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No submissions yet.</p>}
      <div className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="panel p-4">
            <p className="font-semibold">{s.full_name}</p>
            {s.body && <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--fg)]/80">{s.body}</p>}
            <p className="mt-1 text-xs text-[var(--ink-faint)]">Submitted {new Date(s.submitted_at).toLocaleString()}</p>
            {s.grade !== null ? (
              <p className="mt-2 text-sm font-bold text-emerald-700">
                Graded: {s.grade}
                {assignment.max_score ? ` / ${assignment.max_score}` : ''}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  placeholder="Grade"
                  value={drafts[s.id]?.grade ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: { grade: e.target.value, feedback: d[s.id]?.feedback ?? '' } }))}
                  className={`${inputClass} w-24 py-2 text-sm`}
                />
                <input
                  placeholder="Feedback (optional)"
                  value={drafts[s.id]?.feedback ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: { grade: d[s.id]?.grade ?? '', feedback: e.target.value } }))}
                  className={`${inputClass} flex-1 py-2 text-sm`}
                />
                <button onClick={() => save(s.id)} className="btn-solid shrink-0 px-4 py-2 text-sm">
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const EARS_STATUS_STYLE: Record<EarsStatus, string> = {
  new: 'bg-[var(--gold)]/15 text-[var(--gold)]',
  acknowledged: 'bg-[var(--fg)]/10 text-[var(--fg)]/60',
  in_progress: 'bg-sky-500/15 text-sky-700',
  escalated: 'bg-red-500/15 text-red-700',
  resolved: 'bg-emerald-500/15 text-emerald-700',
}

function EarsDetail({ message, onBack }: { message: EarsMessageRow; onBack: () => void }) {
  const [replies, setReplies] = useState<EarsReplyRow[]>([])
  const [notes, setNotes] = useState<EarsNoteRow[]>([])
  const [replyDraft, setReplyDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [escalating, setEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [status, setStatus] = useState(message.status)

  const load = () => {
    listEarsReplies(message.id).then(setReplies)
    listEarsInternalNotes(message.id).then(setNotes)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id])

  const sendReply = async () => {
    if (!replyDraft.trim()) return
    await addEarsReply(message.id, replyDraft)
    setReplyDraft('')
    playClick()
    haptics.success()
    load()
  }

  const sendNote = async () => {
    if (!noteDraft.trim()) return
    await addEarsInternalNote(message.id, noteDraft)
    setNoteDraft('')
    playClick()
    load()
  }

  const changeStatus = async (s: EarsStatus) => {
    await setEarsStatus(message.id, s)
    setStatus(s)
    haptics.tap()
    load()
  }

  const escalate = async () => {
    if (!escalateReason.trim()) return
    await escalateEarsMessage(message.id, escalateReason)
    setStatus('escalated')
    setEscalating(false)
    setEscalateReason('')
    haptics.success()
    load()
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--fg)]">
        <ArrowLeft className="h-4 w-4" /> Back to inbox
      </button>

      <div className="panel p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--ink-muted)]">{message.is_anonymous ? 'Anonymous' : message.student_name || 'A student'}</p>
          <span className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${EARS_STATUS_STYLE[status]}`}>{status.replace('_', ' ')}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['in_progress', 'resolved'] as const).map((s) => (
          <button key={s} onClick={() => changeStatus(s)} className="btn-outline px-3 py-1.5 text-xs capitalize">
            Mark {s.replace('_', ' ')}
          </button>
        ))}
        {!escalating ? (
          <button onClick={() => setEscalating(true)} className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-500/25">
            Escalate to Admin
          </button>
        ) : null}
      </div>

      {escalating && (
        <div className="panel space-y-2 p-4">
          <p className="text-sm font-bold text-red-700">Why does this need admin attention?</p>
          <input value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Reason" className={`${inputClass} py-2 text-sm`} />
          <div className="flex gap-2">
            <button onClick={escalate} className="rounded-md bg-red-500/15 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-500/25">
              Confirm Escalation
            </button>
            <button onClick={() => setEscalating(false)} className="btn-outline px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="eyebrow">Replies to the Student</p>
        {replies.map((r) => (
          <div key={r.id} className="rounded-md bg-emerald-500/10 p-3 text-sm">
            {r.body}
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Write a reply the student will see…"
            className={`${inputClass} py-2 text-sm`}
            onKeyDown={(e) => e.key === 'Enter' && sendReply()}
          />
          <button onClick={sendReply} className="btn-solid shrink-0 text-sm">
            Send
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="eyebrow">Internal Notes, not visible to the student</p>
        {notes.map((n) => (
          <div key={n.id} className="rounded-md border border-[var(--fg)]/10 bg-[var(--fg)]/5 p-3 text-sm text-[var(--fg)]/70">
            {n.body}
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Note for staff only…"
            className={`${inputClass} py-2 text-sm`}
            onKeyDown={(e) => e.key === 'Enter' && sendNote()}
          />
          <button onClick={sendNote} className="btn-outline shrink-0 text-sm">
            Add Note
          </button>
        </div>
      </div>
    </div>
  )
}

