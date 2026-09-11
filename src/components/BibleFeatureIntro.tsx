import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Flame } from 'lucide-react'
import FloatingArt from './FloatingArt'
import Reveal from './Reveal'
import { playClick } from '../lib/sound'
// Same clean grotesk as the hero, reused here (not Baloo 2) to mark this
// as one of the page's calmer, more meaningful sections - see .lp-heading-calm.
import '@fontsource/poppins/700.css'

const VERSE = {
  text: 'Thy word have I hid in mine heart, that I might not sin against thee.',
  source: 'Psalm 119:11',
}

/** Counts up once, the first time it scrolls into view. */
function StreakCount({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const duration = 900
    let frame: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, to])

  return <span ref={ref}>{value}</span>
}

/** Calm, meaningful contrast to the Quiz section - a verse reveal and a streak, not a game. */
export default function BibleFeatureIntro() {
  return (
    <div className="lp-band-tinted-soft full-bleed px-4 py-16 sm:py-24" style={{ ['--card-accent' as string]: 'var(--lp-accent-bible)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal direction="left">
            <FloatingArt className="mx-auto w-48 sm:w-64 lg:w-full lg:max-w-sm">
              <img src="/feature-bible.png" alt="" className="w-full drop-shadow-xl" />
            </FloatingArt>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-bible)' }}>
              Today&apos;s Reading
            </p>
            <h2 className="lp-heading lp-heading-calm mt-3 text-balance text-3xl leading-[1.05] sm:text-5xl">
              Nourish your soul, one verse at a time.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              A short daily reading, right there on the dashboard. Come back tomorrow and the streak keeps growing.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.5 }}
              className="lp-panel mt-6 max-w-md p-5"
              style={{ ['--card-accent' as string]: 'var(--lp-accent-bible)' }}
            >
              <p className="font-display text-base italic leading-relaxed text-[var(--lp-heading)] sm:text-lg">
                &ldquo;{VERSE.text}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--lp-hairline)] pt-3">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--lp-faint)]">{VERSE.source}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold"
                  style={{
                    color: 'var(--lp-accent-bible)',
                    background: 'color-mix(in srgb, var(--lp-accent-bible) 16%, transparent)',
                  }}
                >
                  <Flame className="h-3.5 w-3.5" strokeWidth={2.25} />
                  <StreakCount to={7} /> days
                </span>
              </div>
            </motion.div>

            <div className="mt-7">
              <Link to="/join" onClick={() => playClick()} className="lp-btn-solid !px-6 !py-3 !text-[15px]">
                Start Today&apos;s Reading
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
