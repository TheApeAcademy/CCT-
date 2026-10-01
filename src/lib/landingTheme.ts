import { useEffect, useState } from 'react'

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

// One value for the whole app, with everyone who reads it subscribed.
//
// This used to be plain useState per caller. Layout, PortalShell and KidsShell
// each held their own copy, so pressing the toggle in the header moved the
// header and left whatever shell was mounted underneath it on the old theme
// until the next full reload. Now there is a single value and every hook
// re-renders together.
let current: LandingTheme = DEFAULT_THEME
let hydrated = false
const listeners = new Set<(t: LandingTheme) => void>()

function ensureHydrated() {
  if (hydrated) return
  hydrated = true
  const stored = readStored()
  if (stored) current = stored
}

export function setLandingTheme(next: LandingTheme) {
  ensureHydrated()
  if (next === current) return
  current = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // storage unavailable (private mode etc) - the theme still works for this session
  }
  for (const listener of listeners) listener(next)
}

/**
 * The app's light/dark state, shared by every surface that offers the toggle.
 *
 * Defaults to light regardless of the visitor's OS preference; only an
 * explicit toggle press changes it, and the choice is remembered. Applied by
 * the caller as `data-landing-theme` on a wrapper element rather than on
 * <html>, so a surface that is deliberately single-theme (the live quiz
 * stage) can simply not apply it.
 */
export function useLandingTheme() {
  const [theme, setTheme] = useState<LandingTheme>(() => {
    ensureHydrated()
    return current
  })

  useEffect(() => {
    // A second tab, or another hook that hydrated first, can have moved the
    // value between this component's first render and this effect.
    if (current !== theme) setTheme(current)
    listeners.add(setTheme)
    return () => {
      listeners.delete(setTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = () => setLandingTheme(current === 'light' ? 'dark' : 'light')

  return { theme, toggle }
}
