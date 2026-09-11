import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'

/**
 * A slim, colourful progress rail under the header that fills as the
 * visitor scrolls the feature journey - a small, constant piece of scroll
 * interaction rather than a one-off effect buried in a single section.
 */
export default function ScrollProgressBar() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })

  if (reduced) return null

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, var(--lp-accent-compete), var(--lp-accent-bible), var(--lp-accent-achievements), var(--lp-accent-leaderboard))',
      }}
    />
  )
}
