import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right' | 'none'

const DISTANCE = 28

function variantsFor(direction: Direction, reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
  }
  const offset =
    direction === 'up' ? { y: DISTANCE } : direction === 'left' ? { x: -DISTANCE } : direction === 'right' ? { x: DISTANCE } : {}
  return {
    hidden: { opacity: 0, ...offset },
    show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
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
