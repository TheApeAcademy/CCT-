import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  ClipboardList,
  Smartphone,
  HeartHandshake,
  Settings,
  ArrowLeft,
  Archive,
  Send,
  Check,
  X,
  User,
  KeyRound,
  BookOpen,
  FileText,
  Gamepad2,
  Trophy,
  LayoutDashboard,
  Users,
  Calendar,
  Lock,
  ClipboardCheck,
  Award,
  Sparkles,
  EyeOff,
  Copy,
  RotateCcw,
  History as HistoryIcon,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { supabase, signOut, type Profile } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import TabBar from '../components/ui/TabBar'
import IsometricPhone from '../components/IsometricPhone'
import { NotesSection, DigitalBankSection } from '../components/PersonalVault'
import { DataList, DataRow, DataIdentity, DataNum, DataActions } from '../components/ui/DataList'
import Sheet from '../components/ui/Sheet'
import MinistryCalendarReadOnly from '../components/MinistryCalendarView'
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
  type LectureRow,
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
  type EarsMessageRow,
  type EarsReplyRow,
  type EarsNoteRow,
  type EarsStatus,
  type LeaderboardRow,
} from '../lib/ministry'
import { fileToResizedDataUrl } from '../lib/image'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function TeacherPortal() {
  const { session, profile, loading, refreshProfile } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session) return <AuthCard icon={GraduationCap} title="Teacher Portal" subtitle="Sign in, or create an account and apply to teach." />
  if (profile?.role === 'teacher') return <TeacherDashboard profile={profile} />
  return <ApplicationGate onChange={refreshProfile} />
}

// ---------- application gate (between signup and approval) ----------

function ApplicationGate({ onChange }: { onChange: () => void }) {
  const [app, setApp] = useState<TeacherApplication | null | 'loading'>('loading')

  const load = () => getMyTeacherApplication().then(setApp)
  useEffect(() => {
    load()
  }, [])

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
      <button onClick={() => signOut()} className="btn-outline">
        Sign Out
      </button>
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

// ---------- main dashboard ----------

type Tab = 'home' | 'chat' | 'classes' | 'quiz' | 'ears' | 'buddy' | 'calendar' | 'profile'

function TeacherDashboard({ profile }: { profile: Profile | null }) {
  const [tab, setTab] = useState<Tab>('home')
  const [openClass, setOpenClass] = useState<ClassRow | null>(null)
  // Which tab of the class screen to land on. A search for a lesson should
  // open on Class Work, not drop the teacher on the roster to find it again.
  const [openClassTab, setOpenClassTab] = useState<DetailTab>('students')

  // A result is only worth showing if tapping it goes somewhere, so every
  // kind this portal can return is handled here. Everything the teacher can
  // find belongs to one of their classes, so all of it opens that class.
  const goToResult = async (r: SearchResult) => {
    if (!r.class_id) return
    const klass = (await listMyClasses()).find((c) => c.id === r.class_id)
    if (!klass) return
    setOpenClassTab(r.kind === 'assignment' || r.kind === 'lecture' ? 'work' : 'students')
    setOpenClass(klass)
    setTab('classes')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Teacher</p>
          <h1 className="font-display text-2xl font-extrabold">Portal</h1>
        </div>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      <PortalSearch placeholder="Find a child, a class, a lesson…" onPick={goToResult} />

      <TabBar
        value={tab}
        onChange={(t) => {
          setTab(t)
          setOpenClass(null)
        }}
        items={[
          { value: 'home', label: 'Home', icon: LayoutDashboard },
          { value: 'chat', label: 'Chat', icon: Smartphone },
          { value: 'classes', label: 'Classes', icon: GraduationCap },
          { value: 'quiz', label: 'Quiz', icon: Gamepad2 },
          { value: 'ears', label: 'Ears for You', icon: HeartHandshake },
          { value: 'buddy', label: 'Bible Buddy', icon: Sparkles },
          { value: 'calendar', label: 'Ministry Calendar', icon: Calendar },
          { value: 'profile', label: 'Profile', icon: Settings },
        ]}
      />

      {tab === 'home' && <TeacherHomeTab profile={profile} />}
      {tab === 'chat' && <TeacherChatTab profile={profile} />}
      {tab === 'classes' &&
        (openClass ? (
          <ClassDetail
            klass={openClass}
            teacherName={profile?.full_name ?? 'Your Teacher'}
            initialTab={openClassTab}
            onBack={() => setOpenClass(null)}
          />
        ) : (
          <ClassesTab
            onOpen={(c) => {
              setOpenClassTab('students')
              setOpenClass(c)
            }}
          />
        ))}
      {tab === 'quiz' && <QuizTab />}
      {tab === 'ears' && <EarsInboxTab />}
      {tab === 'buddy' && <BibleBuddyLogTab />}
      {tab === 'calendar' && <MinistryCalendarReadOnly />}
      {tab === 'profile' && <ProfileTab />}
    </div>
  )
}

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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <QuizLink to="/questions" icon={BookOpen} title="Question Bank" description="Build and manage your trivia questions and sets." />
        <QuizLink to="/setup" icon={Gamepad2} title="Host a Match" description="Run a live quiz-show match on the big screen." />
        <QuizLink to="/history" icon={Trophy} title="History" description="Every completed match, team score, and full recap." />
      </div>
      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Your Classes' Leaderboard</p>
          {classRows.length > 1 && (
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
          )}
        </div>
        {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No quiz results recorded yet for your students.</p>}
        <div className="space-y-1.5">
          {board === 'students' || classRows.length <= 1
            ? rows.map((r, i) => (
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

function ClassesTab({ onOpen }: { onOpen: (c: ClassRow) => void }) {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => listMyClasses().then(setClasses).finally(() => setLoading(false))
  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createClass(newName)
      setNewName('')
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder='New class name, e.g. "Sparklers (Ages 6-8)"'
          className={inputClass}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating} className="btn-solid shrink-0 text-sm">
          Create
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && classes.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No classes yet. Create your first one above.</p>}
      <div className="space-y-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => onOpen(c)} className="panel panel-interactive flex w-full items-center justify-between p-4 text-left">
            <div>
              <p className="font-bold">
                {c.name} {c.archived && <span className="text-xs text-[var(--ink-faint)]">(archived)</span>}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">Join code: {c.join_code}</p>
            </div>
            <span className="text-[var(--ink-faint)]">&rarr;</span>
          </button>
        ))}
      </div>
    </div>
  )
}

