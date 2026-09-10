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

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
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
      className="stage-beams relative h-[480px] overflow-hidden rounded-xl border border-[var(--hairline)] sm:h-[560px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((slide, i) => (
        <div key={i} className={`hero-slide ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index}>
          <div className="flex h-full flex-col justify-end px-6 py-8 sm:px-12 sm:py-12">
            <p className="eyebrow text-sm">{slide.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-balance font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--ink-muted)]">{slide.body}</p>

            {slide.quote && (
              <p className="mt-5 max-w-md border-l-2 border-[var(--gold)]/50 pl-3 text-sm italic text-white/70">
                &ldquo;{slide.quote.text}&rdquo;
                <span className="mt-1 block not-italic text-xs font-bold uppercase tracking-wide text-[var(--gold)]">{slide.quote.source}</span>
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={slide.primaryCta.to} onClick={() => playClick()} className="btn-solid">
                {slide.primaryCta.label}
              </Link>
              {slide.secondaryCta && (
                <Link to={slide.secondaryCta.to} onClick={() => playClick()} className="btn-outline">
                  {slide.secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <div className="absolute right-4 top-4 z-10 flex gap-2 sm:right-6 sm:top-6">
            <button onClick={() => restart(index - 1)} className="hero-arrow" aria-label="Previous slide">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => restart(index + 1)} className="hero-arrow" aria-label="Next slide">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-6 left-6 z-10 flex gap-2 sm:left-12">
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
    <span className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
      <CalendarRange className="h-3.5 w-3.5" />
      {name} active
    </span>
  )
}
