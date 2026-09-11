import { useEffect, useState } from 'react'

export type LandingTheme = 'light' | 'dark'

const STORAGE_KEY = 'landing-theme'

function systemPreference(): LandingTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readStored(): LandingTheme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

/**
 * Landing-page-only theme state. Deliberately not global: every other route
 * (quiz, portals, admin) has no toggle and always renders the app's plain
 * dark tokens, so this never touches <html>/<body> - callers apply it via
 * data-landing-theme on the page's own wrapper element instead.
 */
export function useLandingTheme() {
  const [theme, setTheme] = useState<LandingTheme>(() => readStored() ?? systemPreference())

  useEffect(() => {
    if (readStored()) return // user already made an explicit choice, don't override it
    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'light' : 'dark')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

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
