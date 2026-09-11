import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react'
import { playClick, playNav } from '../lib/sound'

export interface HeroSlide {
  eyebrow: string
  title: string
  body: string
  primaryCta: { label: string; to: string }
  secondaryCta?: { label: string; to: string }
  quote?: { text: string; source: string }
}

const AUTOPLAY_MS = 6500

export default function HeroCarousel({ slides, badge }: { slides: HeroSlide[]; badge?: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const goTo = (i: number) => setIndex((i + slides.length) % slides.length)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    timerRef.current = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [slides.length])

  const restart = (next: number) => {
    goTo(next)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) restart(index + (delta < 0 ? 1 : -1))
    touchStartX.current = null
  }

  return (
    <div
      className="hero-photo full-bleed relative -mt-6 h-[86vh] min-h-[520px] overflow-hidden border-b border-[var(--hairline)] sm:h-[88vh] sm:min-h-[620px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((slide, i) => (
        <div key={i} className={`hero-slide ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index}>
          <div className="flex h-full flex-col items-center justify-center px-4 py-20 text-center">
            {i === 0 && badge}
            <p className="eyebrow text-sm">{slide.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-balance font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {slide.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">{slide.body}</p>

            {slide.quote && (
              <p className="mx-auto mt-6 max-w-xl text-base italic text-white/75 sm:text-lg">
                &ldquo;{slide.quote.text}&rdquo;
                <span className="mt-2 block not-italic text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                  &mdash; {slide.quote.source}
                </span>
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to={slide.primaryCta.to} onClick={() => playClick()} className="btn-solid !px-7 !py-3.5 !text-base">
                {slide.primaryCta.label}
              </Link>
              {slide.secondaryCta && (
                <Link to={slide.secondaryCta.to} onClick={() => playClick()} className="btn-outline !px-7 !py-3.5 !text-base">
                  {slide.secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => restart(index - 1)}
            className="hero-arrow absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center sm:left-8 sm:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => restart(index + 1)}
            className="hero-arrow absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center sm:right-8 sm:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  restart(i)
                  playNav()
                }}
                className={`hero-dot ${i === index ? 'is-active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function SeasonBadge({ name }: { name: string }) {
  return (
    <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 bg-[rgba(232,185,35,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
      <CalendarRange className="h-3.5 w-3.5" />
      {name} active
    </span>
  )
}
