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
  return (
    <button
      type="button"
      onClick={() => {
        onToggle()
        playToggle(theme === 'dark')
        haptics.tap()
      }}
      className={`lp-theme-toggle ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span key={theme} className="lp-theme-toggle-icon flex items-center justify-center">
        {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
      </span>
    </button>
  )
}
