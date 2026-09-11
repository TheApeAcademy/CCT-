import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { User } from 'lucide-react'
import FloatingArt from './FloatingArt'
import Reveal from './Reveal'
import { playClick } from '../lib/sound'

const PODIUM = [
  { rank: 2, name: 'Classmate', points: 410, height: 88 },
  { rank: 1, name: 'You', points: 480, height: 128 },
  { rank: 3, name: 'Classmate', points: 360, height: 68 },
] as const

function PodiumPoints({ to, active }: { to: number; active: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
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
  }, [active, to])
  return <>{value}</>
}

/** Celebratory, high-energy - a podium rising into place with ranks and points counting up. */
export default function LeaderboardFeatureIntro() {
  const podiumRef = useRef<HTMLDivElement>(null)
  const inView = useInView(podiumRef, { once: true, margin: '-15% 0px' })
  const reduced = useReducedMotion()

  return (
    <div className="lp-band-tinted full-bleed px-4 py-16 sm:py-24" style={{ ['--card-accent' as string]: 'var(--lp-accent-leaderboard)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal direction="left">
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-leaderboard)' }}>
              Leaderboard
            </p>
            <h2 className="lp-heading mt-3 text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
              Who&apos;s leading this week?
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              Every quiz point counts toward a real class ranking. See exactly where you stand, every time you play.
            </p>
            <div className="mt-7">
              <Link to="/join" onClick={() => playClick()} className="lp-btn-solid !px-6 !py-3 !text-[15px]">
                View Leaderboard
              </Link>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <div className="mx-auto max-w-sm">
              <FloatingArt className="mx-auto w-24 sm:w-28">
                <img src="/feature-leaderboard.png" alt="" className="w-full drop-shadow-xl" />
              </FloatingArt>
              <div ref={podiumRef} className="mt-2 flex w-full items-end justify-center gap-3">
                {PODIUM.map((p) => (
                  <div key={p.rank} className="flex flex-1 flex-col items-center">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold"
                      style={{
                        borderColor: p.rank === 1 ? 'var(--lp-accent-leaderboard)' : 'var(--lp-hairline-strong)',
                        color: 'var(--lp-heading)',
                      }}
                    >
                      <User className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <p className="mt-1.5 text-xs font-bold text-[var(--lp-heading)]">{p.name}</p>
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--lp-accent-leaderboard)' }}>
                      <PodiumPoints to={p.points} active={inView} />
                    </p>
                    <motion.div
                      initial={reduced ? undefined : { height: 0 }}
                      animate={inView ? { height: p.height } : undefined}
                      transition={{ duration: 0.6, delay: p.rank === 1 ? 0.1 : p.rank === 2 ? 0.25 : 0.4, ease: [0.34, 1.2, 0.64, 1] }}
                      className="mt-2 w-full rounded-t-lg"
                      style={{
                        height: reduced ? p.height : undefined,
                        background:
                          p.rank === 1
                            ? 'linear-gradient(180deg, var(--lp-accent-leaderboard), color-mix(in srgb, var(--lp-accent-leaderboard) 60%, transparent))'
                            : 'var(--lp-bg-panel)',
                        border: '1px solid var(--lp-hairline)',
                      }}
                    />
                    <span className="rounded-b-lg bg-[var(--lp-bg-raised)] px-3 py-1 text-sm font-display font-extrabold text-[var(--lp-heading)]">
                      {p.rank}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
