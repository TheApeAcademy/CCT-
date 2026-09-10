import type { ReactNode } from 'react'
import { useInView } from '../lib/useInView'

/** One-shot fade/rise-in wrapper for landing-page sections and cards. */
export default function Reveal({
  children,
  delayMs = 0,
  className = '',
}: {
  children: ReactNode
  delayMs?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`mfm-reveal${inView ? ' is-visible' : ''} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}
