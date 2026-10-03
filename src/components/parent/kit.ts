import { useCallback, useEffect, useState } from 'react'
import { listMyChildren, type ChildRow } from '../../lib/ministry'
import { useLandingTheme } from '../../lib/landingTheme'

// Constants and hooks shared by the parent pages (components live in shared.tsx).

export const display = "'Bricolage Grotesque', sans-serif"
export const KID_COLOURS = ['linear-gradient(135deg,#c13bff,#8a1fb0)', 'linear-gradient(135deg,#ff8a3d,#d12a7a)', 'linear-gradient(135deg,#2fe0b5,#0e9a80)', 'linear-gradient(135deg,#4f7bff,#2a3fb0)']
export const BADGE_COLOURS = ['#e0a400', '#ff8a3d', '#4f7bff', '#d12a7a', '#0e9a80', '#8a1fb0']

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'Your child'

/** The signed-in parent's linked children, with a retry for a failed load. */
export function useLinkedChildren() {
  const [kids, setKids] = useState<ChildRow[] | null>(null)
  const [error, setError] = useState('')
  const reload = useCallback(() => {
    setError('')
    return listMyChildren()
      .then((c) => setKids([...c].sort((a, b) => a.full_name.localeCompare(b.full_name))))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
        setKids((k) => k ?? [])
      })
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return { kids, error, reload }
}

/** Light or dark, shared with the rest of the site's toggle. */
export function useSky() {
  const { theme } = useLandingTheme()
  return theme === 'dark' ? 'night' : 'day'
}
