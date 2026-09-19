import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Users } from 'lucide-react'
import FeatureBand from './FeatureBand'
import { playClick } from '../lib/sound'

/**
 * Belonging + learning + community (design spec's Class Introduction model):
 * a teacher chip, a lecture card, and an assignment card stagger in on
 * scroll around the class photo, then a small "who's here" pulse settles
 * the scene - a lightweight class-in-session moment, not a real roster.
 */
export default function ClassFeatureIntro() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const [online, setOnline] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setOnline(12)
      return
    }
    const t = window.setTimeout(() => setOnline(12), 1400)
    return () => window.clearTimeout(t)
  }, [inView, reduced])

  return (
    <FeatureBand
      photo="/classroom-bible-reading-bg.jpg"
      alt="Children reading Bibles together in a Sunday school classroom"
      side="right"
      accent="var(--lp-accent-class)"
    >
      <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-class)' }}>
        Your Class, Your People
      </p>
      <h2 className="lp-heading mt-3 text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
        Your class. Your people. Your journey.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
        A real teacher, a real classroom, a real group of children to grow with, not a solo app. Sign up and
        there&apos;s already a seat waiting.
      </p>

      {/* The two cards used to be pinned around the edges of a cut-out prop.
          With the prop gone they stand on their own, side by side, which is
          also the first time they have been readable on a phone. */}
      <div ref={ref} className="mt-6 grid gap-3 sm:grid-cols-2">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="lp-panel p-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--lp-faint)]">Today&apos;s Lecture</p>
          <p className="mt-1 text-sm font-bold text-[var(--lp-heading)]">Noah &amp; the Great Flood</p>
        </motion.div>

        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="lp-panel p-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--lp-faint)]">Assignment</p>
          <p className="mt-1 text-sm font-bold text-[var(--lp-heading)]">Memory Verse Checkpoint</p>
        </motion.div>
      </div>

      <motion.p
        initial={reduced ? undefined : { opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
        style={{ background: 'var(--lp-accent-class)', color: '#ffffff' }}
      >
        <Users className="h-3.5 w-3.5" strokeWidth={2.25} />
        {online} in class right now
      </motion.p>

      <div className="mt-7">
        <Link to="/join" onClick={() => playClick()} className="lp-btn-solid !px-6 !py-3 !text-[15px]">
          Enter Your Class
        </Link>
      </div>
    </FeatureBand>
  )
}
