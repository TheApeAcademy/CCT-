// Renders a shareable "digital identity card" PNG for a student, entirely on
// the canvas (no server round trip). Used for download/share from the
// student dashboard.

export interface IdCardData {
  fullName: string
  className: string | null
  points: number
  avatarUrl: string | null
  favoriteVerse: string | null
  favoriteQuote: string | null
  churchName: string
  studentCode: string | null
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function renderIdCardPng(data: IdCardData): Promise<string> {
  const W = 640
  const H = 900
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#312e81')
  bg.addColorStop(0.55, '#581c87')
  bg.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // gold border
  ctx.strokeStyle = '#fde68a'
  ctx.lineWidth = 6
  ctx.strokeRect(14, 14, W - 28, H - 28)

  // header
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fde68a'
  ctx.font = 'bold 26px Georgia, serif'
  ctx.fillText(data.churchName.toUpperCase(), W / 2, 72)
  ctx.font = '18px Georgia, serif'
  ctx.fillStyle = 'rgba(253,230,138,0.75)'
  ctx.fillText('Little Disciples Identity Card', W / 2, 102)

  // avatar
  const avatarCenterY = 240
  const avatarRadius = 110
  ctx.save()
  ctx.beginPath()
  ctx.arc(W / 2, avatarCenterY, avatarRadius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  ctx.clip()
  if (data.avatarUrl) {
    try {
      const img = await loadImage(data.avatarUrl)
      const scale = Math.max((avatarRadius * 2) / img.width, (avatarRadius * 2) / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, W / 2 - w / 2, avatarCenterY - h / 2, w, h)
    } catch {
      // fall through to placeholder
    }
  } else {
    ctx.font = '90px sans-serif'
    ctx.fillStyle = '#fde68a'
    ctx.textBaseline = 'middle'
    ctx.fillText('👤', W / 2, avatarCenterY)
    ctx.textBaseline = 'alphabetic'
  }
  ctx.restore()
  ctx.beginPath()
  ctx.arc(W / 2, avatarCenterY, avatarRadius, 0, Math.PI * 2)
  ctx.lineWidth = 5
  ctx.strokeStyle = '#fde68a'
  ctx.stroke()

  // name
  ctx.font = 'bold 40px "Baloo 2", Georgia, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(data.fullName, W / 2, avatarCenterY + avatarRadius + 60)

  if (data.className) {
    ctx.font = '22px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(data.className, W / 2, avatarCenterY + avatarRadius + 92)
  }

  // points badge
  const badgeY = avatarCenterY + avatarRadius + 130
  ctx.fillStyle = 'rgba(250,204,21,0.15)'
  ctx.beginPath()
  ctx.roundRect(W / 2 - 130, badgeY - 28, 260, 56, 28)
  ctx.fill()
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = '#fde68a'
  ctx.fillText(`👑 ${data.points.toLocaleString()} points`, W / 2, badgeY + 8)

  let y = badgeY + 80
  if (data.favoriteVerse) {
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillStyle = '#fde68a'
    const lines = wrapText(ctx, `"${data.favoriteVerse}"`, W - 100)
    for (const line of lines) {
      y += 28
      ctx.fillText(line, W / 2, y)
    }
    y += 20
  }
  if (data.favoriteQuote) {
    ctx.font = '18px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    const lines = wrapText(ctx, data.favoriteQuote, W - 120)
    for (const line of lines) {
      y += 26
      ctx.fillText(line, W / 2, y)
    }
  }

  if (data.studentCode) {
    ctx.fillStyle = 'rgba(250,204,21,0.12)'
    ctx.beginPath()
    ctx.roundRect(W / 2 - 110, H - 92, 220, 38, 19)
    ctx.fill()
    ctx.font = 'bold 16px sans-serif'
    ctx.fillStyle = '#fde68a'
    ctx.fillText(`Student Code: ${data.studentCode}`, W / 2, H - 68)
  }

  ctx.font = '14px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText('Get it. Believe it. Live it.', W / 2, H - 36)

  return canvas.toDataURL('image/png')
}
