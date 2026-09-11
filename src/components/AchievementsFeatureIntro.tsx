import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock, Trophy, Flame, Star, Award } from 'lucide-react'
import FloatingArt from './FloatingArt'
import Reveal from './Reveal'
import { playClick } from '../lib/sound'

const BADGES = [
  { icon: Trophy, label: 'First Match' },
  { icon: Flame, label: '7-Day Streak' },
  { icon: Star, label: 'Perfect Score' },
  { icon: Award, label: 'Top of Class' },
] as const

const CYCLE_MS = 1600

/** Collectible feel - badges unlock one at a time in a self-playing loop. */
export default function AchievementsFeatureIntro() {
  const reduced = useReducedMotion()
  const [unlocked, setUnlocked] = useState(reduced ? BADGES.length : 0)

  useEffect(() => {
    if (reduced) return
    if (unlocked >= BADGES.length) {
      const resetTimer = window.setTimeout(() => setUnlocked(0), CYCLE_MS * 1.6)
      return () => window.clearTimeout(resetTimer)
    }
    const t = window.setTimeout(() => setUnlocked((u) => u + 1), CYCLE_MS)
    return () => window.clearTimeout(t)
  }, [unlocked, reduced])

  return (
    <div className="lp-band-tinted full-bleed px-4 py-16 sm:py-24" style={{ ['--card-accent' as string]: 'var(--lp-accent-achievements)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal direction="left">
            <FloatingArt className="mx-auto w-48 sm:w-64 lg:w-full lg:max-w-sm">
              <img src="/feature-achievements.png" alt="" className="w-full drop-shadow-xl" />
            </FloatingArt>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-achievements)' }}>
              Achievements
            </p>
            <h2 className="lp-heading mt-3 text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
              Unlock your next achievement.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              Badges for streaks, match wins, and milestones — collected right on your profile for everyone to see.
            </p>

            <div className="mt-7 grid grid-cols-4 gap-3 sm:max-w-md">
              {BADGES.map((badge, i) => {
                const isUnlocked = i < unlocked
                return (
                  <motion.div
                    key={badge.label}
                    animate={isUnlocked && !reduced ? { scale: [1, 1.15, 1] } : undefined}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-colors duration-300"
                      style={{
                        borderColor: isUnlocked ? 'var(--lp-accent-achievements)' : 'var(--lp-hairline)',
                        background: isUnlocked ? 'color-mix(in srgb, var(--lp-accent-achievements) 16%, transparent)' : 'var(--lp-bg-panel)',
                        color: isUnlocked ? 'var(--lp-accent-achievements)' : 'var(--lp-faint)',
                        boxShadow: isUnlocked ? '0 0 0 4px color-mix(in srgb, var(--lp-accent-achievements) 18%, transparent)' : 'none',
                      }}
                    >
                      {isUnlocked ? <badge.icon className="h-6 w-6" strokeWidth={1.75} /> : <Lock className="h-5 w-5" strokeWidth={1.75} />}
                    </span>
                    <span className="text-center text-[10px] font-bold leading-tight text-[var(--lp-faint)]">{badge.label}</span>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-7">
              <Link to="/join" onClick={() => playClick()} className="lp-btn-solid !px-6 !py-3 !text-[15px]">
                See Achievements
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
