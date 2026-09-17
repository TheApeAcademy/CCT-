import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Check } from 'lucide-react'
import { getCountryForOffset, flagEmoji, type PrayerCountry } from '../content/prayerCountries'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

// Fake continents scattered around the sphere at fixed longitudes (degrees).
// Each one projects to an x position via sin(angle) and foreshortens via
// cos(angle) - the same orthographic trick a real rotating-globe render
// uses, just done by hand with a handful of blobs instead of a texture.
const CONTINENTS = [
  { angle: 0, top: 30, size: 46, color: '#3f9142' },
  { angle: 55, top: 55, size: 34, color: '#2f7a3a' },
  { angle: 110, top: 25, size: 38, color: '#4a9a4e' },
  { angle: 160, top: 62, size: 30, color: '#3f9142' },
  { angle: 210, top: 40, size: 42, color: '#2f7a3a' },
  { angle: 265, top: 20, size: 32, color: '#4a9a4e' },
  { angle: 310, top: 58, size: 36, color: '#3f9142' },
]

function Globe({ rotation, onDrag }: { rotation: number; onDrag: (deltaDeg: number) => void }) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  return (
    <div
      className="relative mx-auto h-56 w-56 cursor-grab select-none touch-none rounded-full shadow-2xl active:cursor-grabbing sm:h-64 sm:w-64"
      style={{ background: 'radial-gradient(circle at 35% 30%, #6fc6e8 0%, #2f7fb8 55%, #1a4d75 100%)' }}
      onPointerDown={(e) => {
        dragging.current = true
        lastX.current = e.clientX
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        onDrag(e.clientX - lastX.current)
        lastX.current = e.clientX
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {CONTINENTS.map((c, i) => {
          const rad = ((c.angle + rotation) * Math.PI) / 180
          const x = 50 + Math.sin(rad) * 42
          const depth = Math.cos(rad)
          if (depth < -0.15) return null
          return (
            <div
              key={i}
              className="absolute rounded-[45%]"
              style={{
                left: `${x}%`,
                top: `${c.top}%`,
                width: c.size * Math.max(0.25, depth),
                height: c.size * 0.7,
                background: c.color,
                opacity: Math.max(0.2, depth),
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
      </div>
      {/* glossy highlight sells the sphere volume - fixed, doesn't rotate */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 45%)' }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_-18px_30px_rgba(0,0,0,0.35)]" />
    </div>
  )
}

export default function PrayerGlobe() {
  const [rotation, setRotation] = useState(0)
  const [dayOffset, setDayOffset] = useState(0)
  const [prayed, setPrayed] = useState<Record<string, boolean>>({})
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => {
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setRotation((r) => r + dt * 0.015)
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  useEffect(() => {
    try {
      setPrayed(JSON.parse(localStorage.getItem('prayed_for_world') ?? '{}'))
    } catch {
      setPrayed({})
    }
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const shownDate = new Date(today)
  shownDate.setDate(shownDate.getDate() + dayOffset)
  const dateKey = shownDate.toISOString().slice(0, 10)
  const country: PrayerCountry = getCountryForOffset(today, dayOffset)
  const hasPrayed = !!prayed[dateKey]

  const markPrayed = () => {
    playClick()
    haptics.success()
    const next = { ...prayed, [dateKey]: true }
    setPrayed(next)
    try {
      localStorage.setItem('prayed_for_world', JSON.stringify(next))
    } catch {
      // per-device convenience only - fine if it doesn't persist
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-white/60">Drag the globe, or just let it spin. Everyone praying today lands on the same country.</p>
      <Globe rotation={rotation} onDrag={(d) => setRotation((r) => r + d)} />

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setDayOffset((d) => d - 1)} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="w-36 text-center text-xs font-bold uppercase tracking-wide text-white/70">
          {dayOffset === 0 ? 'Today' : shownDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <button onClick={() => setDayOffset((d) => d + 1)} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dateKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
        >
          <p className="text-4xl">{flagEmoji(country.code)}</p>
          <p className="font-display mt-1 text-lg font-extrabold text-white">{country.name}</p>
          <p className="mt-1 text-sm text-white/70">{country.focus}</p>
          {dayOffset === 0 && (
            <button
              onClick={markPrayed}
              disabled={hasPrayed}
              className="mx-auto mt-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-70"
              style={{ background: hasPrayed ? 'rgba(255,255,255,0.12)' : 'var(--hero-accent)' }}
            >
              {hasPrayed ? <Check className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
              {hasPrayed ? 'Prayed for them today' : 'I prayed for them'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
