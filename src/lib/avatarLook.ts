// The drawn avatar from the Claude Design handoff (Avatar Studio.dc.html):
// the options a child picks from, where each part of the face sits (as
// fractions of the picture, exactly as the prototype lays them out), and a
// canvas painter that turns a look into the picture saved as their avatar.

export type AvatarTab = 'skin' | 'hair' | 'hairCol' | 'outfit' | 'acc' | 'bg'
export type AccKey = 'glasses' | 'crown' | 'headphones' | 'circle' | 'star'
export type BgKey = 'Violet' | 'Sunset' | 'Sea' | 'Meadow' | 'Night sky' | 'Rainbow'
export type HairKey = 'short' | 'curly' | 'puffs' | 'long' | 'bald' | 'mohawk'

export interface AvatarLook {
  skin: string
  hair: HairKey
  hairCol: string
  outfit: string
  acc: AccKey | null
  bg: BgKey
}

export const DEFAULT_LOOK: AvatarLook = { skin: '#7b4a2e', hair: 'short', hairCol: '#1c1220', outfit: '#8a1fb0', acc: null, bg: 'Violet' }

export const SKINS: [string, string][] = [
  ['Cocoa', '#5a3420'],
  ['Chestnut', '#7b4a2e'],
  ['Caramel', '#a86b43'],
  ['Honey', '#c98e5e'],
  ['Sand', '#e3b88f'],
  ['Peach', '#f3cfb0'],
]
export const HAIRS: [string, HairKey][] = [
  ['Short', 'short'],
  ['Curly', 'curly'],
  ['Puffs', 'puffs'],
  ['Long', 'long'],
  ['Bald', 'bald'],
  ['Mohawk', 'mohawk'],
]
export const HAIR_COLOURS: [string, string][] = [
  ['Black', '#1c1220'],
  ['Brown', '#4a2a18'],
  ['Auburn', '#8a3a1a'],
  ['Blonde', '#d9a441'],
  ['Purple', '#8a1fb0'],
  ['Mint', '#2fc9a0'],
]
export const CHOIR_ROBE = 'linear-gradient(180deg,#fff,#d9cdf0)'
export const OUTFITS: [string, string][] = [
  ['Purple', '#8a1fb0'],
  ['Sunny', '#f0a400'],
  ['Ocean', '#2a5fd8'],
  ['Mint', '#13b48c'],
  ['Coral', '#e0452a'],
  ['Choir robe', CHOIR_ROBE],
]
export const ACCESSORIES: [string, AccKey | null, string][] = [
  ['None', null, ''],
  ['Glasses', 'glasses', '#1a0f2e'],
  ['Crown', 'crown', '#ffd84d'],
  ['Headphones', 'headphones', '#ff4fa3'],
  ['Halo', 'circle', '#ffe98a'],
  ['Star', 'star', '#ffd84d'],
]
export const BACKGROUNDS: [BgKey, string, string][] = [
  ['Violet', 'radial-gradient(circle at 50% 30%,#d08af0,#6d1b8f)', 'rgba(193,59,255,.8)'],
  ['Sunset', 'radial-gradient(circle at 50% 30%,#ffd84d,#ff6b3d)', 'rgba(255,138,61,.8)'],
  ['Sea', 'radial-gradient(circle at 50% 30%,#7fd6ff,#2a4fb8)', 'rgba(79,123,255,.8)'],
  ['Meadow', 'radial-gradient(circle at 50% 30%,#a6f0c8,#13b48c)', 'rgba(47,224,181,.8)'],
  ['Night sky', 'radial-gradient(circle at 70% 25%,#fff6d8 0 7%,transparent 8%),radial-gradient(circle at 50% 40%,#3a2370,#0d0618)', 'rgba(120,90,220,.8)'],
  ['Rainbow', 'conic-gradient(from 200deg,#ff5b6b,#ffd84d,#2fe0b5,#4f7bff,#c13bff,#ff5b6b)', 'rgba(255,79,163,.8)'],
]

