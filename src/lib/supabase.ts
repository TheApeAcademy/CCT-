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
//
// detectSessionInUrl is off on purpose: the app uses HashRouter, so leaving it
// on would mean every route change gets scanned as a possible auth redirect.
// The one link that does come back from Supabase is the password reset email,
// and that is handled explicitly in main.tsx before the router ever mounts.
//
// flowType 'pkce' is what makes that possible. The default implicit flow puts
// the recovery token in the URL fragment (#access_token=...), which is exactly
// where HashRouter keeps the current route - the two would overwrite each
// other. PKCE hands back "?code=..." as an ordinary query string instead, well
// clear of the hash, and it never puts a usable token in a URL that could end
// up in a browser history or a shared link.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
})

// Where Supabase sends someone back to after they tap the link in a password
// reset email. Deliberately the origin root and not a hash route: the reset
// code arrives as a query string, main.tsx trades it for a session, and only
// then does the router take over and show /reset-password.
export function passwordResetRedirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

/**
 * Sends the reset email. Every adult login in the app (teacher, admin,
 * parent) goes through this one function, so there is a single place where
 * the redirect target and the wording of a failure are decided.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: passwordResetRedirectUrl(),
  })
  if (error) throw error
}

// The Edge Function that creates a student's account (name + PIN, no email
// needed). Runs with the service role key server-side, never in the browser.
export const JOIN_CLASS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/join-class`

// Registers a student from just a name + 4-digit passcode and hands back a
// Student Code. Class enrollment happens later, separately, via a teacher.
export const STUDENT_REGISTER_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/student-register`

// Unlike the two above, this one requires a signed-in student - the
// Authorization header (a real session JWT) goes with every call, not a
// bare fetch, so verify_jwt stays ON for this function.
export const AI_COMPANION_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-companion`

// Gives a child who has forgotten their passcode a new one. There is no email
// on a student account, so the reset link every adult gets cannot exist for
// them - their teacher does it instead. verify_jwt is ON, and the function
// checks the caller is a teacher of that child's class, or an admin.
export const RESET_PASSCODE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/reset-passcode`

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'

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

// Re-exported so existing call sites (AuthCard, JoinClass) can keep
// importing it alongside `supabase` - see rememberMe.ts for why the
// implementation itself lives in its own Supabase-free module.
export { setRememberMe, getRememberMe } from './rememberMe'
