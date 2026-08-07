import { useMemo } from 'react'

// Theatrical animated backdrop: two slow-sweeping stage "spotlights" plus a
// starfield of gently twinkling sparkles. Pure CSS/SVG, no assets, cheap to
// run so it can stay mounted behind every screen.

export default function StageBackground() {
  const stars = useStars(28)

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="animate-spotlight-1 absolute -left-1/4 -top-1/4 h-[70vmax] w-[70vmax] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.25) 0%, transparent 65%)' }}
      />
      <div
        className="animate-spotlight-2 absolute -right-1/4 top-1/3 h-[60vmax] w-[60vmax] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 65%)' }}
      />
      {stars.map((s, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

function useStars(count: number) {
  return useMemo(() => {
    const stars: { x: number; y: number; size: number; delay: number; duration: number }[] = []
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2.5,
      })
    }
    return stars
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
