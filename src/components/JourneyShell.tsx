import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The Bible Journey's three columns: the card of what you are learning on
 * the left, the stepping stones down the middle, the leaderboard and badges
 * on the right. Copied from Duolingo's web layout, which is the reference
 * Banks set for this screen.
 *
 * The shape holds at every width. The old layout only formed three columns
 * from 1280px up and stacked below that, which on a phone read as one very
 * long column - the card, then the stones, then the badges - and lost the
 * whole point of the screen. Here the three columns stay side by side and
 * the narrow cases change how you move between them rather than whether
 * they exist:
 *
 *   >= 1000px  a real grid, both rails sticky beside a scrolling path
 *   640-999px  the same grid with the rails narrowed
 *   < 640px    the three columns become a horizontal snap row, each pane
 *              82% of the screen so the two neighbours peek in at the
 *              edges. It opens on the path and a swipe moves to a rail.
 */
export default function JourneyShell({ left, middle, right }: { left: ReactNode; middle: ReactNode; right: ReactNode }) {
  const row = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  // Open on the path, not on the left rail. Only the snap row scrolls
  // horizontally at all, so on wider screens scrollWidth equals clientWidth
  // and this is a no-op rather than a jump.
  useEffect(() => {
    const el = row.current
    const mid = track.current
    if (!el || !mid) return
    if (el.scrollWidth <= el.clientWidth) return
    el.scrollLeft = mid.offsetLeft - (el.clientWidth - mid.clientWidth) / 2
  }, [])

  return (
    <div ref={row} className="journey-cols">
      <div className="journey-col">{left}</div>
      <div ref={track} className="journey-col journey-col-mid">
        {middle}
      </div>
      <div className="journey-col">{right}</div>
    </div>
  )
}
