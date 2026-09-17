import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Drives a nav bar's hidden/visible state the same way everywhere on the
 * site: hidden after 5s with no scroll/keyboard/pointer activity, or the
 * instant its scroll container scrolls up; visible again the instant it
 * scrolls down. Pass a ref for a bar sitting inside its own scrolling
 * container (e.g. a `sticky` header inside an `overflow-y-auto` div,
 * which never sees `window` scroll events) - omit it to track `window`
 * itself for a normal page-level fixed header.
 */
export function useAutoHideNav(scrollRef?: RefObject<HTMLElement | null>): boolean {
  const [hidden, setHidden] = useState(false)
  const lastYRef = useRef(0)

  useEffect(() => {
    const target: EventTarget = scrollRef?.current ?? window
    const getY = () => (scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY)
    let idleTimer: number | undefined

    lastYRef.current = getY()

    const armIdleTimer = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setHidden(true), 5000)
    }

    const onScroll = () => {
      const y = getY()
      if (y > lastYRef.current + 2) setHidden(false)
      else if (y < lastYRef.current - 2) setHidden(true)
      lastYRef.current = y
      armIdleTimer()
    }

    const onActivity = () => armIdleTimer()

    target.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions)
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    armIdleTimer()

    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.clearTimeout(idleTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef?.current])

  return hidden
}
