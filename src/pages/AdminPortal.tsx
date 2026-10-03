import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  School,
  CalendarRange,
  CalendarDays,
  Users,
  BookOpen,
  ArrowLeft,
  Gamepad2,
  Database,
  Music,
  Clapperboard,
  File as FileIcon,
  Trash2,
  Download,
  Lock,
  Eye,
  EyeOff,
  Heart,
  ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import { signOut, type Profile } from '../lib/supabase'
import { bibleComUrl } from '../lib/bibleLink'
import { db } from '../db/db'
import type { DigitalBankFile } from '../db/types'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import PortalShell from '../components/PortalShell'
import AvatarReviewQueue from '../components/AvatarReviewQueue'
import PortalSearch from '../components/PortalSearch'
import {
  listTeacherApplications,
  approveTeacher,
  listAllClassesWithTeacher,
  getClassStats,
  listSeasons,
  createSeasonServer,
  setActiveSeasonServer,
  countAttemptsBySeason,
  listAllTeachers,
  promoteToAdmin,
  listBiblePlans,
  createBiblePlan,
  setActiveBiblePlan,
  countReadersByPlan,
  listPlanReadings,
  addBibleReading,
  getLeaderboard,
  aggregateClassLeaderboard,
  listMinistryEvents,
  createMinistryEvent,
  updateMinistryEvent,
  deleteMinistryEvent,
  listEarsAuditLog,
  listEarsTeacherInbox,
  listBibleBuddyTeacherLog,
  type EarsAuditLogRow,
  type EarsMessageRow,
  type EarsStatus,
  type AiCompanionTeacherLogRow,
  type TeacherApplication,
  type ClassRow,
  type ClassStats,
  type SeasonRow,
  type MinistryEventRow,
  type BiblePlanRow,
  type BibleReadingRow,
  type LeaderboardRow,
  type SearchResult,
} from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { setLastPortal } from '../lib/lastPortal'
import '../design/admin.css'

// The Claude Design handoff's Admin Portal (Admin Portal.dc.html): the same
// sidebar workspace as the teacher's, in night-blue. Every number is the
// ministry's own; where the design shows something the ministry does not
// have (switchable safety settings, an email invite) the real equivalent
// stands in its place rather than a control that does nothing.

