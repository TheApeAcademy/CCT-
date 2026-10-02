import { useEffect, useRef, type RefObject } from 'react'
import { isMuted } from '../lib/sound'

/**
 * The motion layer the Claude Design prototypes share, ported as-is:
 *
 * - [data-reveal]  fades, lifts and un-blurs into view once (with optional
 *                  [data-delay] seconds). Anything already on screen at load
 *                  is left alone so the first paint never flashes.
 * - [data-grow]    animates its height from 0 to the given px.
 * - [data-count]   counts up from 0 to its number.
 * - [data-par]     drifts with the pointer by up to N px (parallax).
 * - [data-tilt]    tilts toward the pointer by up to N degrees and exposes
 *                  --mx / --my for a highlight that follows the pointer.
 *
 * Re-scans on every render the caller asks for (pass a changing `dep`), the
 * same as the prototypes' componentDidUpdate hook, so elements that mount
 * later still get the treatment.
 */
export function useDesignFx(root: RefObject<HTMLElement | null>, dep?: unknown) {
  // One observer for the screen's lifetime. Re-scans only add newly mounted
  // nodes to it; tearing it down on every re-scan would orphan anything that
  // was marked seen but had not scrolled into view yet.
  const io = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const countUp = (node: HTMLElement) => {
      const to = Number(node.dataset.count)
      const t0 = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / 1100)
        node.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const node = e.target as HTMLElement
          if (node.dataset.reveal) {
            node.style.opacity = '1'
            node.style.translate = '0 0'
            node.style.filter = 'none'
          }
          if (node.dataset.grow) node.style.height = node.dataset.grow + 'px'
          if (node.dataset.count) countUp(node)
          node.dataset.done = '1'
          obs.unobserve(node)
        }),
      { threshold: 0.12 },
    )
    io.current = obs
    // A remount (StrictMode, HMR) gets a fresh observer: pick back up anything
    // the last one was still waiting on.
    root.current?.querySelectorAll<HTMLElement>('[data-seen]:not([data-done])').forEach((n) => obs.observe(n))
    return () => {
      obs.disconnect()
      io.current = null
    }
  }, [root])

  useEffect(() => {
    const el = root.current
    const obs = io.current
    if (!el || !obs) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    el.querySelectorAll<HTMLElement>('[data-reveal]:not([data-seen])').forEach((node) => {
      node.dataset.seen = '1'
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return
      const d = node.dataset.delay || 0
      node.style.opacity = '0'
      node.style.translate = '0 60px'
      node.style.filter = 'blur(8px)'
      node.style.transition =
        (node.style.transition ? node.style.transition + ',' : '') +
        `opacity .8s ease ${d}s, translate 1s cubic-bezier(.2,.9,.2,1) ${d}s, filter .8s ease ${d}s`
      obs.observe(node)
    })
    el.querySelectorAll<HTMLElement>('[data-grow]:not([data-seen])').forEach((node) => {
      node.dataset.seen = '1'
      node.style.height = '0px'
      obs.observe(node)
    })
    el.querySelectorAll<HTMLElement>('[data-count]:not([data-seen])').forEach((node) => {
      node.dataset.seen = '1'
      node.textContent = '0'
      obs.observe(node)
    })
  }, [root, dep])

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let lastTilt: HTMLElement | null = null
    const onMove = (e: PointerEvent) => {
      const cx = e.clientX / window.innerWidth - 0.5
      const cy = e.clientY / window.innerHeight - 0.5
      el.querySelectorAll<HTMLElement>('[data-par]').forEach((node) => {
        const d = Number(node.dataset.par)
        node.style.transform = `translate(${cx * d}px, ${cy * d}px)`
      })
      const target = e.target as Element | null
      const t = (target?.closest?.('[data-tilt]') as HTMLElement | null) ?? null
      if (lastTilt && lastTilt !== t) lastTilt.style.transform = ''
      if (t && el.contains(t)) {
        const b = t.getBoundingClientRect()
        const k = Number(t.dataset.tilt)
        const x = (e.clientX - b.left) / b.width - 0.5
        const y = (e.clientY - b.top) / b.height - 0.5
        t.style.transform = `perspective(1000px) rotateX(${-y * k}deg) rotateY(${x * k}deg) translateY(-4px)`
        t.style.setProperty('--mx', (x + 0.5) * 100 + '%')
        t.style.setProperty('--my', (y + 0.5) * 100 + '%')
      }
      lastTilt = t
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [root])
}

let ac: AudioContext | null = null

/** The prototypes' little sine "blip" on taps. Silent when the app is muted. */
export function blip(freq = 660) {
  if (isMuted()) return
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ac = ac || new Ctor()
    const o = ac.createOscillator()
    const g = ac.createGain()
    const t = ac.currentTime
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, t)
    o.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.08)
    g.gain.setValueAtTime(0.08, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    o.connect(g).connect(ac.destination)
    o.start(t)
    o.stop(t + 0.15)
  } catch {
    // no audio available - the tap still works
  }
}

/** A seeded generator, so star fields and confetti land the same on every load. */
export function rng(seed: number) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}
