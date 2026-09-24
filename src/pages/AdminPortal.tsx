import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  School,
  CalendarRange,
  CalendarDays,
  Users,
  Check,
  X,
  BookOpen,
  ArrowLeft,
  Gamepad2,
  Trophy,
  Database,
  Music,
  Video,
  File as FileIcon,
  Trash2,
  Download,
  Upload,
  Lock,
  Eye,
  EyeOff,
  Heart,
  type LucideIcon,
} from 'lucide-react'
import { signOut } from '../lib/supabase'
import { bibleComUrl } from '../lib/bibleLink'
import { db } from '../db/db'
import type { DigitalBankFile } from '../db/types'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import TabBar from '../components/ui/TabBar'
import AvatarReviewQueue from '../components/AvatarReviewQueue'
import PortalSearch from '../components/PortalSearch'
import {
  listTeacherApplications,
  approveTeacher,
  listAllClassesWithTeacher,
  listSeasons,
  createSeasonServer,
  setActiveSeasonServer,
  listAllTeachers,
  promoteToAdmin,
  listBiblePlans,
  createBiblePlan,
  setActiveBiblePlan,
  listPlanReadings,
  addBibleReading,
  getLeaderboard,
  aggregateClassLeaderboard,
  listMinistryEvents,
  createMinistryEvent,
  updateMinistryEvent,
  deleteMinistryEvent,
  listEarsAuditLog,
  listBibleBuddyTeacherLog,
  type EarsAuditLogRow,
  type AiCompanionTeacherLogRow,
  type TeacherApplication,
  type ClassRow,
  type SeasonRow,
  type MinistryEventRow,
  type BiblePlanRow,
  type BibleReadingRow,
  type LeaderboardRow,
  type SearchResult,
} from '../lib/ministry'
import { DataList, DataRow, DataIdentity, DataActions, DataBadge } from '../components/ui/DataList'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function AdminPortal() {
  const { session, profile, loading, refreshProfile } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session) {
    return (
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
    )
  }
  if (profile?.role !== 'admin') return <NotAuthorized onRecheck={refreshProfile} />
  return <AdminDashboard />
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

type Tab = 'applications' | 'classes' | 'seasons' | 'quiz' | 'bible' | 'calendar' | 'admins' | 'digitalbank' | 'safety'

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('applications')
  // The class a search result pointed at, so the list can say which row was
  // meant. An admin here has eleven classes and rising; landing on a list of
  // them with nothing marked is barely better than not searching.
  const [highlightClass, setHighlightClass] = useState<string | null>(null)

  const goToResult = (r: SearchResult) => {
    if (r.kind === 'teacher') {
      setHighlightClass(null)
      setTab('applications')
      return
    }
    setHighlightClass(r.kind === 'class' ? r.id : r.class_id)
    setTab('classes')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="font-display text-2xl font-extrabold">Control Centre</h1>
        </div>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      {/* Above the tabs, and it draws nothing unless something is waiting.
          An admin is the only one who can clear a picture from a child who
          has not been put in a class yet, since no teacher can reach them. */}
      <AvatarReviewQueue />

      <PortalSearch placeholder="Find a child, a class, a teacher…" onPick={goToResult} />

      <TabBar
        value={tab}
        onChange={setTab}
        items={[
          { value: 'applications', label: 'Teacher Applications', icon: FileText },
          { value: 'classes', label: 'All Classes', icon: School },
          { value: 'seasons', label: 'Seasons', icon: CalendarRange },
          { value: 'quiz', label: 'Quiz', icon: Gamepad2 },
          { value: 'bible', label: 'Bible Plans', icon: BookOpen },
          { value: 'calendar', label: 'Ministry Calendar', icon: CalendarDays },
          { value: 'digitalbank', label: 'Digital Bank', icon: Database },
          { value: 'admins', label: 'Admins', icon: Users },
          { value: 'safety', label: 'Safety & Privacy', icon: ShieldCheck },
        ]}
      />

      {tab === 'applications' && <ApplicationsTab />}
      {tab === 'classes' && <ClassesTab highlightId={highlightClass} />}
      {tab === 'seasons' && <SeasonsTab />}
      {tab === 'quiz' && <QuizTab />}
      {tab === 'bible' && <BiblePlansTab />}
      {tab === 'calendar' && <MinistryCalendarTab />}
      {tab === 'digitalbank' && <DigitalBankTab />}
      {tab === 'admins' && <AdminsTab />}
      {tab === 'safety' && <SafetyTab />}
    </div>
  )
}

