export type KidsTab =
  | 'home'
  | 'class'
  | 'bible'
  | 'leaderboard'
  | 'profile'
  | 'messages'
  | 'ears'
  | 'game'

export type KidsView = 'map' | 'tab'

// A mobile browser can unload and reload the tab in the background (low
// memory, coming back from another app). Without this, that reload dumps the
// child straight back to the village map instead of wherever they actually
// were.
//
// It lives in its own module, away from StudentPortal, so signing in and
// signing out can clear it without pulling the whole portal in. A stale entry
// is what put a child on the Class tab right after signing in, when a sign in
// should always open on the map.
const KEY = 'mfm-kids-dashboard-state'

const TABS: KidsTab[] = ['home', 'class', 'bible', 'leaderboard', 'profile', 'messages', 'ears', 'game']

export function loadKidsDashboardState(): { tab: KidsTab; view: KidsView } | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if ((parsed?.view === 'map' || parsed?.view === 'tab') && TABS.includes(parsed?.tab)) {
      return { tab: parsed.tab, view: parsed.view }
    }
  } catch {
    // sessionStorage throws in private or locked down browsing - just skip restoring.
  }
  return null
}

export function saveKidsDashboardState(state: { tab: KidsTab; view: KidsView }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // same private browsing case as above
  }
}

export function clearKidsDashboardState() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // same private browsing case as above
  }
}
