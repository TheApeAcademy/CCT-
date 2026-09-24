import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, getMyProfile, type Profile } from './supabase'

export function useMinistryAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // True until the very first auth-state resolution comes back (whether that
  // turns out to be a real persisted session or none at all). Kept separate
  // from the profile fetch below on purpose: `session` starts out `null`
  // before Supabase has even checked storage, so gating on "is there a
  // session yet" alone made a returning, still-signed-in visitor flash the
  // sign-in screen on every reload while getSession() was still resolving
  // (worse, could be seconds, not a flash, whenever the stored access token
  // had expired and needed a network refresh) - onAuthStateChange always
  // fires once up front with the resolved initial session (or null), so
  // that single event is what should end this "still checking" state.
  const [initializing, setInitializing] = useState(true)
  // The user id `profile` was resolved for, or null if it has not been
  // resolved for the current session yet. A plain "is a fetch in flight"
  // boolean is not enough: it starts out false, so between the render where
  // the session arrives and the effect that starts the fetch there was one
  // committed frame reporting "signed in, not loading, no profile". Every
  // portal reads that as "not my role" and shows its signed-out screen, so a
  // child who had just signed up landed back on the sign-up page. Comparing
  // ids instead means "signed in but not resolved yet" is never mistaken for
  // "resolved to nobody".
  const [profileFor, setProfileFor] = useState<string | null>(null)
  // Set when the profile lookup itself failed (offline, RLS, a dropped
  // request). Distinct from "resolved to null", which means the account
  // genuinely has no profile row. Callers show a retry rather than a
  // sign-in screen, because the visitor is signed in either way.
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setInitializing(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (initializing) return
    const uid = session?.user.id ?? null
    if (!uid) {
      setProfile(null)
      setProfileFor(null)
      setProfileError(false)
      return
    }
    let cancelled = false
    setProfileError(false)
    getMyProfile()
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setProfileFor(uid)
      })
      .catch(() => {
        if (cancelled) return
        setProfile(null)
        setProfileError(true)
        setProfileFor(uid)
      })
    return () => {
      cancelled = true
    }
  }, [session, initializing])

  const loading = initializing || (!!session && profileFor !== session.user.id)

  const refreshProfile = useCallback(() => {
    const uid = session?.user.id
    if (!uid) return
    setProfileError(false)
    getMyProfile()
      .then(setProfile)
      .catch(() => setProfileError(true))
  }, [session])

  // A role is granted by somebody else, in another browser: an admin promotes
  // a teacher from the Admins tab, or approves an application. Nothing pushes
  // that down to the tab already sitting on the "you are not an admin yet"
  // screen, so without this the only way to see the new role is to sign out
  // and sign back in - which is exactly what it used to take. Re-reading the
  // one profile row whenever the tab comes back to the front is cheap and
  // covers the real case: the person is told they have been approved, they
  // switch back to the tab, and it is already right.
  useEffect(() => {
    if (!session) return
    const onFocus = () => {
      if (document.visibilityState === 'hidden') return
      refreshProfile()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [session, refreshProfile])

  return { session, profile, loading, profileError, refreshProfile }
}
