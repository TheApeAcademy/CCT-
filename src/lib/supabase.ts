import { createClient } from '@supabase/supabase-js'

// Publishable key, safe to ship in client code by design (Row Level Security
// on the backend is what actually protects the data). This is a dedicated
// Supabase project for the Children's Ministry platform (accounts, classes,
// messaging, leaderboard) — kept separate from any other apps' data.
const SUPABASE_URL = 'https://zdgbatkxjxiecqshnmwh.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-fgDSztaoa-JWaHBCfYK3g__Y-MQsLe'

// Kids (and admins/teachers) stay signed in on a device until they explicitly
// sign out - persistSession + autoRefreshToken keep the session alive across
// reloads and browser restarts via the refresh token in localStorage.
// detectSessionInUrl is off on purpose: every sign-in here goes through
// signInWithPassword (never a magic-link/OAuth redirect), and the app uses
// HashRouter, so leaving it on would mean every route change gets scanned as
// a possible auth redirect for no reason.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

// The Edge Function that creates a student's account (name + PIN, no email
// needed). Runs with the service role key server-side, never in the browser.
export const JOIN_CLASS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/join-class`

// Registers a student from just a name + 4-digit passcode and hands back a
// Student Code. Class enrollment happens later, separately, via a teacher.
export const STUDENT_REGISTER_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/student-register`

export type UserRole = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  role: UserRole | null
  full_name: string
  avatar_url: string | null
  phone: string | null
  created_at: string
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function signOut() {
  await supabase.auth.signOut()
}
