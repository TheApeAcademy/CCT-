// Prefills the returning-student sign-in form with the last name+passcode
// used on this device, when "Remember me" was checked - pure convenience,
// separate from the session-persistence flag in supabase.ts. Cleared
// whenever "Remember me" is unchecked at sign-in.
const KEY = 'cct-remembered-student'

export interface RememberedStudent {
  fullName: string
  passcode: string
}

export function getRememberedStudent(): RememberedStudent | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as RememberedStudent
  } catch {
    return null
  }
}

export function saveRememberedStudent(student: RememberedStudent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(student))
  } catch {
    // Storage unavailable - the form just won't prefill next time.
  }
}

export function clearRememberedStudent() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clean up if storage isn't available in the first place.
  }
}
