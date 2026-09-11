import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Users } from 'lucide-react'
import FloatingArt from './FloatingArt'
import Reveal from './Reveal'
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
    <div
      className="lp-band-tinted full-bleed px-4 py-16 sm:py-24"
      style={{ ['--card-accent' as string]: 'var(--lp-accent-class)' }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal direction="left">
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-class)' }}>
              Your Class, Your People
            </p>
            <h2 className="lp-heading mt-3 text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
              Your class. Your people. Your journey.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              A real teacher, a real classroom, a real group of kids to grow with — not a solo app. Sign up and
              there&apos;s already a seat waiting.
            </p>
            <div className="mt-7">
              <Link to="/join" onClick={() => playClick()} className="lp-btn-solid !px-6 !py-3 !text-[15px]">
                Enter Your Class
              </Link>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <div ref={ref} className="relative mx-auto max-w-md">
              <FloatingArt className="mx-auto w-52 sm:w-64">
                <img src="/feature-class.png" alt="" className="w-full drop-shadow-xl" />
              </FloatingArt>

              <motion.div
                initial={reduced ? undefined : { opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : undefined}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lp-panel absolute -left-2 top-6 w-44 p-3 sm:-left-6 sm:top-10 sm:w-48"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--lp-faint)]">Today&apos;s Lecture</p>
                <p className="mt-1 text-sm font-bold text-[var(--lp-heading)]">Noah &amp; the Great Flood</p>
              </motion.div>

              <motion.div
                initial={reduced ? undefined : { opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : undefined}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="lp-panel absolute -right-2 bottom-2 w-44 p-3 sm:-right-6 sm:bottom-6 sm:w-48"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--lp-faint)]">Assignment</p>
                <p className="mt-1 text-sm font-bold text-[var(--lp-heading)]">Memory Verse Checkpoint</p>
              </motion.div>

              <motion.div
                initial={reduced ? undefined : { opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : undefined}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="absolute left-1/2 -bottom-5 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg sm:-bottom-6"
                style={{ background: 'var(--lp-accent-class)', color: '#ffffff' }}
              >
                <Users className="h-3.5 w-3.5" strokeWidth={2.25} />
                {online} in class right now
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
