// Standalone (zero Supabase import) so App.tsx can check this flag on every
// load - including a fully offline quiz-only visit - without pulling the
// Supabase client into the main bundle just to read a localStorage flag.
// The session itself always persists to localStorage the same as ever
// (see supabase.ts); unchecking "Remember me" at sign-in just means the
// next time the app opens, it signs back out immediately instead of
// resuming that persisted session - see App.tsx's mount effect.
const REMEMBER_KEY = 'cct-remember-me'

export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {
    // Storage unavailable (private mode, quota) - falls back to the
    // always-persistent default, never to being signed out unexpectedly.
  }
}

export function getRememberMe(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_KEY)
    return v === null ? true : v === '1'
  } catch {
    return true
  }
}
