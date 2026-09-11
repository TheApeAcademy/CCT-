import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Gentle idle float for a feature-intro hero illustration - one subtle,
 * continuous idea rather than a pile of effects (doc's "controlled
 * energy" rule). Disabled entirely under prefers-reduced-motion.
 */
export default function FloatingArt({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      animate={reduced ? undefined : { y: [0, -14, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
      transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}
