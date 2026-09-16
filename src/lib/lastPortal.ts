// Remembers which portal (student/teacher/admin) was last successfully
// signed into, so an installed home-screen icon can launch straight back
// into it instead of always landing on the public marketing site - see the
// redirect script in index.html, which reads this same key before React
// even boots. Kept as its own Supabase-free module for the same bundle-
// splitting reason as rememberMe.ts: it needs to be readable/writable from
// places that must not pull in the Supabase client eagerly.
const KEY = 'cct-last-portal'

export type PortalKind = 'student' | 'teacher' | 'admin'

export function setLastPortal(kind: PortalKind) {
  try {
    localStorage.setItem(KEY, kind)
  } catch {
    // Private browsing / storage disabled - the redirect is just skipped next launch.
  }
}

export function getLastPortal(): PortalKind | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'student' || value === 'teacher' || value === 'admin' ? value : null
  } catch {
    return null
  }
}

export function clearLastPortal() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignore.
  }
}
