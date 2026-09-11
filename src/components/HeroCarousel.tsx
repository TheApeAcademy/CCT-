import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { gsap } from 'gsap'
import { playClick, playNav } from '../lib/sound'
// Matches the reference site's hero headline typeface (a clean geometric
// grotesk) - scoped to this component's own chunk (Home is lazy-loaded) so
// the offline quiz routes never download it, same reasoning as main.tsx's
// Baloo 2 / Nunito imports for the rest of the app.
import '@fontsource/poppins/800.css'
import '@fontsource/poppins/900.css'

export interface HeroSlide {
  eyebrow: string
  title: string
  body: string
  image: string
  primaryCta: { label: string; to: string }
  secondaryCta?: { label: string; to: string }
  quote?: { text: string; source: string }
}

const AUTOPLAY_MS = 6500

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const contentRefs = useRef<(HTMLDivElement | null)[]>([])

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

  // Layered content choreography: each element in the active slide enters at
  // a slightly offset moment (eyebrow -> accent rule -> title -> body ->
  // quote -> CTAs) rather than one flat fade, so the slide feels directed
  // instead of just cross-faded. The background image/Ken Burns crossfade
  // itself stays on the CSS .hero-slide/.is-active transition below - a
  // separate layer, on purpose.
  useEffect(() => {
    const el = contentRefs.current[index]
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const eyebrow = el.querySelector('[data-hero-el="eyebrow"]')
      const accent = el.querySelector('[data-hero-el="accent"]')
      const title = el.querySelector('[data-hero-el="title"]')
      const body = el.querySelector('[data-hero-el="body"]')
      const quote = el.querySelector('[data-hero-el="quote"]')
      const cta = el.querySelector('[data-hero-el="cta"]')
      const targets = [eyebrow, accent, title, body, quote, cta].filter(Boolean) as Element[]

      if (reduced) {
        gsap.set(targets, { opacity: 1, y: 0, scaleX: 1 })
        return
      }

      gsap.set(targets, { opacity: 0 })
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, 0)
      if (accent) tl.fromTo(accent, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' }, 0.18)
      if (title) tl.fromTo(title, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7 }, 0.1)
      if (body) tl.fromTo(body, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55 }, 0.28)
      if (quote) tl.fromTo(quote, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 0.4)
      if (cta) tl.fromTo(cta, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, quote ? 0.48 : 0.4)
    }, el)

    return () => ctx.revert()
  }, [index])

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
      className="full-bleed relative h-[100vh] min-h-[640px] overflow-hidden sm:h-[100vh]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`hero-slide ${i === index ? 'is-active' : ''}`}
          style={{ ['--hero-slide-image' as string]: `url(${slide.image})` }}
          aria-hidden={i !== index}
        >
          <div
            ref={(el) => {
              contentRefs.current[i] = el
            }}
            className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-16 pt-24 text-center sm:pt-28"
          >
            <p data-hero-el="eyebrow" className="eyebrow text-xs sm:text-sm">
              {slide.eyebrow}
            </p>
            <span data-hero-el="accent" className="hero-accent-bar mt-3 h-[3px] w-14 origin-center rounded-full" />
            <h1
              data-hero-el="title"
              className="hero-title-font mt-5 max-w-5xl text-balance text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              {slide.title}
            </h1>
            <p data-hero-el="body" className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {slide.body}
            </p>

            {slide.quote && (
              <p data-hero-el="quote" className="mx-auto mt-6 max-w-xl text-base italic leading-relaxed text-white/90 sm:text-lg">
                &ldquo;{slide.quote.text}&rdquo;
                <span className="mt-2 block text-sm italic text-white/60 sm:text-base">
                  &mdash; {slide.quote.source}
                </span>
              </p>
            )}

            <div data-hero-el="cta" className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to={slide.primaryCta.to} onClick={() => playClick()} className="hero-btn-solid !px-7 !py-3.5 !text-base uppercase">
                {slide.primaryCta.label}
              </Link>
              {slide.secondaryCta && (
                <Link to={slide.secondaryCta.to} onClick={() => playClick()} className="hero-btn-outline !px-7 !py-3.5 !text-base uppercase">
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
            className="hero-arrow absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center p-3 sm:left-4 sm:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => restart(index + 1)}
            className="hero-arrow absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center p-3 sm:right-4 sm:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={1.75} />
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
