import { useEffect, useState } from 'react'

const MIN_DURATION_MS = 1400

export default function SplashScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const start = Date.now()
    if (!ready) return
    const elapsed = Date.now() - start
    const wait = Math.max(0, MIN_DURATION_MS - elapsed)
    const t = window.setTimeout(() => {
      setFading(true)
      window.setTimeout(onDone, 500)
    }, wait)
    return () => window.clearTimeout(t)
  }, [ready, onDone])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] transition-opacity duration-500 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src="/church-logo.svg"
        alt="MFM Children's Ministry"
        className="animate-number-pop h-40 w-40 rounded-full shadow-2xl shadow-black/50 ring-4 ring-amber-400/40 sm:h-48 sm:w-48"
      />
      <p className="font-display text-xl font-bold tracking-wide text-amber-200 sm:text-2xl">MFM Children's Ministry Bible Quiz</p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 animate-twinkle rounded-full bg-amber-400"
            style={{ animationDelay: `${i * 0.25}s`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
    </div>
  )
}