function QuizTab() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<'students' | 'classes'>('students')

  useEffect(() => {
    // High enough to be "everyone" for any realistic church - the class
    // totals below would silently undercount if this were capped low.
    getLeaderboard(1000)
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const classRows = useMemo(() => aggregateClassLeaderboard(rows), [rows])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <QuizLink to="/questions" icon={BookOpen} title="Question Bank" description="Oversee every trivia question and set across the ministry." />
        <QuizLink to="/history" icon={Trophy} title="History" description="Every completed match, team score, and full recap." />
      </div>
      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Ministry Leaderboard</p>
          <div className="flex gap-1.5">
            {(['students', 'classes'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBoard(b)}
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition"
                style={{
                  background: board === b ? 'var(--gold)' : 'var(--ink-panel)',
                  color: board === b ? '#000' : 'var(--ink-muted)',
                }}
              >
                {b === 'students' ? 'Students' : 'Class vs Class'}
              </button>
            ))}
          </div>
        </div>
        {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No quiz results recorded yet.</p>}
        <div className="space-y-1.5">
          {board === 'students'
            ? rows.slice(0, 20).map((r, i) => (
                <div key={r.student_id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm odd:bg-[var(--ink-panel)]">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-6 shrink-0 font-bold text-[var(--ink-muted)]">{i + 1}</span>
                    <span className="truncate font-semibold">{r.full_name}</span>
                    {r.class_name && <span className="shrink-0 text-xs text-[var(--ink-faint)]">· {r.class_name}</span>}
                  </span>
                  <span className="shrink-0 font-bold text-[var(--gold)]">{r.total_points.toLocaleString()} pts</span>
                </div>
              ))
            : classRows.map((c, i) => (
                <div key={c.class_id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm odd:bg-[var(--ink-panel)]">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-6 shrink-0 font-bold text-[var(--ink-muted)]">{i + 1}</span>
                    <span className="truncate font-semibold">{c.class_name}</span>
                    <span className="shrink-0 text-xs text-[var(--ink-faint)]">· {c.student_count} students</span>
                  </span>
                  <span className="shrink-0 font-bold text-[var(--gold)]">{c.total_points.toLocaleString()} pts</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}

function QuizLink({ to, icon: Icon, title, description }: { to: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Link to={to} onClick={() => playClick()} className="panel panel-interactive flex flex-col gap-2 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="text-sm text-[var(--ink-muted)]">{description}</p>
    </Link>
  )
}

const BANK_CATEGORY_ICON: Record<DigitalBankFile['category'], LucideIcon> = {
  song: Music,
  video: Video,
  doc: FileText,
  other: FileIcon,
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
  const [filter, setFilter] = useState<'all' | DigitalBankFile['category']>('all')

  const load = () => db.digitalBankFiles.orderBy('uploadedAt').reverse().toArray().then((rows) => { setFiles(rows); setLoading(false) })
  useEffect(() => { load() }, [])

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

  const visible = filter === 'all' ? files : files.filter((f) => f.category === filter)
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="eyebrow">Upload a File</p>
        <p className="text-xs text-[var(--ink-muted)]">
          Songs, videos, docs, anything related to the ministry. Stored locally on this device or browser for now, not shared across devices yet.
        </p>
        <label className="btn-solid inline-flex w-fit cursor-pointer items-center gap-2 px-4 py-2 text-sm">
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Choose Files'}
          <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'song', 'video', 'doc', 'other'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                filter === c ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'bg-[var(--ink-panel)] text-[var(--ink-muted)] hover:bg-[var(--ink-raised)]'
              }`}
            >
              {c === 'song' ? 'Songs' : c === 'video' ? 'Videos' : c === 'doc' ? 'Docs' : c === 'other' ? 'Other' : 'All'}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--ink-faint)]">
          {files.length} file{files.length === 1 ? '' : 's'} · {formatBytes(totalSize)} on this device
        </span>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="space-y-2">
        {!loading && visible.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No files here yet.</p>}
        {visible.map((f) => {
          const Icon = BANK_CATEGORY_ICON[f.category]
          const download = () => {
            const url = URL.createObjectURL(f.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = f.name
            a.click()
            URL.revokeObjectURL(url)
          }
          return (
            <div key={f.id} className="panel flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{f.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {formatBytes(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={download} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => handleDelete(f.id!)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-700 transition hover:scale-105 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ApplicationsTab() {
  const [apps, setApps] = useState<TeacherApplication[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listTeacherApplications(filter === 'all' ? undefined : filter)
      .then(setApps)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handle = async (id: string, approve: boolean) => {
    await approveTeacher(id, approve)
    playClick()
    haptics.success()
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md border border-[var(--hairline-strong)] p-1 w-fit">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1.5 text-xs font-bold capitalize transition ${filter === f ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-[var(--fg)]/60 hover:text-[var(--fg)]'}`}
          >
            {f}
          </button>
        ))}
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && (
        <DataList count={apps.length} empty="Nothing here." head={<span className="flex-1">Applicant</span>}>
          {apps.map((a) => (
            <DataRow key={a.id}>
              <DataIdentity title={a.full_name} subtitle={`${a.email}${a.phone ? ` · ${a.phone}` : ''}`} />
              <DataBadge tone={a.status === 'approved' ? 'good' : a.status === 'rejected' ? 'bad' : 'wait'}>{a.status}</DataBadge>
              {a.message && <p className="w-full whitespace-pre-wrap text-sm text-[var(--fg)]/80">{a.message}</p>}
              {a.status === 'pending' && (
                <DataActions>
                  <button onClick={() => handle(a.id, true)} className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/25">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => handle(a.id, false)} className="flex items-center gap-1.5 rounded-md bg-red-500/15 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-500/25">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </DataActions>
              )}
            </DataRow>
          ))}
        </DataList>
      )}
    </div>
  )
}

