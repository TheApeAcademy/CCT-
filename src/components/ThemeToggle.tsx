import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import type { LandingTheme } from '../lib/landingTheme'
import { playToggle } from '../lib/sound'
import { haptics } from '../lib/haptics'

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
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
      </motion.span>
    </button>
  )
}
