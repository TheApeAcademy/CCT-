import { useReducedMotion } from 'framer-motion'

const DOTS = [
  { color: 'var(--lp-accent-compete)', size: 16, top: '9%', left: '4%', blur: false, delay: 0 },
  { color: 'var(--lp-accent-leaderboard)', size: 11, top: '20%', left: '93%', blur: false, delay: 0.7 },
  { color: 'var(--lp-accent-achievements)', size: 20, top: '80%', left: '7%', blur: true, delay: 1.2 },
  { color: 'var(--lp-accent-training)', size: 9, top: '88%', left: '91%', blur: false, delay: 0.35 },
  { color: 'var(--lp-accent-bible)', size: 13, top: '5%', left: '58%', blur: true, delay: 1.6 },
  { color: 'var(--lp-accent-ears)', size: 10, top: '55%', left: '2%', blur: false, delay: 0.9 },
] as const

/**
 * A handful of small, colourful dots scattered around a feature section's
 * empty margins - mixing several accents from across the page's palette
 * (not just the section's own colour) so the negative space around a
 * feature reads as intentionally playful rather than unfinished. Purely
 * decorative and never intercepts clicks/taps.
 */
export default function ColorSprinkles() {
  const reduced = useReducedMotion()
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="lp-sprinkle"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
            background: d.color,
            filter: d.blur ? 'blur(1.5px)' : undefined,
            animationDelay: `${d.delay}s`,
            animationPlayState: reduced ? 'paused' : 'running',
          }}
        />
      ))}
    </div>
  )
}
