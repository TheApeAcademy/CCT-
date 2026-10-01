import { useEffect, useState } from 'react'
import { Users, KeyRound, Flame, BookOpen, ClipboardCheck, Star, User, ChevronDown, Sparkles, type LucideIcon } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import {
  claimParentRole,
  linkChildByCode,
  listMyChildren,
  getChildBibleStreak,
  listChildAchievements,
  listChildAttendance,
  listChildQuizAttempts,
  listChildBibleBuddy,
  type ChildRow,
  type EarnedAchievement,
  type AiCompanionMessageRow,
} from '../lib/ministry'
import { getJourneyProgressForStudent, type JourneyProgressRow } from '../lib/journey'
import { achievementIcon } from '../lib/achievementIcons'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function ParentPortal() {
  const { session, profile, loading, refreshProfile } = useMinistryAuth()
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  // Bumping this re-runs the claim. Without it a parent whose claim failed had
  // nothing to press: the effect's guards are all unchanged after a failure,
  // so it would never fire again on its own.
  const [claimAttempt, setClaimAttempt] = useState(0)

  useEffect(() => {
    if (!session || loading || profile === null || profile.role !== null) return
    // A signed-in user with no role yet, landing on THIS page, is someone who
    // just created an account here specifically to follow their child - the
    // RPC itself only ever sets the role when it's still unset, so this is
    // safe even if effect timing runs it more than once.
    let cancelled = false
    setClaiming(true)
    setClaimError('')
    claimParentRole()
      .then(refreshProfile)
      .then((fresh) => {
        // The RPC can come back clean and still not have set the role, so the
        // refetched profile is the only thing that proves it worked. Treating
        // "no error" as success is what left this page on its setup line for
        // good.
        if (cancelled) return
        if (!fresh || fresh.role === null) {
          setClaimError('We could not finish setting up your account.')
        }
      })
      .catch((e) => {
        if (cancelled) return
        setClaimError(e instanceof Error ? e.message : 'We could not finish setting up your account.')
      })
      .finally(() => {
        if (!cancelled) setClaiming(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading, profile?.role, claimAttempt])

  if (loading || claiming) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session) {
    return (
      <AuthCard
        icon={Users}
        title="Parent Dashboard"
        subtitle="Create an account to follow your child's progress - no class code needed."
        signUpLabel="Create Account"
      />
    )
  }
  if (profile?.role === 'parent') return <ParentDashboard />
  if (profile?.role === null) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold">
          {claimError ? 'Setup did not finish' : 'Setting up your account…'}
        </h1>
        {claimError ? (
          <>
            <p className="text-sm text-[var(--ink-muted)]">{claimError}</p>
            <button
              onClick={() => {
                playClick()
                setClaimAttempt((n) => n + 1)
              }}
              className="btn-outline"
            >
              Try Again
            </button>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Users className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">This Account Isn&apos;t a Parent Account</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        You&apos;re signed in with an account that&apos;s already set up as something else. Sign out and create a separate account here to
        follow your child.
      </p>
      <button onClick={() => signOut()} className="btn-outline">
        Sign Out
      </button>
    </div>
  )
}

function ParentDashboard() {
  const [children, setChildren] = useState<ChildRow[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [openChild, setOpenChild] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')

  // The catch matters as much as the fetch here. Without it a failed lookup
  // left the whole dashboard on its "Loading" line with no error and no way
  // to try again, which is indistinguishable from a parent having no children
  // linked.
  const load = () => {
    setLoadError('')
    listMyChildren()
      .then((c) => {
        setChildren(c)
        setLoading(false)
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : 'Something went wrong.')
        setLoading(false)
      })
  }
  useEffect(() => {
    load()
  }, [])

  const link = async () => {
    if (!code.trim()) return
    setLinking(true)
    setLinkError('')
    try {
      const result = await linkChildByCode(code)
      setCode('')
      haptics.success()
      playClick()
      load()
      setOpenChild(result.student_id)
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Could not find a child with that code.')
      haptics.error()
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Parent</p>
          <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
        </div>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      <div className="panel space-y-3 p-5">
        <label className="flex items-center gap-2 text-sm font-bold text-[var(--fg)]/80">
          <KeyRound className="h-4 w-4 text-[var(--gold)]" />
          Link a child
        </label>
        <p className="text-xs text-[var(--ink-muted)]">
          Your child has a Parent Link Code on their profile (starts with FAM). Ask them for it and enter it here.
        </p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FAM482703"
            className={`${inputClass} py-2 text-center font-mono text-sm tracking-widest`}
            onKeyDown={(e) => e.key === 'Enter' && link()}
          />
          <button onClick={link} disabled={linking} className="btn-solid shrink-0 text-sm">
            {linking ? 'Linking…' : 'Link'}
          </button>
        </div>
        {linkError && <p className="text-sm text-red-700">{linkError}</p>}
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && loadError && (
        <div className="panel space-y-3 p-5 text-center">
          <p className="text-sm font-semibold text-[var(--fg)]">We could not load your children.</p>
          <p className="text-xs text-[var(--ink-muted)]">{loadError}</p>
          <button onClick={load} className="btn-outline text-sm">
            Try again
          </button>
        </div>
      )}
      {!loading && !loadError && children.length === 0 && (
        <p className="text-sm text-[var(--ink-muted)]">No children linked yet. Enter their code above to see their progress.</p>
      )}

      <div className="space-y-3">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} open={openChild === child.id} onToggle={() => setOpenChild(openChild === child.id ? null : child.id)} />
        ))}
      </div>
    </div>
  )
}

