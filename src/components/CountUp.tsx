import { useEffect, useRef, useState } from 'react'

/** Animates a number counting up from 0 to `value` with an ease-out curve. */
export default function CountUp({ value, durationMs = 1200, className }: { value: number; durationMs?: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, durationMs])

  return <span className={className}>{display.toLocaleString()}</span>
}
