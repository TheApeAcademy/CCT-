import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

/**
 * A consistent way back, used on every page except the ones that
 * intentionally replace it with their own confirm-gated exit (live
 * Gameplay's End Turn/End Match, which a plain back button could bypass
 * mid-question) or that have nowhere meaningful to go back to (the landing
 * page itself). Goes to the actual previous page via this tab's browser
 * history when there is one, falling back to the site home only when there
 * isn't (e.g. a direct link or a fresh reload with no history to return to).
 */
export default function BackButton({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const navigate = useNavigate()

  const goBack = () => {
    playNav()
    haptics.tap()
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <button
      onClick={goBack}
      aria-label="Go back"
      title="Go back"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:scale-105 ${
        dark
          ? 'bg-black/60 text-white backdrop-blur hover:bg-black/80'
          : 'border border-[var(--lp-hairline-strong)] bg-white/90 text-[var(--lp-heading)] shadow-lg backdrop-blur hover:bg-white'
      } ${className}`}
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
    </button>
  )
}
