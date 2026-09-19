import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right' | 'none'

const DISTANCE = 16

/**
 * A3, from the Awwwards reference: motion starts from a visible resting
 * state. Two things were wrong with the old version.
 *
 * It parked every section at opacity 0 until an observer fired, so the page
 * at rest was blank - that is what a link preview, a screenshot and anyone
 * whose scroll listener has not run yet actually sees, and it is a page that
 * looks broken rather than a page that looks considered.
 *
 * And it slid sections in horizontally, 28px past the right edge, which is
 * what made the whole landing page draggable sideways on a phone. A single
 * short vertical settle reads as more confident than four directions of
 * travel, so `direction` is kept for the call sites but every section now
 * rises the same small distance.
 */
function variantsFor(_direction: Direction, reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 1 }, show: { opacity: 1 } }
  }
  return {
    hidden: { opacity: 0.62, y: DISTANCE },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  }
}

/** Scroll-reveal wrapper: fades/slides a section or card into place once, the first time it enters the viewport. */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as: Component = motion.div,
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
  as?: typeof motion.div
}) {
  const reduced = useReducedMotion()
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      variants={variantsFor(direction, !!reduced)}
      transition={{ delay }}
      className={className}
    >
      {children}
    </Component>
  )
}

/** Wraps a group of children so each direct motion child staggers in after the previous one. */
export function RevealStagger({
  children,
  className,
  staggerMs = 90,
}: {
  children: ReactNode
  className?: string
  staggerMs?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      variants={{ show: { transition: { staggerChildren: reduced ? 0 : staggerMs / 1000 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  direction = 'up',
  className,
}: {
  children: ReactNode
  direction?: Direction
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div variants={variantsFor(direction, !!reduced)} className={className}>
      {children}
    </motion.div>
  )
}