function ChildCard({ child, open, onToggle }: { child: ChildRow; open: boolean; onToggle: () => void }) {
  return (
    <div className="panel overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="flex items-center gap-3">
          {child.avatar_url ? (
            <img src={child.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
              <User className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
          <div>
            <p className="font-semibold">{child.full_name}</p>
            <p className="text-xs text-[var(--ink-faint)]">
              {child.class_name ?? 'No class yet'} · {child.total_points.toLocaleString()} points
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-[var(--ink-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <ChildDetail child={child} />}
    </div>
  )
}

function ChildDetail({ child }: { child: ChildRow }) {
  const [streak, setStreak] = useState<number | null>(null)
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [attendance, setAttendance] = useState<{ present: number; total: number }>({ present: 0, total: 0 })
  const [journey, setJourney] = useState<JourneyProgressRow[]>([])
  const [monthlyStars, setMonthlyStars] = useState(0)
  const [buddy, setBuddy] = useState<AiCompanionMessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthIso = startOfMonth.toISOString()

    Promise.all([
      getChildBibleStreak(child.id),
      listChildAchievements(child.id),
      listChildAttendance(child.id, 30),
      getJourneyProgressForStudent(child.id),
      listChildQuizAttempts(child.id, monthIso),
      // Never rejects the whole load: a parent should still get the rest of
      // the page if this one query fails.
      listChildBibleBuddy(child.id).catch(() => [] as AiCompanionMessageRow[]),
    ])
      .catch((e) => {
        // Without this the panel sat on its loading line forever whenever any
        // one of these failed, with nothing on screen to say why and no way
        // to try again. compute_bible_streak refusing a parent did exactly
        // that.
        setFailed(e instanceof Error ? e.message : 'Something went wrong loading this.')
        setLoading(false)
        return null
      })
      .then((rows) => {
        if (!rows) return
        const [s, ach, att, jp, quizzes, buddyLog] = rows
        setStreak(s)
        setAchievements(ach)
        setAttendance({ present: att.filter((a) => a.present).length, total: att.length })
        setJourney(jp)
        setBuddy(buddyLog)

        // A simple, transparent monthly rating - not a hidden formula: one
        // star for every 3 things done this month (lessons, quizzes, days
        // present), capped at 5. No activity this month shows 0, not a
        // participation-trophy floor.
        const lessonsThisMonth = jp.filter((j) => j.completed_at >= monthIso).length
        const attendanceThisMonth = att.filter((a) => a.present && a.date >= monthIso.slice(0, 10)).length
        const activity = lessonsThisMonth + quizzes.length + attendanceThisMonth
        setMonthlyStars(Math.min(5, Math.ceil(activity / 3)))
        setLoading(false)
      })
  }, [child.id])

  if (loading) {
    return (
      <div className="border-t border-[var(--hairline)] p-6 text-center text-sm text-[var(--ink-muted)]">
        Loading {child.full_name.split(' ')[0]}&apos;s progress…
      </div>
    )
  }

  if (failed) {
    return (
      <div className="space-y-1 border-t border-[var(--hairline)] p-6 text-center">
        {/* --fg, not --ink: this shell re-points the theme for a light
            surface and --ink is still the dark palette's ink, so the line
            came out white on a pale panel. */}
        <p className="text-sm font-semibold text-[var(--fg)]">
          We could not load {child.full_name.split(' ')[0]}&apos;s progress.
        </p>
        <p className="text-xs text-[var(--ink-muted)]">{failed}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-[var(--hairline)] p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Flame} label="Bible Streak" value={`${streak ?? 0} day${streak === 1 ? '' : 's'}`} />
        <Stat icon={BookOpen} label="Lessons Done" value={String(journey.length)} />
        <Stat icon={ClipboardCheck} label="Attendance" value={attendance.total ? `${attendance.present}/${attendance.total}` : 'No data yet'} />
        <Stat icon={Star} label="Badges" value={String(achievements.length)} />
      </div>

      <div className="panel p-4">
        <p className="eyebrow mb-2">This Month</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="h-5 w-5" fill={i < monthlyStars ? 'var(--gold)' : 'none'} style={{ color: 'var(--gold)' }} strokeWidth={1.75} />
          ))}
        </div>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          {monthlyStars === 0 ? 'No activity recorded yet this month.' : 'Based on lessons, quizzes, and days present this month.'}
        </p>
      </div>

      <div>
        <p className="eyebrow mb-2">Bible Buddy</p>
        <p className="mb-2 text-xs text-[var(--ink-muted)]">
          What {child.full_name.split(' ')[0]} asked the Bible helper, and what it said back. Questions they chose to ask privately are
          not shown here, to anyone.
        </p>
        {buddy.length === 0 && <p className="text-sm text-[var(--ink-muted)]">Nothing asked yet.</p>}
        <div className="space-y-2">
          {buddy.map((m) => (
            <div key={m.id} className="rounded-md bg-[var(--ink-panel)] p-3">
              <p className="flex items-start gap-2 text-sm font-bold">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--gold)]" strokeWidth={2} />
                {m.question}
              </p>
              <p className="mt-1.5 text-sm text-[var(--ink-muted)]">{m.answer}</p>
              <p className="mt-1.5 text-[10px] text-[var(--ink-faint)]">{new Date(m.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">Badges &amp; Achievements</p>
        {achievements.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No badges earned yet.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {achievements.map((a) => {
            const Icon = achievementIcon(a.icon)
            return (
              <div key={a.id} className="flex items-center gap-2.5 rounded-md bg-[var(--ink-panel)] p-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--gold)' }}>
                  <Icon className="h-3.5 w-3.5 text-black" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{a.name}</p>
                  <p className="truncate text-[10px] text-[var(--ink-faint)]">{a.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="panel p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-[var(--gold)]" strokeWidth={1.75} />
      <p className="mt-1 text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</p>
    </div>
  )
}
