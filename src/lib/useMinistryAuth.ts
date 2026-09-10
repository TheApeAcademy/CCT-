import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, getMyProfile, type Profile } from './supabase'

export function useMinistryAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [session])

  const refreshProfile = () => {
    if (!session) return
    getMyProfile().then(setProfile)
  }

  return { session, profile, loading, refreshProfile }
}
