// Seeded helpers the kids' pages share: the prototypes' rng() and the
// confetti burst laid out from it, so every visit draws the same burst.

export type ConfettiPiece = { dx: number; dy: number; s: number; h: number; col: string }

export function rng(seed: number) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

export const KIDS_CONFETTI_COLOURS = ['#ffc93c', '#ff4fa3', '#4f7bff', '#2fe0b5', '#c13bff', '#ff8a3d']

export function makeConfetti(seed: number, n = 40) {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const d = 160 + r() * 220
    return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d - 80), s: 8 + Math.round(r() * 6), h: 10 + Math.round(r() * 10), col: KIDS_CONFETTI_COLOURS[i % KIDS_CONFETTI_COLOURS.length] }
  })
}