const display = "'Bricolage Grotesque', sans-serif"
const AV = ['#19c99b', '#ff8a3d', '#7a5cff', '#6f9bff', '#ff4fa3', '#e0a400', '#c13bff', '#e0405a']
const dim = 'rgba(220,230,255,.55)'
const line = '1px solid rgba(255,255,255,.08)'
const card: CSSProperties = { padding: 20, borderRadius: 22, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }
const h3: CSSProperties = { margin: '0 0 6px', fontFamily: display, fontWeight: 800, fontSize: 19, color: '#fff' }
const smallBtn: CSSProperties = { padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }
const blueBtn: CSSProperties = { padding: '0 18px', minHeight: 46, borderRadius: 12, border: 'none', background: '#6f9bff', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }
const pill = (bg: string, fg: string): CSSProperties => ({ flexShrink: 0, padding: '6px 12px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', whiteSpace: 'nowrap' })
const muted = (text: string) => <p style={{ margin: 0, fontSize: 14, color: dim }}>{text}</p>
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const TITLES = /^(sis|sister|bro|brother|mr|mrs|ms|miss|dr|pastor|pst|rev|deacon|deaconess|evang)\.?$/i
/** The first name, past any title: "Sis. Ada Nwosu" is Ada. */
const first = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/).find((w) => w && !TITLES.test(w)) || ''
const initial = (name: string | null | undefined) => (first(name)[0] ?? '?').toUpperCase()

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Chips<T extends string>({ value, items, onChange }: { value: T; items: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="ap-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14 }}>
      {items.map(([v, label]) => {
        const on = v === value
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: `1px solid ${on ? 'rgba(111,155,255,.5)' : 'rgba(255,255,255,.14)'}`, background: on ? 'rgba(111,155,255,.2)' : 'transparent', color: on ? '#fff' : dim, fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function AdminPortal() {
  const auth = useMinistryAuth()
  const { session, profile, loading, refreshProfile } = auth

  // Remembered so an installed home-screen icon can launch straight into
  // /admin next time (see the redirect script in index.html), instead of
  // always opening the marketing landing page first.
  useEffect(() => {
    if (session && profile?.role === 'admin') setLastPortal('admin')
  }, [session, profile])

  if (session && profile?.role === 'admin') return <AdminDashboard profile={profile} />
  return (
    <PortalShell eyebrow="Admin Control Centre">
      {loading ? (
        <div className="py-20 text-center text-xl">Loading…</div>
      ) : !session ? (
        <AuthCard
          icon={ShieldCheck}
          title="Admin Control Centre"
          subtitle="For the senior pastor and ministry admins only."
          signUpLabel="Create Account"
          afterSignUp={(email) => (
            <>
              <p>Admin access isn't self-service. An existing admin (or the senior pastor) needs to promote your account.</p>
              <p className="mt-2 text-[var(--fg)]/70">
                Tell them the email you signed up with: <span className="font-bold text-[var(--gold)]">{email}</span>
              </p>
            </>
          )}
        />
      ) : (
        <NotAuthorized onRecheck={refreshProfile} />
      )}
    </PortalShell>
  )
}

function NotAuthorized({ onRecheck }: { onRecheck: () => void }) {
  // Somebody else grants the admin role, from another browser. Watch for it
  // rather than making the person sign out and back in to find out: the hook
  // already re-reads the profile when the tab regains focus, and this covers
  // the case where they never leave the tab at all.
  useEffect(() => {
    const id = setInterval(onRecheck, 10000)
    return () => clearInterval(id)
  }, [onRecheck])

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Not an Admin (Yet)</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        You're signed in with a different account. Sign in as an admin, or ask an existing admin to promote this one from the Admins tab.
      </p>
      <p className="text-xs text-[var(--ink-faint)]">If somebody promotes you while this page is open, it will let you straight in.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => signOut()} className="btn-solid text-sm">
          Sign In as Admin
        </button>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>
    </div>
  )
}

// ---------- main dashboard ----------

type Tab = 'applications' | 'classes' | 'seasons' | 'quiz' | 'bible' | 'calendar' | 'digitalbank' | 'admins' | 'safety'

const TABS: [Tab, string, LucideIcon][] = [
  ['applications', 'Teacher Applications', FileText],
  ['classes', 'All Classes', School],
  ['seasons', 'Seasons', CalendarRange],
  ['quiz', 'Quiz', Gamepad2],
  ['bible', 'Bible Plans', BookOpen],
  ['calendar', 'Ministry Calendar', CalendarDays],
  ['digitalbank', 'Digital Bank', Database],
  ['admins', 'Admins', Users],
  ['safety', 'Safety & Privacy', ShieldCheck],
]

const HEAD: Record<Tab, string> = {
  applications: 'Review new teachers',
  classes: 'Every class in the ministry',
  seasons: 'Quiz competitions',
  quiz: 'Question bank health',
  bible: 'Reading plans for children',
  calendar: 'Dates for the whole ministry',
  digitalbank: 'Songs, videos and documents',
  admins: 'Who can manage the ministry',
  safety: 'Protections for every child',
}

function AdminDashboard({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('applications')
  // The class a search result pointed at, so the table can say which row was
  // meant. An admin here has eleven classes and rising; landing on a list of
  // them with nothing marked is barely better than not searching.
  const [highlightClass, setHighlightClass] = useState<string | null>(null)
  const [pending, setPending] = useState(0)

  const refreshPending = useCallback(() => {
    listTeacherApplications('pending')
      .then((rows) => setPending(rows.length))
      .catch(() => {})
  }, [])
  useEffect(() => {
    refreshPending()
  }, [refreshPending, tab])

  const go = (t: Tab, classId: string | null = null) => {
    playClick()
    setHighlightClass(classId)
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  const goToResult = (r: SearchResult) => {
    if (r.kind === 'teacher') return go('applications')
    go('classes', r.kind === 'class' ? r.id : r.class_id)
  }

  const navLink: CSSProperties = { padding: '7px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12 }
  const label = TABS.find(([id]) => id === tab)![1]

  return (
    <div data-dc-screen="admin">
      <aside style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0, width: 'clamp(72px,18vw,240px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 12px', borderRight: line, background: 'rgba(4,7,16,.7)', overflowY: 'auto' }}>
        <Link to="/" style={{ display: 'flex', padding: '4px 6px 16px' }}>
          <span style={{ flexShrink: 0, display: 'flex', background: '#fff', borderRadius: 10, padding: '3px 6px' }}>
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 26, display: 'block' }} />
          </span>
        </Link>
        {TABS.map(([id, text, Icon]) => {
          const on = id === tab
          return (
            <button
              key={id}
              type="button"
              title={text}
              aria-current={on ? 'page' : undefined}
              className="ap-tab"
              onClick={() => go(id)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 14, border: 'none', background: on ? 'rgba(111,155,255,.2)' : 'transparent', color: on ? '#fff' : 'rgba(220,230,255,.65)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, textAlign: 'left', cursor: 'pointer', transition: 'background .2s' }}
            >
              <Icon style={{ flexShrink: 0, width: 20, height: 20 }} strokeWidth={2} />
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
              {id === 'applications' && pending > 0 && (
                <span className="ap-badge" style={{ minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: '#ff4f6b', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ap-ping 1.6s infinite' }}>{pending}</span>
              )}
            </button>
          )
        })}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px 0', borderTop: line }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6f9bff,#2a3fb8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>{initial(profile.full_name)}</span>
          )}
          <span className="ap-who" style={{ minWidth: 0, fontSize: 13, lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name || 'Admin'}</span>
            <span style={{ display: 'block', color: 'rgba(220,230,255,.5)' }}>Admin</span>
          </span>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: 'clamp(18px,3vw,36px) clamp(14px,3vw,40px) 80px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: dim }}>{HEAD[tab]}</p>
            <h1 style={{ margin: '4px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1, letterSpacing: '-.03em', color: '#fff' }}>{label}</h1>
          </div>
          <nav style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)' }}>
            <Link to="/" className="ap-navlink" style={navLink}>
              Home
            </Link>
            <span style={{ ...navLink, background: '#fff', color: '#070b18' }}>Admin</span>
            <button type="button" className="ap-navlink" onClick={() => signOut()} style={{ ...navLink, border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              Sign out
            </button>
          </nav>
        </div>

        <div style={{ marginTop: 18, maxWidth: 560 }}>
          <PortalSearch placeholder="Find a child, a class, a teacher…" onPick={goToResult} />
        </div>

        {/* Draws nothing unless something is waiting. An admin is the only
            one who can clear a picture from a child who has not been put in
            a class yet, since no teacher can reach them. */}
        <div style={{ marginTop: 18 }}>
          <AvatarReviewQueue />
        </div>

        <div key={`${tab}-${highlightClass ?? ''}`} style={{ marginTop: 24, animation: 'ap-up .4s both' }}>
          {tab === 'applications' && <ApplicationsTab onChange={refreshPending} />}
          {tab === 'classes' && <ClassesTab highlightId={highlightClass} />}
          {tab === 'seasons' && <SeasonsTab />}
          {tab === 'quiz' && <QuizTab />}
          {tab === 'bible' && <BiblePlansTab />}
          {tab === 'calendar' && <MinistryCalendarTab />}
          {tab === 'digitalbank' && <DigitalBankTab />}
          {tab === 'admins' && <AdminsTab />}
          {tab === 'safety' && <SafetyTab />}
        </div>
      </main>
    </div>
  )
}

// ---------- Teacher Applications ----------

type AppFilter = 'pending' | 'approved' | 'rejected' | 'all'

function ApplicationsTab({ onChange }: { onChange: () => void }) {
  const [apps, setApps] = useState<TeacherApplication[]>([])
  const [filter, setFilter] = useState<AppFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    listTeacherApplications(filter === 'all' ? undefined : filter)
      .then(setApps)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the applications.'))
      .finally(() => setLoading(false))
  }, [filter])
  useEffect(load, [load])

  const handle = async (id: string, approve: boolean) => {
    setBusy(id)
    setError('')
    try {
      await approveTeacher(id, approve)
      playClick()
      haptics.success()
      load()
      onChange()
    } catch (e) {
      haptics.error()
      setError(e instanceof Error ? e.message : 'Could not save that.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <Chips<AppFilter> value={filter} onChange={setFilter} items={[['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Declined'], ['all', 'All']]} />
      {error && <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
      {loading && muted('Loading…')}
      {!loading && apps.length === 0 && muted(filter === 'pending' ? 'No one is waiting. New applications land here first.' : 'Nothing here.')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {apps.map((a, i) => {
          const isPending = a.status === 'pending'
          return (
            <div key={a.id} style={{ ...card, border: `1px solid ${isPending ? 'rgba(255,216,77,.35)' : 'rgba(255,255,255,.1)'}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
                <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: '50%', background: AV[i % AV.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' }}>{initial(a.full_name)}</span>
                <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 17, color: '#fff' }}>{a.full_name}</span>
                  <span style={{ display: 'block', fontSize: 13, color: dim, overflowWrap: 'anywhere' }}>
                    {a.email}
                    {a.phone ? ` · ${a.phone}` : ''} · applied {ago(a.created_at)}
                  </span>
                </span>
                {isPending ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" disabled={busy === a.id} onClick={() => handle(a.id, false)} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,107,128,.45)', background: 'transparent', color: '#ff8a96', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                      Decline
                    </button>
                    <button type="button" disabled={busy === a.id} onClick={() => handle(a.id, true)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#2fc9a0', color: '#03231b', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                      Approve
                    </button>
                  </div>
                ) : a.status === 'approved' ? (
                  <span style={pill('rgba(47,201,160,.16)', '#5cf0c8')}>APPROVED</span>
                ) : (
                  <span style={pill('rgba(255,107,128,.14)', '#ff8a96')}>DECLINED</span>
                )}
              </div>
              {a.message && <p style={{ margin: '12px 0 0', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.04)', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>“{a.message}”</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- All Classes ----------

function ClassesTab({ highlightId }: { highlightId?: string | null }) {
  const [classes, setClasses] = useState<(ClassRow & { teacher_name: string })[]>([])
  const [stats, setStats] = useState<Map<string, ClassStats>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listAllClassesWithTeacher(), getClassStats().catch(() => new Map<string, ClassStats>())])
      .then(([c, s]) => {
        // Live classes first, then the archived ones, each in name order.
        setClasses([...c].sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name)))
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return muted('Loading…')
  if (classes.length === 0) return muted('No classes created yet. A class appears here as soon as a teacher makes one.')
  const cols = '2fr 1.5fr 1fr 1.2fr 1fr'
  return (
    <div style={{ overflowX: 'auto', borderRadius: 22, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)' }}>
      <div style={{ minWidth: 640 }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, padding: '14px 18px', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(220,230,255,.5)' }}>
          <span>CLASS</span>
          <span>TEACHER</span>
          <span>CHILDREN</span>
          <span>ATTENDANCE</span>
          <span>POINTS</span>
        </div>
        {classes.map((c) => {
          const s = stats.get(c.id)
          const hit = c.id === highlightId
          return (
            <div
              key={c.id}
              ref={hit ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined}
              className="ap-row"
              style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, alignItems: 'center', padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.07)', background: hit ? 'rgba(111,155,255,.14)' : undefined, opacity: c.archived ? 0.6 : 1 }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: dim }}>
                  Code <span style={{ fontFamily: 'ui-monospace, monospace', color: '#9db8ff' }}>{c.join_code}</span>
                  {c.archived ? ' · Archived' : ''}
                </span>
              </span>
              <span>{c.teacher_name || 'Unknown'}</span>
              <span>{s?.children ?? 0}</span>
              {s?.attendance == null ? (
                <span style={{ fontSize: 13, color: dim }}>No register yet</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, height: 6, borderRadius: 9, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${s.attendance}%`, background: '#2fc9a0' }} />
                  </span>
                  {s.attendance}%
                </span>
              )}
              <span style={{ fontWeight: 800, color: '#ffd84d' }}>{(s?.points ?? 0).toLocaleString()}</span>
            </div>
          )
        })}
      </div>
      <p style={{ margin: 0, padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 12, color: dim }}>Attendance covers the last 12 weeks of registers.</p>
    </div>
  )
}

// ---------- Seasons ----------

function SeasonsTab() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([])
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    Promise.all([listSeasons(), countAttemptsBySeason().catch(() => new Map<string, number>())])
      .then(([s, c]) => {
        setSeasons(s)
        setCounts(c)
      })
      .finally(() => setLoading(false))
  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!name.trim()) return
    setError('')
    try {
      await createSeasonServer(name)
      setName('')
      setAdding(false)
      playClick()
      load()
    } catch (e) {
      haptics.error()
      setError(e instanceof Error ? e.message : 'Could not create the season.')
    }
  }

  const activate = async (id: string) => {
    await setActiveSeasonServer(id)
    haptics.tap()
    load()
  }

  if (loading) return muted('Loading…')
  return (
    <div>
      {error && <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 14 }}>
        {seasons.map((s) => {
          const n = counts.get(s.id) ?? 0
          const live = s.is_active
          const st = live ? 'LIVE' : n > 0 ? 'FINISHED' : 'NOT STARTED'
          const started = new Date(s.created_at)
          return (
            <div key={s.id} style={{ padding: 22, borderRadius: 22, background: live ? 'rgba(255,79,163,.14)' : 'rgba(255,255,255,.04)', border: `1px solid ${live ? 'rgba(255,79,163,.45)' : 'rgba(255,255,255,.1)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ padding: '5px 11px', borderRadius: 999, background: live ? '#ff4fa3' : 'rgba(255,255,255,.1)', color: live ? '#fff' : 'rgba(220,230,255,.7)', fontSize: 11, fontWeight: 800, letterSpacing: '.1em' }}>{st}</span>
                {!live && (
                  <button type="button" onClick={() => activate(s.id)} style={smallBtn}>
                    Make live
                  </button>
                )}
              </div>
              <p style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 24, color: '#fff' }}>{s.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                Created {MON[started.getMonth()].charAt(0) + MON[started.getMonth()].slice(1).toLowerCase()} {started.getFullYear()} · {n} quiz {n === 1 ? 'result' : 'results'}
              </p>
            </div>
          )
        })}
        {adding ? (
          <div style={{ padding: 22, borderRadius: 22, border: '1px dashed rgba(255,255,255,.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input autoFocus className="ap-field" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder='e.g. "Autumn 2026"' />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={create} style={blueBtn}>
                Create season
              </button>
              <button type="button" onClick={() => setAdding(false)} style={{ ...smallBtn, padding: '0 14px' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} style={{ padding: 22, minHeight: 120, borderRadius: 22, border: '1px dashed rgba(255,255,255,.25)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
            + New season
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- Quiz ----------

function QuizTab() {
  const [levels, setLevels] = useState<number[] | null>(null)
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<'students' | 'classes'>('students')

  useEffect(() => {
    // The question bank lives on this device, like the rest of the quiz.
    db.questions.toArray().then((qs) => {
      const n = [0, 0, 0, 0, 0]
      for (const q of qs) if (q.difficulty >= 1 && q.difficulty <= 5) n[q.difficulty - 1] += 1
      setLevels(n)
    })
    // High enough to be "everyone" for any realistic church - the class
    // totals below would silently undercount if this were capped low.
    getLeaderboard(1000)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const classRows = useMemo(() => aggregateClassLeaderboard(rows), [rows])
  const top = Math.max(1, ...(levels ?? [1]))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 12 }}>
        {(levels ?? [0, 0, 0, 0, 0]).map((n, i) => (
          <div key={i} style={{ padding: 18, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(220,230,255,.5)' }}>LEVEL {i + 1}</p>
            <p style={{ margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 34, color: '#fff' }}>{levels ? n : '…'}</p>
            <div style={{ marginTop: 8, height: 6, borderRadius: 9, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((n / top) * 100)}%`, background: '#ffd84d', transformOrigin: 'left', animation: 'ap-grow .8s both' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <Link to="/questions" onClick={() => playClick()} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontWeight: 800, fontSize: 14 }}>
          Open Question Bank
        </Link>
        <Link to="/history" onClick={() => playClick()} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontWeight: 800, fontSize: 14 }}>
          Match history
        </Link>
        {/* Hosting was a teacher-only door by accident, not by design: Game
            Setup has always let an admin link a team to a Student Code and
            record a result for any child in the ministry. */}
        <Link to="/setup" onClick={() => playClick()} style={{ padding: '13px 20px', borderRadius: 14, background: '#ffd84d', color: '#1a0f2e', fontWeight: 800, fontSize: 14 }}>
          Run a quiz
        </Link>
      </div>

      <div style={{ ...card, marginTop: 22 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <h3 style={h3}>Ministry leaderboard</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['students', 'classes'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBoard(b)}
                style={{ padding: '6px 12px', borderRadius: 999, border: 'none', background: board === b ? '#6f9bff' : 'rgba(255,255,255,.06)', color: board === b ? '#fff' : dim, fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                {b === 'students' ? 'Children' : 'Class vs class'}
              </button>
            ))}
          </div>
        </div>
        {loading && muted('Loading…')}
        {!loading && rows.length === 0 && muted('No quiz results recorded yet.')}
        {(board === 'students'
          ? rows.slice(0, 20).map((r) => ({ id: r.student_id, n: r.full_name, sub: r.class_name, p: r.total_points }))
          : classRows.map((c) => ({ id: c.class_id, n: c.class_name, sub: `${c.student_count} ${c.student_count === 1 ? 'child' : 'children'}`, p: c.total_points }))
        ).map((r, i) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 14 }}>
            <span style={{ width: 22, flexShrink: 0, fontWeight: 800, color: dim }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 800, color: '#fff' }}>{r.n}</span>
              {r.sub && <span style={{ color: dim }}> · {r.sub}</span>}
            </span>
            <span style={{ flexShrink: 0, fontWeight: 800, color: '#ffd84d' }}>{r.p.toLocaleString()} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Bible Plans ----------

const SCENES = ['david', 'u5', 'solomon', 'moses', 'noah', 'esther', 'daniel', 'joseph', 'ruth', 'paul', 'peter', 'jonah']
const ALL_SCENES = [...SCENES, 'abraham', 'adam', 'deborah', 'elijah', 'gideon', 'john', 'joshua', 'mary', 'samson']

/** A picture for a plan: the Bible figure its title names, or one in turn. */
function planScene(title: string, i: number) {
  const t = title.toLowerCase()
  const named = ALL_SCENES.find((s) => s.length > 2 && t.includes(s))
  if (named) return `/scenes/${named}.jpg`
  if (/jesus|gospel|christ/.test(t)) return '/scenes/u5.jpg'
  if (/psalm|proverb/.test(t)) return '/scenes/solomon.jpg'
  return `/scenes/${SCENES[i % SCENES.length]}.jpg`
}

function BiblePlansTab() {
  const [plans, setPlans] = useState<BiblePlanRow[]>([])
  const [readers, setReaders] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [open, setOpen] = useState<BiblePlanRow | null>(null)

  const load = () =>
    Promise.all([listBiblePlans(), countReadersByPlan().catch(() => new Map<string, number>())]).then(([p, r]) => {
      setPlans(p)
      setReaders(r)
      setLoading(false)
    })
  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!title.trim()) return
    setCreating(true)
    try {
      await createBiblePlan({ title, description, duration_days: duration, start_date: startDate })
      setTitle('')
      setDescription('')
      setShowNew(false)
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (plan: BiblePlanRow) => {
    // Only one plan should be the "today's reading" source at a time.
    await Promise.all(plans.filter((p) => p.is_active && p.id !== plan.id).map((p) => setActiveBiblePlan(p.id, false)))
    await setActiveBiblePlan(plan.id, !plan.is_active)
    haptics.tap()
    load()
  }

  if (open) return <BiblePlanReadings plan={open} onBack={() => setOpen(null)} />

  return (
    <div>
      {loading && muted('Loading…')}
      {!loading && plans.length === 0 && <div style={{ marginBottom: 12 }}>{muted('No reading plans yet. Create the first one below.')}</div>}
      {plans.map((p, i) => {
        const n = readers.get(p.id) ?? 0
        return (
          <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '16px 18px', marginBottom: 10, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: `url(${planScene(p.title, i)}) center/cover`, flexShrink: 0 }} />
            <span style={{ flex: '1 1 180px', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{p.title}</span>
              <span style={{ display: 'block', fontSize: 13, color: dim }}>
                {p.duration_days} days · {n} {n === 1 ? 'child' : 'children'} reading
              </span>
            </span>
            <button type="button" onClick={() => setOpen(p)} style={smallBtn}>
              Readings
            </button>
            <button
              type="button"
              title={p.is_active ? 'Hide this plan from the children' : 'Make this today’s reading plan'}
              onClick={() => toggle(p)}
              style={{ padding: '7px 14px', borderRadius: 999, border: 'none', background: p.is_active ? 'rgba(47,201,160,.16)' : 'rgba(255,255,255,.08)', color: p.is_active ? '#5cf0c8' : 'rgba(220,230,255,.6)', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {p.is_active ? 'LIVE' : 'HIDDEN'}
            </button>
          </div>
        )
      })}

      {showNew ? (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <h3 style={h3}>New reading plan</h3>
          <input className="ap-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Heroes of Faith" />
          <input className="ap-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: dim }}>
              Days
              <input className="ap-field" style={{ marginTop: 6 }} type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 800, color: dim }}>
              Starts
              <input className="ap-field" style={{ marginTop: 6 }} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={create} disabled={creating} style={blueBtn}>
              {creating ? 'Creating…' : 'Create plan'}
            </button>
            <button type="button" onClick={() => setShowNew(false)} style={{ ...smallBtn, padding: '0 14px' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowNew(true)} style={{ width: '100%', marginTop: 4, padding: 18, borderRadius: 20, border: '1px dashed rgba(255,255,255,.25)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
          + New reading plan
        </button>
      )}
    </div>
  )
}

function BiblePlanReadings({ plan, onBack }: { plan: BiblePlanRow; onBack: () => void }) {
  const [readings, setReadings] = useState<BibleReadingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dayNumber, setDayNumber] = useState(1)
  const [title, setTitle] = useState('')
  const [reference, setReference] = useState('')
  const [passage, setPassage] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(
    () =>
      listPlanReadings(plan.id).then((r) => {
        setReadings(r)
        setDayNumber(r.reduce((m, x) => Math.max(m, x.day_number), 0) + 1)
        setLoading(false)
      }),
    [plan.id],
  )
  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    if (!title.trim() || !reference.trim()) return
    setAdding(true)
    try {
      await addBibleReading({ plan_id: plan.id, day_number: dayNumber, title, reference, passage_text: passage || undefined })
      setTitle('')
      setReference('')
      setPassage('')
      playClick()
      haptics.success()
      load()
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 0, border: 'none', background: 'none', color: dim, fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> All plans
      </button>
      <p style={{ margin: '12px 0 16px', fontFamily: display, fontWeight: 800, fontSize: 26, color: '#fff' }}>{plan.title}</p>

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={h3}>Add a reading</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: 10 }}>
          <input className="ap-field" type="number" min={1} value={dayNumber} onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)} aria-label="Day" />
          <input className="ap-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        </div>
        <input className="ap-field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference, e.g. John 3:16-21" />
        <textarea className="ap-field" value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Passage text or notes (optional)" rows={3} />
        <div>
          <button type="button" onClick={add} disabled={adding} style={blueBtn}>
            {adding ? 'Adding…' : 'Add reading'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading && muted('Loading…')}
        {!loading && readings.length === 0 && muted('No readings added yet.')}
        {readings.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', marginBottom: 8, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ flexShrink: 0, width: 44, textAlign: 'center', padding: '5px 0', borderRadius: 10, background: 'rgba(111,155,255,.16)' }}>
              <span style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#9db8ff' }}>DAY</span>
              <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 18, color: '#fff' }}>{r.day_number}</span>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{r.title}</span>
              <span style={{ display: 'block', fontSize: 13, color: dim }}>{r.reference}</span>
            </span>
            <a href={bibleComUrl(r.reference)} target="_blank" rel="noopener noreferrer" style={{ ...smallBtn, display: 'inline-block' }}>
              Bible.com ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Ministry Calendar ----------

const EVENT_COLS = ['#ff4fa3', '#2fc9a0', '#c13bff', '#ffd84d', '#6f9bff']

/**
 * The one shared ministry-wide events calendar (Children's Day, camps,
 * Christmas party, memory verse challenges, ...) - admin edits it here;
 * teachers and kids only ever see a read-only view of the same table.
 */
function MinistryCalendarTab() {
  const [events, setEvents] = useState<MinistryEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<MinistryEventRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    listMinistryEvents()
      .then((e) => {
        setEvents(e)
        setLoading(false)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Could not load the calendar.')
        setLoading(false)
      })
  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setEventDate(new Date().toISOString().slice(0, 10))
    setDescription('')
  }

  const startEdit = (event: MinistryEventRow) => {
    setEditing(event)
    setTitle(event.title)
    setEventDate(event.event_date)
    setDescription(event.description ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    if (!title.trim()) return setError('Give the event a name.')
    setSaving(true)
    setError('')
    try {
      if (editing) await updateMinistryEvent(editing.id, { title, event_date: eventDate, description })
      else await createMinistryEvent({ title, event_date: eventDate, description })
      playClick()
      haptics.success()
      resetForm()
      load()
    } catch (e) {
      // A refused write (not an admin any more, offline, a dropped request)
      // must say so rather than spring back with nothing saved.
      haptics.error()
      setError(e instanceof Error ? e.message : 'Could not save the event.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      await deleteMinistryEvent(id)
      haptics.tap()
      load()
    } catch (e) {
      haptics.error()
      setError(e instanceof Error ? e.message : 'Could not delete the event.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="ap-field" style={{ flex: '1 1 220px', width: 'auto', fontSize: 14 }} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder={editing ? 'Event title' : 'New event title'} />
        <input className="ap-field" style={{ flex: '0 1 170px', width: 'auto', fontSize: 14 }} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} aria-label="Date" />
        <button type="button" onClick={save} disabled={saving} style={blueBtn}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add event'}
        </button>
        {editing && (
          <button type="button" onClick={resetForm} style={{ ...smallBtn, padding: '0 14px' }}>
            Cancel
          </button>
        )}
      </div>
      <textarea className="ap-field" style={{ marginTop: 8, fontSize: 14 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details (optional)" rows={2} />
      {error && <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
      <p style={{ margin: '8px 0 14px', fontSize: 12, color: dim }}>Everything here shows on the Teacher Portal calendar, the parents' calendar and the children's Calendar app.</p>

      {loading && muted('Loading…')}
      {!loading && events.length === 0 && muted("Nothing on the calendar yet. Add the next Children's Day, camp or party above and the whole ministry sees it.")}
      {events.map((e, i) => {
        const col = EVENT_COLS[i % EVENT_COLS.length]
        const [y, m, d] = e.event_date.split('-').map(Number)
        return (
          <div key={e.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px', padding: '14px 18px', marginBottom: 8, borderRadius: 18, background: editing?.id === e.id ? 'rgba(111,155,255,.12)' : 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', animation: 'ap-up .3s both' }}>
            <span style={{ flexShrink: 0, width: 52, textAlign: 'center', padding: '6px 0', borderRadius: 12, background: `${col}26` }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: col }}>{MON[m - 1]}</span>
              <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 22, color: '#fff' }}>{d}</span>
            </span>
            <span style={{ flex: '1 1 160px', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{e.title}</span>
              <span style={{ display: 'block', fontSize: 13, color: dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {y !== new Date().getFullYear() ? `${y}` : ''}
                {y !== new Date().getFullYear() && e.description ? ' · ' : ''}
                {e.description}
              </span>
            </span>
            <span style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => startEdit(e)} style={smallBtn}>
                Edit
              </button>
              <button type="button" onClick={() => remove(e.id)} aria-label={`Delete ${e.title}`} style={{ ...smallBtn, borderColor: 'rgba(255,107,128,.45)', color: '#ff8a96' }}>
                <Trash2 style={{ width: 14, height: 14, display: 'block' }} />
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Digital Bank ----------

const BANK_KIND: Record<DigitalBankFile['category'], [LucideIcon, string, string]> = {
  song: [Music, '#c13bff', 'Audio'],
  video: [Clapperboard, '#ff4fa3', 'Video'],
  doc: [FileText, '#ffd84d', 'Document'],
  note: [FileText, '#2fc9a0', 'Note'],
  other: [FileIcon, '#6f9bff', 'File'],
}

function guessBankCategory(mimeType: string): DigitalBankFile['category'] {
  if (mimeType.startsWith('audio/')) return 'song'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  return 'other'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type BankFilter = 'all' | 'song' | 'video' | 'doc' | 'other'

/**
 * Any file related to the ministry that doesn't belong in a question set or
 * a Bible reading plan - songs, videos, docs, whatever. Stored locally in
 * this browser's IndexedDB for now (not Supabase Storage), so it works
 * offline like the rest of the quiz but doesn't sync across devices yet.
 */
function DigitalBankTab() {
  const [files, setFiles] = useState<DigitalBankFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<BankFilter>('all')

  const load = () =>
    db.digitalBankFiles
      .orderBy('uploadedAt')
      .reverse()
      .toArray()
      .then((rows) => {
        setFiles(rows)
        setLoading(false)
      })
  useEffect(() => {
    load()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files
    if (!picked || picked.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(picked)) {
        await db.digitalBankFiles.add({
          name: file.name,
          category: guessBankCategory(file.type),
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          blob: file,
          uploadedAt: Date.now(),
        })
      }
      playClick()
      haptics.success()
      load()
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file? This only removes it from this device/browser.')) return
    await db.digitalBankFiles.delete(id)
    haptics.tap()
    load()
  }

  const visible = filter === 'all' ? files : files.filter((f) => (filter === 'doc' ? f.category === 'doc' || f.category === 'note' : f.category === filter))
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div>
      <Chips<BankFilter> value={filter} onChange={setFilter} items={[['all', 'All'], ['song', 'Songs'], ['video', 'Videos'], ['doc', 'Documents'], ['other', 'Other']]} />
      {loading && muted('Loading…')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,200px),1fr))', gap: 12 }}>
        {visible.map((f) => {
          const [Icon, col, kind] = BANK_KIND[f.category]
          const download = () => {
            if (!f.blob) return
            const url = URL.createObjectURL(f.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = f.name
            a.click()
            URL.revokeObjectURL(url)
          }
          return (
            <div key={f.id} style={{ padding: 18, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: `${col}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 20, height: 20, color: col }} />
              </span>
              <p style={{ margin: '12px 0 0', fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{f.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(220,230,255,.5)' }}>
                {kind} · {formatBytes(f.size)}
              </p>
              <span style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 6 }}>
                <button type="button" onClick={download} aria-label={`Download ${f.name}`} style={smallBtn}>
                  <Download style={{ width: 14, height: 14, display: 'block' }} />
                </button>
                <button type="button" onClick={() => handleDelete(f.id!)} aria-label={`Delete ${f.name}`} style={{ ...smallBtn, borderColor: 'rgba(255,107,128,.45)', color: '#ff8a96' }}>
                  <Trash2 style={{ width: 14, height: 14, display: 'block' }} />
                </button>
              </span>
            </div>
          )
        })}
        <label style={{ minHeight: 120, padding: 18, borderRadius: 20, border: '1px dashed rgba(255,255,255,.25)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {uploading ? 'Uploading…' : '+ Upload'}
          <input type="file" multiple style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      <p style={{ margin: '14px 0 0', fontSize: 12, color: dim }}>
        {files.length} {files.length === 1 ? 'file' : 'files'} · {formatBytes(totalSize)}. Kept on this device for now, not shared across devices yet.
      </p>
    </div>
  )
}

// ---------- Admins ----------

function AdminsTab() {
  const [people, setPeople] = useState<Array<{ id: string; full_name: string; role: string | null }>>([])
  const [emails, setEmails] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const load = () =>
    Promise.all([listAllTeachers(), listTeacherApplications().catch(() => [] as TeacherApplication[])])
      .then(([p, apps]) => {
        // Admins first, then teachers, each by name.
        setPeople([...p].sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin') || (a.full_name || '').localeCompare(b.full_name || '')))
        setEmails(new Map(apps.map((a) => [a.user_id, a.email])))
      })
      .finally(() => setLoading(false))
  useEffect(() => {
    load()
  }, [])

  const promote = async (id: string, name: string) => {
    if (!confirm(`Give ${name || 'this person'} full admin access?`)) return
    try {
      await promoteToAdmin(id)
      haptics.success()
      setNote({ ok: true, text: `${name || 'They'} can now open the Admin Portal.` })
      load()
    } catch (e) {
      haptics.error()
      setNote({ ok: false, text: e instanceof Error ? e.message : 'Could not promote them.' })
    }
  }

  // Admin access can only go to someone who already has a teacher account,
  // so "invite" finds that teacher by the email they applied with.
  const promoteByEmail = () => {
    const wanted = email.trim().toLowerCase()
    if (!wanted.includes('@')) return setNote({ ok: false, text: 'Type the email they applied to teach with.' })
    const id = Array.from(emails).find(([, e]) => e.toLowerCase() === wanted)?.[0]
    const person = people.find((p) => p.id === id)
    if (!person) return setNote({ ok: false, text: 'No teacher has applied with that email. They need to sign up and apply to teach first.' })
    if (person.role === 'admin') return setNote({ ok: true, text: `${person.full_name} is already an admin.` })
    setEmail('')
    promote(person.id, person.full_name)
  }

  return (
    <div>
      {loading && muted('Loading…')}
      {people.map((p, i) => {
        const admin = p.role === 'admin'
        return (
          <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '14px 18px', marginBottom: 8, borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: AV[(i + 3) % AV.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>{initial(p.full_name)}</span>
            <span style={{ flex: '1 1 160px', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, color: '#fff' }}>{p.full_name || 'Unnamed'}</span>
              <span style={{ display: 'block', fontSize: 13, color: dim, overflowWrap: 'anywhere' }}>{emails.get(p.id) ?? 'No application email on file'}</span>
            </span>
            {admin ? (
              <span style={pill('rgba(111,155,255,.16)', '#9db8ff')}>Admin</span>
            ) : (
              <>
                <span style={pill('rgba(255,255,255,.08)', 'rgba(220,230,255,.7)')}>Teacher</span>
                <button type="button" onClick={() => promote(p.id, p.full_name)} style={smallBtn}>
                  Make admin
                </button>
              </>
            )}
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <input className="ap-field" style={{ flex: '1 1 240px', width: 'auto', fontSize: 14 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && promoteByEmail()} placeholder="Email of a teacher to make admin" />
        <button type="button" onClick={promoteByEmail} style={blueBtn}>
          Make admin
        </button>
      </div>
      {note && <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 700, color: note.ok ? '#5cf0c8' : '#ff8a96' }}>{note.text}</p>}
      <p style={{ margin: '10px 0 0', fontSize: 12, color: dim }}>Admin access is powerful. Only add people you fully trust.</p>
    </div>
  )
}

// ---------- Safety & Privacy ----------

const SAFETY_GUARANTEES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Lock, title: 'No public profiles, no random messaging', body: 'Children never appear on a public leaderboard, and cannot message each other directly - only their own assigned teacher.' },
  { icon: Eye, title: 'Role separation enforced at the database', body: 'Teachers see only their own class, admins see across the ministry - enforced by row-level security, not just hidden UI.' },
  { icon: ImageIcon, title: 'Photos are reviewed first', body: "A child's new profile picture stays hidden from everyone else until a teacher or admin approves it." },
  { icon: Heart, title: 'Ears for You hides identity for real', body: "An anonymous message's real sender is removed from the data itself before it reaches a teacher or admin, not just hidden on screen." },
  { icon: Users, title: 'Parents opt in - nothing auto-created', body: 'A parent account is never created without a parent explicitly signing up and linking with a code the child controls.' },
]

const EARS_LOOK: Record<EarsStatus, [string, string]> = {
  new: ['NEW', '#ff8a96'],
  acknowledged: ['SEEN', '#9db8ff'],
  in_progress: ['IN PROGRESS', '#ffd84d'],
  escalated: ['ESCALATED', '#ff6b80'],
  resolved: ['RESOLVED', '#5cf0c8'],
}

function SafetyTab() {
  const [ears, setEars] = useState<EarsMessageRow[]>([])
  const [classNames, setClassNames] = useState<Map<string, string>>(new Map())
  const [logs, setLogs] = useState<EarsAuditLogRow[]>([])
  const [buddyLog, setBuddyLog] = useState<AiCompanionTeacherLogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listEarsTeacherInbox().catch(() => []),
      listAllClassesWithTeacher().catch(() => []),
      listEarsAuditLog(50).catch(() => []),
      listBibleBuddyTeacherLog(50).catch(() => []),
    ])
      .then(([e, c, l, b]) => {
        setEars(e)
        setClassNames(new Map(c.map((x) => [x.id, x.name])))
        setLogs(l)
        setBuddyLog(b)
      })
      .finally(() => setLoading(false))
  }, [])

  // Open notes first, newest first within each.
  const earsShown = [...ears].sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved') || b.created_at.localeCompare(a.created_at)).slice(0, 8)
  const row: CSSProperties = { display: 'flex', gap: 12, padding: '11px 0', borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 14 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ padding: '8px 20px 12px', borderRadius: 22, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
          {SAFETY_GUARANTEES.map((g, i) => (
            <div key={g.title} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', padding: '14px 0', borderTop: i ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
              <g.icon style={{ flexShrink: 0, width: 18, height: 18, color: '#9db8ff' }} strokeWidth={2} />
              <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: '#fff' }}>{g.title}</span>
                <span style={{ display: 'block', fontSize: 13, color: dim, marginTop: 2 }}>{g.body}</span>
              </span>
              <span title="Built into the database. It cannot be switched off." style={pill('rgba(47,201,160,.16)', '#5cf0c8')}>
                ALWAYS ON
              </span>
            </div>
          ))}
          <Link to="/safety" target="_blank" style={{ display: 'inline-block', padding: '10px 0 2px', fontSize: 13, fontWeight: 800 }}>
            View the public Safety &amp; Privacy page ↗
          </Link>
        </div>

        <div style={card}>
          <h3 style={h3}>Ears for You overview</h3>
          {loading && muted('Loading…')}
          {!loading && earsShown.length === 0 && muted('No Ears for You notes yet.')}
          {earsShown.map((e) => {
            const [st, col] = EARS_LOOK[e.status]
            return (
              <div key={e.id} style={row}>
                <span style={{ flexShrink: 0, height: 'fit-content', padding: '3px 9px', borderRadius: 999, background: `${col}22`, color: col, fontSize: 11, fontWeight: 800 }}>{st}</span>
                <span style={{ flex: 1, minWidth: 0, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.body}</span>
                <span style={{ flexShrink: 0, fontSize: 12, color: 'rgba(220,230,255,.45)' }}>{classNames.get(e.class_id) ?? ''}</span>
              </div>
            )
          })}
          {ears.length > earsShown.length && <p style={{ margin: '8px 0 0', fontSize: 12, color: dim }}>Showing {earsShown.length} of {ears.length}. Each class teacher answers their own notes.</p>}
        </div>
      </div>

      <div style={card}>
        <h3 style={h3}>Ears for You audit trail</h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: dim }}>Every acknowledge, reply and escalation on a safeguarding message, with the time it happened.</p>
        {!loading && logs.length === 0 && muted('No activity logged yet.')}
        {logs.map((log) => (
          <div key={log.id} style={{ ...row, justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{log.action.replace(/_/g, ' ')}</span>
            <span style={{ flexShrink: 0, fontSize: 12, color: dim }}>{new Date(log.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={h3}>Bible Buddy audit trail</h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: dim }}>Every question asked across the ministry, for safeguarding review. Anonymous ones never reveal who sent them.</p>
        {!loading && buddyLog.length === 0 && muted('No questions logged yet.')}
        {buddyLog.map((m) => (
          <div key={m.id} style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: dim }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                {m.is_anonymous && <EyeOff style={{ width: 12, height: 12 }} />}
                {m.is_anonymous ? 'Anonymous' : m.student_name || 'A child'}
              </span>
              <span>{new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            <p style={{ margin: '6px 0 0', fontWeight: 800, color: '#fff' }}>{m.question}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14 }}>{m.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
