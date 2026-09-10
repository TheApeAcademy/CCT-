import { useEffect, useState } from 'react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
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
  if (!session) return <AdminSignIn />
  if (profile?.role !== 'admin') return <NotAuthorized />
  return <AdminDashboard />
}

function AdminSignIn() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  const handleSignIn = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) return setError(err.message)
    playClick()
    haptics.success()
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (err) return setError(err.message)
    setSignedUp(true)
  }

  if (signedUp) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-4xl">🛡️</p>
        <h1 className="font-display text-3xl font-extrabold">Account created</h1>
        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 text-left shadow-lg shadow-black/20">
          <p>Admin access isn't self-service — an existing admin (or the senior pastor) needs to promote your account.</p>
          <p className="text-white/60">Tell them the email you signed up with: <span className="text-amber-300">{email}</span></p>
        </div>
        <button onClick={() => setTab('signin')} className="w-full rounded-2xl bg-white/10 py-3 font-bold hover:bg-white/20">
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-4xl">🛡️</p>
        <h1 className="font-display text-3xl font-extrabold">Admin Control Centre</h1>
        <p className="mt-2 text-white/60">For the senior pastor and ministry admins only.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === 'signin' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === 'signup' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
        >
          Create Account
        </button>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={tab === 'signin' ? handleSignIn : handleSignUp}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}

function NotAuthorized() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-4xl">⏳</p>
      <h1 className="font-display text-3xl font-extrabold">Not an Admin (Yet)</h1>
      <p className="text-white/60">You're signed in, but this account hasn't been made an admin. Ask an existing admin to promote you from the Admins tab.</p>
      <button onClick={() => signOut()} className="rounded-full bg-white/10 px-6 py-2 text-sm hover:bg-white/20">
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
        <h1 className="font-display text-2xl font-extrabold">🛡️ Admin Control Centre</h1>
        <button onClick={() => signOut()} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          Sign Out
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['applications', '📝 Teacher Applications'],
            ['classes', '🏫 All Classes'],
            ['seasons', '🗓️ Seasons'],
            ['admins', '🛡️ Admins'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

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
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {f}
          </button>
        ))}
      </div>
      {loading && <p className="text-white/50">Loading…</p>}
      {!loading && apps.length === 0 && <p className="text-white/50">Nothing here.</p>}
      <div className="space-y-2">
        {apps.map((a) => (
          <div key={a.id} className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{a.full_name}</p>
                <p className="text-sm text-white/60">
                  {a.email} {a.phone && `· ${a.phone}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  a.status === 'approved' ? 'bg-green-500/30 text-green-300' : a.status === 'rejected' ? 'bg-red-500/30 text-red-300' : 'bg-amber-400/30 text-amber-300'
                }`}
              >
                {a.status}
              </span>
            </div>
            {a.message && <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{a.message}</p>}
            {a.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => handle(a.id, true)} className="rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-300 transition hover:scale-105 hover:bg-green-500/30">
                  ✓ Approve
                </button>
                <button onClick={() => handle(a.id, false)} className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:scale-105 hover:bg-red-500/30">
                  ✕ Reject
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

  if (loading) return <p className="text-white/50">Loading…</p>
  if (classes.length === 0) return <p className="text-white/50">No classes created yet.</p>

  return (
    <div className="space-y-2">
      {classes.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 p-4">
          <div>
            <p className="font-bold">{c.name}</p>
            <p className="text-sm text-white/60">Taught by {c.teacher_name || 'Unknown'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-xs">{c.join_code}</span>
            {c.archived && <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Archived</span>}
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
          className="flex-1 rounded-lg bg-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950">
          + Create
        </button>
      </div>
      {loading && <p className="text-white/50">Loading…</p>}
      <div className="space-y-2">
        {seasons.map((s) => (
          <div key={s.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${s.is_active ? 'bg-amber-400/15 ring-1 ring-amber-400/40' : 'bg-white/5'}`}>
            <p className="font-semibold">
              {s.name} {s.is_active && <span className="ml-1 text-xs text-amber-300">● ACTIVE</span>}
            </p>
            {!s.is_active && (
              <button onClick={() => activate(s.id)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
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
      <p className="text-sm text-white/60">Promote a teacher to admin. Admin access is powerful, only add people you fully trust.</p>
      {loading && <p className="text-white/50">Loading…</p>}
      <div className="space-y-2">
        {people.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <p className="font-semibold">
              {p.full_name || 'Unnamed'} <span className="text-xs text-white/50">· {p.role}</span>
            </p>
            {p.role !== 'admin' && (
              <button onClick={() => promote(p.id)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
                Make admin
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
