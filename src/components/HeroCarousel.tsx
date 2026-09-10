import { Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { playClick, playNav } from '../lib/sound'

export interface HeroSlide {
  id: string
  eyebrow: string
  title: ReactNode
  description: string
  primaryCta: { label: string; to: string }
  secondaryCta?: { label: string; to: string }
  footnote?: ReactNode
}

const AUTOPLAY_MS = 7000

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const prefersReducedMotion = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (paused || slides.length <= 1 || prefersReducedMotion.current) return
    const t = setTimeout(() => goTo(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [index, paused, goTo, slides.length])

  const slide = slides[index]

  return (
    <div
      className="mfm-hero relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(delta) > 40) (delta < 0 ? next : prev)()
        touchStartX.current = null
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured ministry content"
      tabIndex={0}
    >
      {/* ambient drifting light accents */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-[var(--mfm-purple-500)]/25 blur-[100px] mfm-drift-1" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-[24rem] w-[24rem] rounded-full bg-[var(--mfm-gold)]/20 blur-[110px] mfm-drift-2" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div key={slide.id} className="max-w-2xl animate-page-in">
          <p className="mfm-eyebrow text-[var(--mfm-gold)]">{slide.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/75 sm:text-base">{slide.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={slide.primaryCta.to} onClick={() => playClick()} className="mfm-btn-primary">
              {slide.primaryCta.label}
            </Link>
            {slide.secondaryCta && (
              <Link to={slide.secondaryCta.to} onClick={() => playClick()} className="mfm-btn-secondary">
                {slide.secondaryCta.label}
              </Link>
            )}
          </div>
          {slide.footnote && <div className="mt-8">{slide.footnote}</div>}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 pb-8 sm:px-6">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  goTo(i)
                  playNav()
                }}
                aria-label={`Go to slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === index}
                className={`mfm-hero-dot${i === index ? ' is-active' : ''}`}
              />
            ))}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => {
                prev()
                playClick()
              }}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition hover:border-white/60 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => {
                next()
                playClick()
              }}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition hover:border-white/60 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