/** Hair: top, height, radius, then the fringe's left, right, height, radius. */
export const HAIR_SHAPES: Record<HairKey, [string, string, string, string, string, string, string]> = {
  short: ['18%', '30%', '50% 50% 20% 20%', '30%', '30%', '10%', '50% 50% 10% 10%'],
  curly: ['12%', '40%', '50%', '27%', '27%', '14%', '50% 50% 30% 30%'],
  puffs: ['14%', '22%', '50%', '30%', '30%', '9%', '50% 50% 20% 20%'],
  long: ['16%', '62%', '50% 50% 30% 30%', '29%', '29%', '12%', '50% 50% 10% 10%'],
  bald: ['24%', '0%', '50%', '50%', '50%', '0%', '0'],
  mohawk: ['8%', '20%', '40% 40% 0 0', '44%', '44%', '10%', '40% 40% 0 0'],
}
/** Accessory: left, width, top. */
export const ACC_SPOT: Record<AccKey, [string, string, string]> = {
  glasses: ['33%', '34%', '36%'],
  crown: ['36%', '28%', '4%'],
  headphones: ['20%', '60%', '18%'],
  circle: ['34%', '32%', '2%'],
  star: ['60%', '18%', '16%'],
}

export function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.round(v * 0.82))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

const LOOK_KEY = 'mfm-avatar-look'
export function loadLook(): AvatarLook {
  try {
    const v = JSON.parse(localStorage.getItem(LOOK_KEY) ?? 'null')
    return v && typeof v === 'object' ? { ...DEFAULT_LOOK, ...v } : DEFAULT_LOOK
  } catch {
    return DEFAULT_LOOK
  }
}
export function saveLook(look: AvatarLook) {
  try {
    localStorage.setItem(LOOK_KEY, JSON.stringify(look))
  } catch {
    // Only so the studio reopens on the same choices; the picture itself is saved to the profile.
  }
}

// ---------------------------------------------------------------------------
// Painting the look onto a canvas, part by part in the prototype's order.
// ---------------------------------------------------------------------------

const pct = (v: string) => parseFloat(v) / 100 || 0

/** A CSS border-radius of percentages as [rx, ry] fractions for each corner, scaled down like CSS when they overlap. */
function corners(radius: string): number[] {
  const p = radius.trim().split(/\s+/).map(pct)
  const [tl, tr, br, bl] = p.length === 1 ? [p[0], p[0], p[0], p[0]] : [p[0], p[1], p[2] ?? p[0], p[3] ?? p[1]]
  const f = Math.min(1, 1 / Math.max(tl + tr, bl + br, tl + bl, tr + br, 1e-9))
  return [tl, tr, br, bl].map((x) => x * f)
}

function roundedBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: string) {
  const [tl, tr, br, bl] = corners(radius)
  ctx.beginPath()
  ctx.moveTo(x + tl * w, y)
  ctx.lineTo(x + w - tr * w, y)
  if (tr) ctx.ellipse(x + w - tr * w, y + tr * h, tr * w, tr * h, 0, -Math.PI / 2, 0)
  ctx.lineTo(x + w, y + h - br * h)
  if (br) ctx.ellipse(x + w - br * w, y + h - br * h, br * w, br * h, 0, 0, Math.PI / 2)
  ctx.lineTo(x + bl * w, y + h)
  if (bl) ctx.ellipse(x + bl * w, y + h - bl * h, bl * w, bl * h, 0, Math.PI / 2, Math.PI)
  ctx.lineTo(x, y + tl * h)
  if (tl) ctx.ellipse(x + tl * w, y + tl * h, tl * w, tl * h, 0, Math.PI, Math.PI * 1.5)
  ctx.closePath()
}

