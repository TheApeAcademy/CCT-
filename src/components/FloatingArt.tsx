import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

/**
 * Every 3D/illustrated feature image on the page shares this wrapper, so
 * "the images should have animation and interaction" is one systematic
 * upgrade rather than a per-section special case: a gentle idle float, a
 * scroll-linked drift+tilt tied to the image's own position in the
 * viewport (not a generic looping animation), and a tactile hover/tap
 * response so the object feels like an object, not a background decal.
 * Disabled under prefers-reduced-motion, where only the plain image shows.
 */
export default function FloatingArt({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [26, -26])
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5])

  if (reduced) {
    return (
      <div className={className}>
        <div>{children}</div>
      </div>
    )
  }

  return (
    <motion.div ref={ref} className={className} style={{ y, rotate }}>
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.1, rotate: 6, transition: { duration: 0.3, ease: 'easeOut' } }}
        whileTap={{ scale: 0.92, rotate: -6, transition: { duration: 0.2 } }}
        className="cursor-pointer"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
