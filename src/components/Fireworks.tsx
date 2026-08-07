import { useEffect, useRef } from 'react'
import { playFirework } from '../lib/sound'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const COLORS = ['#facc15', '#f472b6', '#60a5fa', '#4ade80', '#a78bfa', '#fb923c', '#f87171', '#34d399']

export default function Fireworks({ active, durationMs = 4000 }: { active: boolean; durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let particles: Particle[] = []
    let running = true
    const startedAt = performance.now()
    let nextBurstAt = 0

    function spawnBurst() {
      if (!canvas) return
      const x = canvas.width * (0.15 + Math.random() * 0.7)
      const y = canvas.height * (0.15 + Math.random() * 0.45)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const count = 34 + Math.floor(Math.random() * 18)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
        const speed = 2.2 + Math.random() * 3
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 50 + Math.random() * 25,
          color,
          size: 2 + Math.random() * 2.5,
        })
      }
      playFirework()
    }

    function frame(now: number) {
      if (!running || !canvas || !ctx) return
      const elapsed = now - startedAt

      if (elapsed >= nextBurstAt && elapsed < durationMs - 400) {
        spawnBurst()
        nextBurstAt = elapsed + 450 + Math.random() * 500
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles = particles.filter((p) => p.life < p.maxLife)
      for (const p of particles) {
        p.vy += 0.045
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.life += 1
        const alpha = Math.max(0, 1 - p.life / p.maxLife)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (elapsed < durationMs || particles.length > 0) {
        requestAnimationFrame(frame)
      }
    }
    const raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [active, durationMs])

  if (!active) return null

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden="true" />
}
