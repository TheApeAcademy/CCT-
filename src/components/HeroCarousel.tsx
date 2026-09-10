import { Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react'
import { playClick, playNav } from '../lib/sound'

const MFM_LIVE_URL = 'https://www.mountainoffire.org/live'

export interface HeroSlide {
  id: string
  title: ReactNode
  description?: string
  quote?: { text: string; citation: string }
  cta: { label: string; to: string }
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
      className="mfm-hero relative flex min-h-[78vh] flex-col justify-center overflow-hidden sm:min-h-[86vh]"
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
      {/*
        TODO(content): swap this gradient for a real full-bleed photograph of
        the ministry (congregation / kids' service) once one is supplied -
        the layout below is built to sit on top of a photo + dark overlay.
      */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-[var(--mfm-purple-500)]/25 blur-[100px] mfm-drift-1" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-[24rem] w-[24rem] rounded-full bg-[var(--mfm-gold)]/20 blur-[110px] mfm-drift-2" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
        <div key={slide.id} className="animate-page-in">
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>

          {slide.quote ? (
            <blockquote className="mx-auto mt-6 max-w-2xl text-[15px] italic leading-relaxed text-white/75 sm:text-lg">
              &ldquo;{slide.quote.text}&rdquo;
              <footer className="mt-2 not-italic text-white/55 sm:italic">&mdash; {slide.quote.citation}</footer>
            </blockquote>
          ) : (
            slide.description && (
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-base">{slide.description}</p>
            )
          )}

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={slide.cta.to}
              onClick={() => playClick()}
              className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--mfm-gold)] px-7 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-[var(--mfm-gold)] hover:text-[var(--mfm-gold-ink)]"
            >
              {slide.cta.label}
            </Link>
            <a
              href={MFM_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClick()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--mfm-purple-500)] px-7 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[var(--mfm-shadow-soft)] transition hover:brightness-110"
            >
              <Radio className="h-4 w-4" strokeWidth={2.25} />
              Join Us Live
            </a>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 sm:flex sm:px-8">
            <button
              onClick={() => {
                prev()
                playClick()
              }}
              aria-label="Previous slide"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center text-white/60 transition hover:text-white"
            >
              <ChevronLeft className="h-8 w-8" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => {
                next()
                playClick()
              }}
              aria-label="Next slide"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center text-white/60 transition hover:text-white"
            >
              <ChevronRight className="h-8 w-8" strokeWidth={1.75} />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2 sm:bottom-8">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  goTo(i)
                  playNav()
                }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`mfm-hero-dot${i === index ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