function ClassesTab({ highlightId }: { highlightId?: string | null }) {
  const [classes, setClasses] = useState<(ClassRow & { teacher_name: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllClassesWithTeacher().then(setClasses).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
  return (
    <DataList
      count={classes.length}
      empty="No classes created yet."
      head={<span className="flex-1">Class</span>}
    >
      {classes.map((c) => (
        <DataRow
          key={c.id}
          highlight={c.id === highlightId}
          innerRef={c.id === highlightId ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined}
        >
          <DataIdentity title={c.name} subtitle={`Taught by ${c.teacher_name || 'Unknown'}`} />
          <span className="shrink-0 rounded border border-[var(--hairline-strong)] px-2.5 py-1 font-mono text-xs">{c.join_code}</span>
          {c.archived && <span className="shrink-0 rounded bg-[var(--fg)]/10 px-2.5 py-1 text-xs">Archived</span>}
        </DataRow>
      ))}
    </DataList>
  )
}

function SeasonsTab() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => listSeasons().then(setSeasons).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return
    await createSeasonServer(name)
    setName('')
    playClick()
    load()
  }

  const activate = async (id: string) => {
    await setActiveSeasonServer(id)
    haptics.tap()
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "Season 1: 2026"'
          className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 outline-none focus:border-[var(--gold)]"
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} className="btn-solid text-sm">
          Create
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="space-y-2">
        {seasons.map((s) => (
          <div key={s.id} className={`panel flex items-center justify-between px-4 py-3 ${s.is_active ? 'border-[var(--gold)]/40' : ''}`}>
            <p className="font-semibold">
              {s.name} {s.is_active && <span className="ml-1 text-xs font-bold uppercase text-[var(--gold)]">● Active</span>}
            </p>
            {!s.is_active && (
              <button onClick={() => activate(s.id)} className="btn-outline px-3 py-1.5 text-xs">
                Make active
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

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

  const load = () => listMinistryEvents().then((e) => { setEvents(e); setLoading(false) })
  useEffect(() => { load() }, [])

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
  }

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateMinistryEvent(editing.id, { title, event_date: eventDate, description })
      } else {
        await createMinistryEvent({ title, event_date: eventDate, description })
      }
      playClick()
      haptics.success()
      resetForm()
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await deleteMinistryEvent(id)
    haptics.tap()
    load()
  }

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="eyebrow">{editing ? 'Edit Event' : 'New Event'}</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Children's Day"
          className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 outline-none focus:border-[var(--gold)]"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 outline-none focus:border-[var(--gold)]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details (optional)"
          rows={2}
          className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 outline-none focus:border-[var(--gold)]"
        />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-solid text-sm">
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Event'}
          </button>
          {editing && (
            <button onClick={resetForm} className="btn-outline text-sm">
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && events.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No events on the calendar yet.</p>}
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="panel flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="font-semibold">{event.title}</p>
              {event.description && <p className="mt-1 text-sm text-[var(--ink-muted)]">{event.description}</p>}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button onClick={() => startEdit(event)} className="btn-outline px-3 py-1.5 text-xs">
                Edit
              </button>
              <button onClick={() => remove(event.id)} className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-500/25">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BiblePlansTab() {
  const [plans, setPlans] = useState<BiblePlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<BiblePlanRow | null>(null)

  const load = () => listBiblePlans().then((p) => { setPlans(p); setLoading(false) })
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!title.trim()) return
    setCreating(true)
    try {
      await createBiblePlan({ title, description, duration_days: duration, start_date: startDate })
      setTitle('')
      setDescription('')
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  const activate = async (plan: BiblePlanRow) => {
    // Only one plan should be the "today's reading" source at a time.
    await Promise.all(plans.filter((p) => p.is_active && p.id !== plan.id).map((p) => setActiveBiblePlan(p.id, false)))
    await setActiveBiblePlan(plan.id, !plan.is_active)
    haptics.tap()
    load()
  }

  if (open) return <BiblePlanReadings plan={open} onBack={() => setOpen(null)} />

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="eyebrow">New Reading Plan</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Advent 2026" className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} placeholder="Duration (days)" className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
        </div>
        <button onClick={create} disabled={creating} className="btn-solid text-sm">
          {creating ? 'Creating…' : 'Create Plan'}
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && plans.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No reading plans yet.</p>}
      <div className="space-y-2">
        {plans.map((p) => (
          <div key={p.id} className={`panel p-4 ${p.is_active ? 'border-[var(--gold)]/40' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  {p.title} {p.is_active && <span className="ml-1 text-xs font-bold uppercase text-[var(--gold)]">● Active</span>}
                </p>
                <p className="text-xs text-[var(--ink-faint)]">
                  {p.duration_days} days, starting {new Date(p.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => activate(p)} className="btn-outline px-3 py-1.5 text-xs">
                {p.is_active ? 'Deactivate' : 'Make Active'}
              </button>
              <button onClick={() => setOpen(p)} className="btn-outline px-3 py-1.5 text-xs">
                Manage Readings
              </button>
            </div>
          </div>
        ))}
      </div>
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

  const load = () => listPlanReadings(plan.id).then((r) => { setReadings(r); setLoading(false) })
  useEffect(() => { load() }, [plan.id])

  const add = async () => {
    if (!title.trim() || !reference.trim()) return
    setAdding(true)
    try {
      await addBibleReading({ plan_id: plan.id, day_number: dayNumber, title, reference, passage_text: passage || undefined })
      setDayNumber((d) => d + 1)
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
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--fg)]">
        <ArrowLeft className="h-4 w-4" /> Back to plans
      </button>
      <h3 className="font-display text-lg font-bold">{plan.title}</h3>

      <div className="panel space-y-3 p-5">
        <p className="eyebrow">Add a Reading</p>
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <input type="number" min={1} value={dayNumber} onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)} placeholder="Day" className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--gold)]" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
        </div>
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference, e.g. John 3:16-21" className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
        <textarea value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Passage text or notes (optional)" rows={3} className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--gold)]" />
        <button onClick={add} disabled={adding} className="btn-solid text-sm">
          {adding ? 'Adding…' : 'Add Reading'}
        </button>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="space-y-2">
        {readings.map((r) => (
          <div key={r.id} className="panel flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-bold">Day {r.day_number}: {r.title}</p>
              <p className="text-xs text-[var(--ink-faint)]">{r.reference}</p>
            </div>
            <a
              href={bibleComUrl(r.reference)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline shrink-0 px-3 py-1.5 text-xs"
            >
              Bible.com ↗
            </a>
          </div>
        ))}
        {!loading && readings.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No readings added yet.</p>}
      </div>
    </div>
  )
}

function AdminsTab() {
  const [people, setPeople] = useState<Array<{ id: string; full_name: string; role: string | null }>>([])
  const [loading, setLoading] = useState(true)

  const load = () => listAllTeachers().then(setPeople).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const promote = async (id: string) => {
    if (!confirm('Give this person full admin access?')) return
    await promoteToAdmin(id)
    haptics.success()
    load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ink-muted)]">Promote a teacher to admin. Admin access is powerful, only add people you fully trust.</p>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="space-y-2">
        {people.map((p) => (
          <div key={p.id} className="panel flex items-center justify-between px-4 py-3">
            <p className="font-semibold">
              {p.full_name || 'Unnamed'} <span className="text-xs text-[var(--ink-faint)]">· {p.role}</span>
            </p>
            {p.role !== 'admin' && (
              <button onClick={() => promote(p.id)} className="btn-outline px-3 py-1.5 text-xs">
                Make admin
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const SAFETY_GUARANTEES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Lock, title: 'No public profiles, no random messaging', body: 'Children never appear on a public leaderboard, and cannot message each other directly - only their own assigned teacher.' },
  { icon: Eye, title: 'Role separation enforced at the database', body: 'Teachers see only their own class, admins see across the ministry - enforced by row-level security, not just hidden UI.' },
  { icon: Heart, title: 'Ears for You hides identity for real', body: "An anonymous message's real sender is removed from the data itself before it reaches a teacher or admin, not just hidden on screen." },
  { icon: Users, title: 'Parents opt in - nothing auto-created', body: 'A parent account is never created without a parent explicitly signing up and linking with a code the child controls.' },
]

function SafetyTab() {
  const [logs, setLogs] = useState<EarsAuditLogRow[]>([])
  const [buddyLog, setBuddyLog] = useState<AiCompanionTeacherLogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listEarsAuditLog(50), listBibleBuddyTeacherLog(50)])
      .then(([l, b]) => {
        setLogs(l)
        setBuddyLog(b)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-3">What's Actually True</p>
        <div className="space-y-2">
          {SAFETY_GUARANTEES.map((g) => (
            <div key={g.title} className="panel flex gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
                <g.icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-bold">{g.title}</p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{g.body}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/safety" target="_blank" className="mt-3 inline-block text-sm font-bold text-[var(--gold)] underline">
          View the public Safety &amp; Privacy page ↗
        </Link>
      </div>

      <div>
        <p className="eyebrow mb-3">Audit Trail - Ears for You</p>
        <p className="mb-2 text-xs text-[var(--ink-muted)]">Every acknowledge, reply, and escalation on a safeguarding message is recorded here with a timestamp.</p>
        {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
        {!loading && logs.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No activity logged yet.</p>}
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm odd:bg-[var(--ink-panel)]">
              <span className="font-semibold capitalize">{log.action.replace(/_/g, ' ')}</span>
              <span className="text-xs text-[var(--ink-faint)]">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Audit Trail - Bible Buddy</p>
        <p className="mb-2 text-xs text-[var(--ink-muted)]">Every question asked across the whole ministry, for safeguarding review. Anonymous ones never reveal who sent them.</p>
        {!loading && buddyLog.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No questions logged yet.</p>}
        <div className="space-y-2">
          {buddyLog.map((m) => (
            <div key={m.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
                  {m.is_anonymous && <EyeOff className="h-3 w-3" />}
                  {m.is_anonymous ? 'Anonymous' : m.student_name || 'A student'}
                </p>
                <p className="text-xs text-[var(--ink-faint)]">{new Date(m.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-1.5 text-sm font-bold">{m.question}</p>
              <p className="mt-1 text-sm text-[var(--fg)]/70">{m.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
