import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Users } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import PortalShell from '../components/PortalShell'
import ParentHome from '../components/parent/ParentHome'
import { claimParentRole } from '../lib/ministry'
import { playClick } from '../lib/sound'

// The parent's sub-pages load on demand: most visits only need the portal.
const ProgressReport = lazy(() => import('../components/parent/ProgressReport'))
const TakeHomeSunday = lazy(() => import('../components/parent/TakeHomeSunday'))
const ChurchCalendar = lazy(() => import('../components/parent/ChurchCalendar'))

/**
 * /parent and its pages. Signing in, claiming the parent role and the
 * wrong-account notice stay in the portal shell; a signed-in parent gets the
 * Claude Design handoff pages, which draw their own header.
 */
export default function ParentPortal() {
  // One auth hook for the whole page: the gate's claim refreshes this same
  // profile, so the portal appears the moment the role lands.
  const auth = useMinistryAuth()
  const { session, profile } = auth
  if (session && profile?.role === 'parent') {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f6f3fb' }} />}>
        <Routes>
          <Route index element={<ParentHome name={profile.full_name ?? ''} />} />
          <Route path="report" element={<ProgressReport />} />
          <Route path="sunday" element={<TakeHomeSunday />} />
          <Route path="calendar" element={<ChurchCalendar />} />
          <Route path="*" element={<Navigate to="/parent" replace />} />
        </Routes>
      </Suspense>
    )
  }
  return (
    <PortalShell eyebrow="Parent Dashboard">
      <ParentGate auth={auth} />
    </PortalShell>
  )
}

function ParentGate({ auth }: { auth: ReturnType<typeof useMinistryAuth> }) {
  const { session, profile, loading, refreshProfile } = auth
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
