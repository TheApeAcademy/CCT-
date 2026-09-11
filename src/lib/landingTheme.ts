import { useState } from 'react'

export type LandingTheme = 'light' | 'dark'

const STORAGE_KEY = 'landing-theme'
const DEFAULT_THEME: LandingTheme = 'light'

function readStored(): LandingTheme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

/**
 * Landing-page-only theme state, defaulting to light regardless of the
 * visitor's OS preference (only an explicit toggle click overrides it).
 * Deliberately not global: every other route (quiz, portals, admin) has no
 * toggle and always renders the app's plain dark tokens, so this never
 * touches <html>/<body> - callers apply it via data-landing-theme on the
 * page's own wrapper element instead.
 */
export function useLandingTheme() {
  const [theme, setTheme] = useState<LandingTheme>(() => readStored() ?? DEFAULT_THEME)

  const toggle = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // storage unavailable (private mode etc) - theme still works for this session
      }
      return next
    })
  }

  return { theme, toggle }
}
