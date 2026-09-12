import { useEffect, useState } from 'react'
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
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setInitializing(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (initializing) return
    if (!session) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [session, initializing])

  const loading = initializing || profileLoading

  const refreshProfile = () => {
    if (!session) return
    getMyProfile().then(setProfile)
  }

  return { session, profile, loading, refreshProfile }
}
