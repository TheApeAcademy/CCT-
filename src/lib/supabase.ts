import { createClient } from '@supabase/supabase-js'

// Publishable key, safe to ship in client code by design (Row Level Security
// on the backend is what actually protects the data). This is a dedicated
// Supabase project for the Children's Ministry platform (accounts, classes,
// messaging, leaderboard) — kept separate from any other apps' data.
const SUPABASE_URL = 'https://zdgbatkxjxiecqshnmwh.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-fgDSztaoa-JWaHBCfYK3g__Y-MQsLe'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// The Edge Function that creates a student's account (name + PIN, no email
// needed). Runs with the service role key server-side, never in the browser.
export const JOIN_CLASS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/join-class`

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