function paintBackground(ctx: CanvasRenderingContext2D, bg: BgKey, S: number) {
  const radial = (cx: number, cy: number, stops: [number, string][]) => {
    const far = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => Math.hypot(x - cx, y - cy))) * S
    const g = ctx.createRadialGradient(cx * S, cy * S, 0, cx * S, cy * S, far)
    for (const [o, c] of stops) g.addColorStop(o, c)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
  }
  const two: Partial<Record<BgKey, [string, string]>> = { Violet: ['#d08af0', '#6d1b8f'], Sunset: ['#ffd84d', '#ff6b3d'], Sea: ['#7fd6ff', '#2a4fb8'], Meadow: ['#a6f0c8', '#13b48c'] }
  if (two[bg]) return radial(0.5, 0.3, [[0, two[bg]![0]], [1, two[bg]![1]]])
  if (bg === 'Night sky') {
    radial(0.5, 0.4, [[0, '#3a2370'], [1, '#0d0618']])
    radial(0.7, 0.25, [[0, '#fff6d8'], [0.07, '#fff6d8'], [0.08, 'rgba(255,246,216,0)'], [1, 'rgba(255,246,216,0)']])
    return
  }
  // Rainbow: CSS starts a conic gradient at 12 o'clock, the canvas at 3.
  const g = ctx.createConicGradient(((200 - 90) * Math.PI) / 180, S / 2, S / 2)
  ;['#ff5b6b', '#ffd84d', '#2fe0b5', '#4f7bff', '#c13bff', '#ff5b6b'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
}

function svgImage(svg: SVGSVGElement, colour: string): Promise<HTMLImageElement> {
  const copy = svg.cloneNode(true) as SVGSVGElement
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copy.setAttribute('stroke', colour)
  copy.setAttribute('width', '240')
  copy.setAttribute('height', '240')
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not draw that extra.'))
    img.src = url
  })
}

/**
 * The look as a square JPEG data URL, ready for the profile. The accessory's
 * shape comes from the icon already drawn on screen, so the saved picture
 * wears exactly what the preview shows.
 */
export async function renderLook(look: AvatarLook, accSvg: SVGSVGElement | null, S = 240): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw your avatar.')
  paintBackground(ctx, look.bg, S)

  const box = (l: number, t: number, w: number, h: number, radius: string, fill: string | CanvasGradient) => {
    roundedBox(ctx, l * S, t * S, w * S, h * S, radius)
    ctx.fillStyle = fill
    ctx.fill()
  }
  const skinShade = shade(look.skin)
  const H = HAIR_SHAPES[look.hair] ?? HAIR_SHAPES.short

  let outfit: string | CanvasGradient = look.outfit
  if (look.outfit === CHOIR_ROBE) {
    const g = ctx.createLinearGradient(0, 0.72 * S, 0, 1.14 * S)
    g.addColorStop(0, '#fff')
    g.addColorStop(1, '#d9cdf0')
    outfit = g
  }
  box(0.18, 0.72, 0.64, 0.42, '50% 50% 0 0', outfit)
  box(0.43, 0.66, 0.14, 0.12, '0', skinShade)
  if (pct(H[1])) box(0.26, pct(H[0]), 0.48, pct(H[1]), H[2], look.hairCol)
  box(0.3, 0.24, 0.4, 0.46, '46% 46% 44% 44%', look.skin)
  box(0.26, 0.42, 0.07, 0.11, '50%', skinShade)
  box(0.67, 0.42, 0.07, 0.11, '50%', skinShade)
  if (pct(H[5])) box(pct(H[3]), 0.22, 1 - pct(H[3]) - pct(H[4]), pct(H[5]), H[6], look.hairCol)
  box(0.39, 0.43, 0.055, 0.07, '50%', '#1a0f2e')
  box(0.555, 0.43, 0.055, 0.07, '50%', '#1a0f2e')
  box(0.35, 0.53, 0.07, 0.04, '50%', 'rgba(255,120,140,.45)')
  box(0.58, 0.53, 0.07, 0.04, '50%', 'rgba(255,120,140,.45)')
  box(0.44, 0.56, 0.12, 0.05, '0 0 50% 50%', '#7a1f2f')

  if (look.acc && accSvg) {
    const colour = ACCESSORIES.find((a) => a[1] === look.acc)?.[2] ?? '#fff'
    const [l, w, t] = ACC_SPOT[look.acc].map(pct)
    const img = await svgImage(accSvg, colour)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,.3)'
    ctx.shadowOffsetY = (4 / 320) * S
    ctx.shadowBlur = (6 / 320) * S
    ctx.drawImage(img, l * S, t * S, w * S, w * S)
    ctx.restore()
  }
  return canvas.toDataURL('image/jpeg', 0.9)
}