type DetailTab = 'students' | 'work' | 'attendance'

function ClassDetail({
  klass,
  teacherName,
  onBack,
  initialTab = 'students',
}: {
  klass: ClassRow
  teacherName: string
  onBack: () => void
  initialTab?: DetailTab
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>(initialTab)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollCode, setEnrollCode] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrollSuccess, setEnrollSuccess] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [certificateFor, setCertificateFor] = useState<StudentRow | null>(null)
  const [passcodeFor, setPasscodeFor] = useState<StudentRow | null>(null)

  const load = () => {
    listStudentsInClass(klass.id).then((s) => {
      setStudents(s)
      setLoading(false)
    })
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id])

  const removeStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the class? Their account stays, just unassigned.')) return
    await moveStudent(studentId, null)
    haptics.tap()
    load()
  }

  const toggleArchive = async () => {
    await archiveClass(klass.id, !klass.archived)
    load()
  }

  const enrollByCode = async () => {
    if (!enrollCode.trim()) return
    setEnrolling(true)
    setEnrollError('')
    setEnrollSuccess('')
    try {
      const result = await enrollStudentByCode(klass.id, enrollCode)
      setEnrollSuccess(`${result.full_name} added to the class.`)
      setEnrollCode('')
      haptics.success()
      playClick()
      load()
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : 'Could not find that Student Code.')
      haptics.error()
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--fg)]">
        <ArrowLeft className="h-4 w-4" /> Back to classes
      </button>

      <div className="panel flex items-center justify-between p-5">
        <h2 className="font-display text-xl font-bold">{klass.name}</h2>
        <button onClick={toggleArchive} className="btn-outline flex items-center gap-1.5 px-3 py-2 text-sm">
          <Archive className="h-4 w-4" /> {klass.archived ? 'Unarchive' : 'Archive'}
        </button>
      </div>

      <div className="flex gap-1 rounded-md border border-[var(--hairline-strong)] p-1 w-fit">
        {(['students', 'attendance', 'work'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDetailTab(t)}
            className={`rounded px-4 py-1.5 text-sm font-bold capitalize transition ${detailTab === t ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-[var(--fg)]/60 hover:text-[var(--fg)]'}`}
          >
            {t === 'students' ? 'Students' : t === 'attendance' ? 'Attendance' : 'Class Work'}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}

      {detailTab === 'students' && (
        <>
          <div className="panel space-y-3 p-5">
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--fg)]/80">
              <KeyRound className="h-4 w-4 text-[var(--gold)]" />
              Add a student by their Student Code
            </label>
            <p className="text-xs text-[var(--ink-muted)]">
              Every child gets a Student Code when they sign up (like MFM4827). Ask them for theirs and add them here.
            </p>
            <div className="flex gap-2">
              <input
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                placeholder="MFM4827"
                className={`${inputClass} py-2 text-center font-mono text-sm tracking-widest`}
                onKeyDown={(e) => e.key === 'Enter' && enrollByCode()}
              />
              <button onClick={enrollByCode} disabled={enrolling} className="btn-solid shrink-0 text-sm">
                {enrolling ? 'Adding…' : 'Add'}
              </button>
            </div>
            {enrollError && <p className="text-sm text-red-700">{enrollError}</p>}
            {enrollSuccess && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                <Check className="h-4 w-4" /> {enrollSuccess}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="eyebrow">Students ({students.length})</p>
            <DataList
              count={students.length}
              empty="No one has joined yet."
              head={<span className="flex-1">Child</span>}
            >
              {students.map((s) => (
                <DataRow key={s.id}>
                  <DataIdentity
                    avatarUrl={s.avatar_url}
                    fallback={<User className="h-5 w-5" strokeWidth={1.75} />}
                    title={s.full_name}
                  />
                  <DataNum>{s.total_points.toLocaleString()}</DataNum>
                  <DataActions>
                    <button
                      onClick={() => setCertificateFor(s)}
                      className="flex items-center gap-1.5 rounded-md bg-[var(--gold)]/15 px-3 py-1.5 text-xs font-bold text-[var(--gold)] hover:bg-[var(--gold)]/25"
                    >
                      <Award className="h-3.5 w-3.5" /> Certificate
                    </button>
                    {/* A child has no email, so no reset link can ever reach
                        them. Forgetting a passcode used to mean losing the
                        account for good; this is the way back, and it sits
                        with the teacher because that is who a child asks. */}
                    <button
                      onClick={() => setPasscodeFor(s)}
                      className="flex items-center gap-1.5 rounded-md bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-bold text-[var(--fg)]/80 hover:bg-[var(--gold)]/20"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> New passcode
                    </button>
                    <button onClick={() => removeStudent(s.id)} className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-500/25">
                      Remove
                    </button>
                  </DataActions>
                </DataRow>
              ))}
            </DataList>
          </div>
        </>
      )}

      {detailTab === 'attendance' && <AttendanceManager classId={klass.id} students={students} />}
      {detailTab === 'work' && <ClassWorkTab classId={klass.id} />}

      {certificateFor && (
        <CertificateModal student={certificateFor} className={klass.name} teacherName={teacherName} onClose={() => setCertificateFor(null)} />
      )}

      {passcodeFor && <PasscodeResetModal student={passcodeFor} onClose={() => setPasscodeFor(null)} />}
    </div>
  )
}

function todayDateKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function AttendanceManager({ classId, students }: { classId: string; students: StudentRow[] }) {
  const [view, setView] = useState<'register' | 'history'>('register')

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-md border border-[var(--hairline-strong)] p-1">
        <button
          onClick={() => setView('register')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-bold transition ${view === 'register' ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-[var(--fg)]/60 hover:text-[var(--fg)]'}`}
        >
          <ClipboardCheck className="h-3.5 w-3.5" /> Take the register
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-bold transition ${view === 'history' ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-[var(--fg)]/60 hover:text-[var(--fg)]'}`}
        >
          <HistoryIcon className="h-3.5 w-3.5" /> Over the weeks
        </button>
      </div>

      {view === 'register' ? (
        <AttendanceRegister classId={classId} students={students} />
      ) : (
        <AttendanceOverWeeks classId={classId} students={students} />
      )}
    </div>
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

  const presentCount = Object.values(present).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[var(--gold)]" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-auto py-2 text-sm`} />
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          {presentCount} of {students.length} present
        </p>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && students.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No students in this class yet.</p>}

      <div className="space-y-2">
        {!loading && students.map((s) => (
          <button
            key={s.id}
            onClick={() => setPresent((p) => ({ ...p, [s.id]: !p[s.id] }))}
            className="panel flex w-full items-center justify-between gap-3 p-4 text-left"
          >
            <div className="flex items-center gap-3">
              {s.avatar_url ? (
                <img src={s.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
                  <User className="h-4 w-4" strokeWidth={1.75} />
                </span>
              )}
              <p className="font-semibold">{s.full_name}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${present[s.id] ? 'bg-emerald-500/20 text-emerald-700' : 'bg-red-500/15 text-red-700'}`}
            >
              {present[s.id] ? 'Present' : 'Absent'}
            </span>
          </button>
        ))}
      </div>

      {!loading && students.length > 0 && (
        <button onClick={save} disabled={saving} className="btn-solid w-full py-3 text-sm">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Attendance'}
        </button>
      )}
    </div>
  )
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

function CertificateModal({
  student,
  className,
  teacherName,
  onClose,
}: {
  student: StudentRow
  className: string
  teacherName: string
  onClose: () => void
}) {
  const [achievement, setAchievement] = useState(`For outstanding dedication and growth in ${className}.`)
  const [url, setUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)

  const generate = async () => {
    setRendering(true)
    try {
      setUrl(
        await renderCertificatePng({
          studentName: student.full_name,
          className,
          teacherName,
          achievement: achievement.trim() || 'For outstanding dedication and growth.',
          churchName: "MFM Children's Ministry",
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        }),
      )
    } finally {
      setRendering(false)
    }
  }

  return (
    <Sheet title={`Certificate for ${student.full_name}`} onClose={onClose} wide>
      {url ? (
        <div className="space-y-3">
          <img src={url} alt="Certificate preview" className="w-full rounded-lg border border-[var(--hairline-strong)]" />
          <a href={url} download={`${student.full_name.replace(/\s+/g, '-')}-certificate.png`} className="btn-solid block w-full text-center text-sm">
            Download Certificate
          </a>
          <button onClick={() => setUrl(null)} className="btn-outline w-full py-2 text-sm">
            Edit Text
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">Achievement text</label>
          <textarea value={achievement} onChange={(e) => setAchievement(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          <button onClick={generate} disabled={rendering} className="btn-solid w-full py-3 text-sm">
            {rendering ? 'Generating…' : 'Generate Certificate'}
          </button>
        </div>
      )}
    </Sheet>
  )
}

const WORK_TAB_LABEL: Record<'lectures' | 'assignments', string> = {
  lectures: 'Sunday School',
  assignments: 'Assignments',
}

function ClassWorkTab({ classId }: { classId: string }) {
  const [sub, setSub] = useState<'lectures' | 'assignments'>('lectures')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md border border-[var(--hairline-strong)] p-1 w-fit">
        {(['lectures', 'assignments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-bold transition ${sub === t ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-[var(--fg)]/60 hover:text-[var(--fg)]'}`}
          >
            {t === 'lectures' ? <BookOpen className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            {WORK_TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {sub === 'lectures' ? (
        <div className="space-y-6">
          <LecturesManager classId={classId} />
          <SundayCalendarManager classId={classId} />
        </div>
      ) : (
        <AssignmentsManager classId={classId} />
      )}
    </div>
  )
}

function LecturesManager({ classId }: { classId: string }) {
  const [lectures, setLectures] = useState<LectureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => listLectures(classId).then((l) => { setLectures(l); setLoading(false) })
  useEffect(() => { load() }, [classId])

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
    load()
  }

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="eyebrow">New Sunday School Lesson</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={`${inputClass} py-2 text-sm`} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What are you teaching this week?" rows={3} className={`${inputClass} text-sm`} />
        <button onClick={create} disabled={creating} className="btn-solid text-sm">
          {creating ? 'Creating…' : 'Create as Draft'}
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && lectures.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No Sunday School lessons yet. Create your first one above.</p>}
      <div className="space-y-2">
        {lectures.map((l) => (
          <div key={l.id} className="panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{l.title}</p>
                {l.body && <p className="mt-1 text-sm text-[var(--ink-muted)]">{l.body}</p>}
              </div>
              <span
                className={`shrink-0 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  l.status === 'published' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-[var(--fg)]/10 text-[var(--fg)]/60'
                }`}
              >
                {l.status}
              </span>
            </div>
            <button onClick={() => toggle(l)} className="btn-outline mt-3 px-3 py-1.5 text-xs">
              {l.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// The same themed weekly cards the kids see on their Sunday School tab -
// here the teacher taps a card to unlock/lock it for their own class,
// instead of it following an automatic date-based rule.
function SundayCalendarManager({ classId }: { classId: string }) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const load = () => listUnlockedSundays(classId).then((dates) => { setUnlocked(new Set(dates)); setLoading(false) })
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  const toggle = async (dateKey: string) => {
    haptics.tap()
    if (unlocked.has(dateKey)) await lockSunday(classId, dateKey)
    else await unlockSunday(classId, dateKey)
    playClick()
    load()
  }

  return (
    <div>
      <p className="eyebrow mb-3">Sunday School Calendar</p>
      <p className="mb-3 text-sm text-[var(--ink-muted)]">Tap a Sunday to unlock it for your class - kids only see lessons you've unlocked.</p>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {SUNDAYS_2026.map((date, i) => {
          const theme = SUNDAY_LESSON_THEMES[i % SUNDAY_LESSON_THEMES.length]
          const key = sundayDateKey(date)
          const isUnlocked = unlocked.has(key)
          const isMascotPng = theme.image.endsWith('.png')
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="relative aspect-square overflow-hidden rounded-2xl text-left"
              style={{ background: 'var(--ink-panel)' }}
            >
              {isMascotPng ? (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--lp-accent-bible, var(--gold)) 16%, var(--ink-panel))' }}
                >
                  <img src={theme.image} alt="" className={`h-2/3 w-2/3 object-contain ${isUnlocked ? '' : 'opacity-40'}`} />
                </div>
              ) : (
                <img src={theme.image} alt="" className={`h-full w-full object-cover ${isUnlocked ? '' : 'opacity-40'}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
              <span
                className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-black/55'}`}
              >
                {isUnlocked ? <Check className="h-3.5 w-3.5 text-white" /> : <Lock className="h-3 w-3 text-white/80" />}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs font-bold leading-tight text-white">{theme.title}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AssignmentsManager({ classId }: { classId: string }) {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<AssignmentRow | null>(null)

  const load = () => listAssignments(classId).then((a) => { setAssignments(a); setLoading(false) })
  useEffect(() => { load() }, [classId])

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

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="eyebrow">New Assignment</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={`${inputClass} py-2 text-sm`} />
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions" rows={3} className={`${inputClass} text-sm`} />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputClass} py-2 text-sm`} />
        <button onClick={create} disabled={creating} className="btn-solid text-sm">
          {creating ? 'Creating…' : 'Create as Draft'}
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && assignments.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No assignments yet. Create your first one above.</p>}
      <div className="space-y-2">
        {assignments.map((a) => (
          <div key={a.id} className="panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{a.title}</p>
                {a.due_date && <p className="mt-1 text-xs text-[var(--ink-faint)]">Due {new Date(a.due_date).toLocaleDateString()}</p>}
              </div>
              <span
                className={`shrink-0 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  a.status === 'published' ? 'bg-emerald-500/15 text-emerald-700' : a.status === 'closed' ? 'bg-[var(--fg)]/10 text-[var(--fg)]/60' : 'bg-[var(--gold)]/15 text-[var(--gold)]'
                }`}
              >
                {a.status}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => toggle(a)} className="btn-outline px-3 py-1.5 text-xs">
                {a.status === 'published' ? 'Close' : 'Publish'}
              </button>
              <button onClick={() => setOpen(a)} className="btn-outline px-3 py-1.5 text-xs">
                View Submissions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
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

interface UpcomingDue {
  title: string
  className: string
  dueDate: string
}

// Home: the teacher's dashboard - classes and their student counts, quick
// links into Quiz, a live Ears for You pending count, upcoming assignment
// due dates across every class, and the teacher's own private Notes /
// Digital Bank (same generic per-user tables the kids' Home phone uses).
function TeacherHomeTab({ profile }: { profile: Profile | null }) {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [upcoming, setUpcoming] = useState<UpcomingDue[]>([])
  const [earsPending, setEarsPending] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyClasses().then(async (list) => {
      setClasses(list)
      const counts: Record<string, number> = {}
      const due: UpcomingDue[] = []
      await Promise.all(
        list.map(async (c) => {
          const [students, assignments] = await Promise.all([listStudentsInClass(c.id), listAssignments(c.id)])
          counts[c.id] = students.length
          for (const a of assignments) {
            if (a.due_date && new Date(a.due_date) >= new Date()) due.push({ title: a.title, className: c.name, dueDate: a.due_date })
          }
        }),
      )
      due.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      setStudentCounts(counts)
      setUpcoming(due.slice(0, 5))
      setLoading(false)
    })
    listEarsTeacherInbox().then((rows) => setEarsPending(rows.filter((r) => r.status === 'new').length))
  }, [])

  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Teacher</p>
        <h2 className="font-display text-2xl font-extrabold">Welcome back, {(profile?.full_name ?? 'Teacher').split(' ')[0]}!</h2>
      </div>

      {/* Sits above everything else and disappears the moment the queue is
          empty. A picture a child has uploaded is not visible to their class
          until this is dealt with, so it should not be somewhere a teacher
          has to remember to go and look. */}
      <AvatarReviewQueue />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard icon={GraduationCap} label="Your Classes" value={String(classes.length)} accent="var(--lp-accent-class, #4caf6d)">
          <div className="mt-3 space-y-1.5">
            {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
            {!loading && classes.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No classes yet.</p>}
            {classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 text-[var(--ink-muted)]">{studentCounts[c.id] ?? 0} students</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard icon={Users} label="Total Students" value={String(totalStudents)} accent="#60a5fa" />

        <DashboardCard icon={Gamepad2} label="Quizzes" accent="#a78bfa">
          <div className="mt-2 space-y-1.5">
            <Link to="/questions" onClick={() => playClick()} className="block text-sm font-bold text-[var(--gold)]">
              Question Bank →
            </Link>
            <Link to="/setup" onClick={() => playClick()} className="block text-sm font-bold text-[var(--gold)]">
              Host a Match →
            </Link>
            <Link to="/history" onClick={() => playClick()} className="block text-sm font-bold text-[var(--gold)]">
              History →
            </Link>
          </div>
        </DashboardCard>

        <DashboardCard icon={HeartHandshake} label="Ears for You" value={String(earsPending)} accent="#fb7185">
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{earsPending > 0 ? 'New messages waiting.' : 'All caught up.'}</p>
        </DashboardCard>

        <DashboardCard icon={Calendar} label="Upcoming" accent="var(--gold)">
          <div className="mt-2 space-y-2">
            {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
            {!loading && upcoming.length === 0 && <p className="text-sm text-[var(--ink-muted)]">Nothing due soon.</p>}
            {upcoming.map((a, i) => (
              <div key={i} className="text-sm">
                <p className="truncate font-bold">{a.title}</p>
                <p className="truncate text-[var(--ink-muted)]">
                  {a.className} · Due {new Date(a.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <NotesSection kind="notebook" title="Notes" icon={FileText} accent="var(--gold)" placeholder="Jot something down…" />
        </div>
        <div className="panel p-5">
          <DigitalBankSection />
        </div>
      </div>
    </div>
  )
}

function DashboardCard({
  icon: Icon,
  label,
  value,
  accent,
  children,
}: {
  icon: LucideIcon
  label: string
  value?: string
  accent: string
  children?: ReactNode
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        {value !== undefined && <span className="font-display text-2xl font-extrabold">{value}</span>}
      </div>
      <p className="mt-3 eyebrow">{label}</p>
      {children}
    </div>
  )
}

// Chat: a big isometric phone whose entire screen is the teacher's
// messaging inbox - conversation list, then a thread once one is opened.
function TeacherChatTab({ profile }: { profile: Profile | null }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [open, setOpen] = useState<ConversationSummary | null>(null)

  useEffect(() => {
    listMyConversations().then(setConversations)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-center rounded-3xl p-6" style={{ background: '#5b21b6', minHeight: 140 }}>
        <p className="font-display text-lg font-extrabold text-white drop-shadow-md">Welcome back, {(profile?.full_name ?? 'Teacher').split(' ')[0]}!</p>
      </div>
      <IsometricPhone accent="var(--lp-accent-class)">
      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-5">
        <div className="flex items-center gap-3 pb-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/30" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-extrabold text-white ring-2 ring-white/30">
              {(profile?.full_name ?? '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold text-white">{profile?.full_name ?? 'Teacher'}</p>
            <p className="text-xs text-white/50">{open ? open.other_name : 'Messages'}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {open ? (
            <PhoneThread conversationId={open.id} onBack={() => setOpen(null)} />
          ) : (
            <div className="space-y-2">
              {conversations.length === 0 && <p className="pt-8 text-center text-sm text-white/40">No conversations yet.</p>}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    playClick()
                    setOpen(c)
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-3 text-left transition hover:bg-white/10"
                >
                  {c.other_avatar ? (
                    <img src={c.other_avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {c.other_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <p className="truncate text-sm font-semibold text-white">{c.other_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      </IsometricPhone>
    </div>
  )
}

function PhoneThread({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = () => listMessages(conversationId).then(setMessages)
  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Land on the newest message, not the oldest one.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const send = async () => {
    if (!draft.trim()) return
    await sendMessage(conversationId, draft)
    setDraft('')
    playClick()
    load()
  }

  return (
    <div className="flex h-full flex-col">
      <button onClick={onBack} className="mb-2 flex items-center gap-1 text-xs font-bold text-white/60 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div className="flex-1 space-y-2 overflow-y-auto pb-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-[var(--gold)] text-black' : 'bg-white/10 text-white'}`}
          >
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="pt-6 text-center text-xs text-white/40">No messages yet.</p>}
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

const EARS_STATUS_STYLE: Record<EarsStatus, string> = {
  new: 'bg-[var(--gold)]/15 text-[var(--gold)]',
  acknowledged: 'bg-[var(--fg)]/10 text-[var(--fg)]/60',
  in_progress: 'bg-sky-500/15 text-sky-700',
  escalated: 'bg-red-500/15 text-red-700',
  resolved: 'bg-emerald-500/15 text-emerald-700',
}

function EarsInboxTab() {
  const [items, setItems] = useState<EarsMessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<EarsMessageRow | null>(null)

  const load = () => listEarsTeacherInbox().then(setItems).finally(() => setLoading(false))
  useEffect(() => {
    load()
  }, [])

  const openItem = async (m: EarsMessageRow) => {
    setOpen(m)
    if (m.status === 'new') {
      await acknowledgeEarsMessage(m.id)
      load()
    }
  }

  if (open) return <EarsDetail message={open} onBack={() => { setOpen(null); load() }} />

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ink-muted)]">A safe channel from students in your classes. Anonymous ones never reveal who sent them, even to you.</p>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-[var(--ink-muted)]">Nothing here yet.</p>}
      <div className="space-y-3">
        {items.map((m) => (
          <button key={m.id} onClick={() => openItem(m)} className="panel panel-interactive block w-full p-5 text-left">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--ink-muted)]">{m.is_anonymous ? 'Anonymous' : m.student_name || 'A student'}</p>
              <span className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${EARS_STATUS_STYLE[m.status]}`}>{m.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-[var(--fg)]/80">{m.body}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function BibleBuddyLogTab() {
  const [items, setItems] = useState<AiCompanionTeacherLogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBibleBuddyTeacherLog(50).then(setItems).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ink-muted)]">
        Every question your students ask Bible Buddy, for safeguarding review. Anonymous ones never reveal who sent them.
      </p>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No questions logged yet.</p>}
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="panel p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-muted)]">
                {m.is_anonymous && <EyeOff className="h-3.5 w-3.5" />}
                {m.is_anonymous ? 'Anonymous' : m.student_name || 'A student'}
              </p>
              <p className="text-xs text-[var(--ink-faint)]">{new Date(m.created_at).toLocaleString()}</p>
            </div>
            <p className="mt-2 text-sm font-bold">{m.question}</p>
            <p className="mt-1 text-sm text-[var(--fg)]/70">{m.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
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

function ProfileTab() {
  const { profile, refreshProfile } = useMinistryAuth()
  const [fullName, setFullName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setAvatar(profile.avatar_url)
    }
  }, [profile])

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    const dataUrl = await fileToResizedDataUrl(file)
    setAvatar(dataUrl)
  }

  const save = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    await supabase.from('profiles').update({ full_name: fullName.trim(), avatar_url: avatar }).eq('id', data.user.id)
    playClick()
    haptics.success()
    setSaved(true)
    refreshProfile()
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="panel mx-auto max-w-md space-y-4 p-5">
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
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} />
      {saved && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> Saved
        </p>
      )}
      <button onClick={save} className="btn-solid w-full py-3">
        Save Profile
      </button>
    </div>
  )
}
