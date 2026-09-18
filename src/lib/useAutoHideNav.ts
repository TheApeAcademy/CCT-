import { useEffect, useRef, useState, type RefObject } from 'react'

/** Below this many pixels from the top, the bar is always visible. */
const TOP_ZONE = 80
/** Ignore scroll jitter smaller than this. */
const THRESHOLD = 6

/**
 * Drives a nav bar's hidden/visible state the same way everywhere on the
 * site: it gets out of the way while you are scrolling down the page, and
 * comes straight back the moment you scroll up or reach the top.
 *
 * Two rules matter more than the rest, because breaking either one strands
 * a visitor with no navigation at all:
 *
 *  - Near the top of the page the bar is ALWAYS visible. On a phone the bar
 *    holds the only menu button there is, so a state where it is off-screen
 *    at scrollY 0 is not a hidden bar, it is a site with no navigation.
 *  - Nothing hides the bar except scrolling down. It used to hide itself
 *    after five seconds of no activity, wherever you were on the page, which
 *    meant a fresh phone load quietly slid the header away five seconds after
 *    it appeared and a tap on a menu re-armed the same timer underneath the
 *    open menu.
 *
 * Pass a ref for a bar sitting inside its own scrolling container (e.g. a
 * `sticky` header inside an `overflow-y-auto` div, which never sees `window`
 * scroll events); omit it to track `window` for a normal page-level header.
 * Pass `keepVisible` while something anchored to the bar is open - a
 * dropdown, the mobile menu - so the bar cannot slide out from under it.
 */
export function useAutoHideNav(scrollRef?: RefObject<HTMLElement | null>, keepVisible = false): boolean {
  const [hidden, setHidden] = useState(false)
  const lastYRef = useRef(0)

  useEffect(() => {
    const target: EventTarget = scrollRef?.current ?? window
    const getY = () => (scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY)

    lastYRef.current = getY()

    const onScroll = () => {
      const y = getY()
      if (y <= TOP_ZONE) setHidden(false)
      else if (y > lastYRef.current + THRESHOLD) setHidden(true)
      else if (y < lastYRef.current - THRESHOLD) setHidden(false)
      lastYRef.current = y
    }

    // A resize changes the scroll position under us (a rotation, snapping a
    // window, opening the on-screen keyboard), so the last position we
    // recorded is meaningless afterwards. Show the bar and re-baseline rather
    // than comparing against a number from a different layout.
    const onResize = () => {
      lastYRef.current = getY()
      setHidden(false)
    }

    target.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    onScroll()

    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef?.current])

  useEffect(() => {
    if (keepVisible) setHidden(false)
  }, [keepVisible])

  return hidden && !keepVisible
}
