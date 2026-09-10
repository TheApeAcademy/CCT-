import { useEffect, useState } from 'react'
import { ShieldCheck, FileText, School, CalendarRange, Users, Check, X } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import TabBar from '../components/ui/TabBar'
import {
  listTeacherApplications,
  approveTeacher,
  listAllClassesWithTeacher,
  listSeasons,
  createSeasonServer,
  setActiveSeasonServer,
  listAllTeachers,
  promoteToAdmin,
  type TeacherApplication,
  type ClassRow,
  type SeasonRow,
} from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function AdminPortal() {
  const { session, profile, loading } = useMinistryAuth()

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
            <p>Admin access isn't self-service &mdash; an existing admin (or the senior pastor) needs to promote your account.</p>
            <p className="mt-2 text-white/70">
              Tell them the email you signed up with: <span className="font-bold text-[var(--gold)]">{email}</span>
            </p>
          </>
        )}
      />
    )
  }
  if (profile?.role !== 'admin') return <NotAuthorized />
  return <AdminDashboard />
}

function NotAuthorized() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Not an Admin (Yet)</h1>
      <p className="text-sm text-[var(--ink-muted)]">You're signed in, but this account hasn't been made an admin. Ask an existing admin to promote you from the Admins tab.</p>
      <button onClick={() => signOut()} className="btn-outline">
        Sign Out
      </button>
    </div>
  )
}

type Tab = 'applications' | 'classes' | 'seasons' | 'admins'

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('applications')

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

      <TabBar
        value={tab}
        onChange={setTab}
        items={[
          { value: 'applications', label: 'Teacher Applications', icon: FileText },
          { value: 'classes', label: 'All Classes', icon: School },
          { value: 'seasons', label: 'Seasons', icon: CalendarRange },
          { value: 'admins', label: 'Admins', icon: Users },
        ]}
      />

      {tab === 'applications' && <ApplicationsTab />}
      {tab === 'classes' && <ClassesTab />}
      {tab === 'seasons' && <SeasonsTab />}
      {tab === 'admins' && <AdminsTab />}
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
            className={`rounded px-3 py-1.5 text-xs font-bold capitalize transition ${filter === f ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/60 hover:text-white'}`}
          >
            {f}
          </button>
        ))}
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && apps.length === 0 && <p className="text-sm text-[var(--ink-muted)]">Nothing here.</p>}
      <div className="space-y-2">
        {apps.map((a) => (
          <div key={a.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{a.full_name}</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {a.email} {a.phone && `· ${a.phone}`}
                </p>
              </div>
              <span
                className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  a.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : a.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-[var(--gold)]/15 text-[var(--gold)]'
                }`}
              >
                {a.status}
              </span>
            </div>
            {a.message && <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{a.message}</p>}
            {a.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => handle(a.id, true)} className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/25">
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button onClick={() => handle(a.id, false)} className="flex items-center gap-1.5 rounded-md bg-red-500/15 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/25">
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ClassesTab() {
  const [classes, setClasses] = useState<(ClassRow & { teacher_name: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllClassesWithTeacher().then(setClasses).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
  if (classes.length === 0) return <p className="text-sm text-[var(--ink-muted)]">No classes created yet.</p>

  return (
    <div className="space-y-2">
      {classes.map((c) => (
        <div key={c.id} className="panel flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p className="font-bold">{c.name}</p>
            <p className="text-sm text-[var(--ink-muted)]">Taught by {c.teacher_name || 'Unknown'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[var(--hairline-strong)] px-2.5 py-1 font-mono text-xs">{c.join_code}</span>
            {c.archived && <span className="rounded bg-white/10 px-2.5 py-1 text-xs">Archived</span>}
          </div>
        </div>
      ))}
    </div>
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
