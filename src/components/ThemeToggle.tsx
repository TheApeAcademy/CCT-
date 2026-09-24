import { Sun, Moon } from 'lucide-react'
import type { LandingTheme } from '../lib/landingTheme'
import { playToggle } from '../lib/sound'
import { haptics } from '../lib/haptics'

// Plain CSS animation, not framer-motion - this renders from Layout.tsx,
// which every route (including the offline quiz) loads eagerly, so it must
// stay dependency-free. framer-motion/gsap stay scoped to Home's own lazy
// chunk (HeroCarousel, Reveal, QuizFeatureIntro).
export default function ThemeToggle({
  theme,
  onToggle,
  className = '',
}: {
  theme: LandingTheme
  onToggle: () => void
  className?: string
}) {
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => {
        onToggle()
        playToggle(isDark)
        haptics.tap()
      }}
      className={`lp-theme-switch ${isDark ? 'is-dark' : ''} ${className}`}
      aria-label={label}
      title={label}
    >
      {/* Both ends of the track stay visible, so the control reads as a
          switch between two states rather than a button showing one. */}
      <Sun className="lp-theme-switch-end is-sun" strokeWidth={2.25} aria-hidden="true" />
      <Moon className="lp-theme-switch-end is-moon" strokeWidth={2.25} aria-hidden="true" />
      <span className="lp-theme-switch-knob" aria-hidden="true">
        <Sun className="lp-theme-switch-knob-icon is-sun" strokeWidth={2.5} />
        <Moon className="lp-theme-switch-knob-icon is-moon" strokeWidth={2.5} />
      </span>
    </button>
  )
}
