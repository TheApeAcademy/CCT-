// Renders a printable "Certificate of Achievement" PNG entirely on the
// canvas, same approach as idCard.ts - no server round trip, no template
// asset needed. Used by teachers from the class roster (Feature 6).

export interface CertificateData {
  studentName: string
  className: string | null
  teacherName: string
  achievement: string
  churchName: string
  date: string
}

export async function renderCertificatePng(data: CertificateData): Promise<string> {
  const W = 1100
  const H = 780
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#fdfaf3')
  bg.addColorStop(1, '#f6ecd8')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#0b2e1a'
  ctx.lineWidth = 10
  ctx.strokeRect(28, 28, W - 56, H - 56)
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 3
  ctx.strokeRect(46, 46, W - 92, H - 92)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#c9a227'
  ctx.font = 'bold 22px Georgia, serif'
  ctx.fillText(data.churchName.toUpperCase(), W / 2, 118)

  ctx.fillStyle = '#0b2e1a'
  ctx.font = 'bold 52px Georgia, serif'
  ctx.fillText('Certificate of Achievement', W / 2, 192)

  ctx.font = '22px Georgia, serif'
  ctx.fillStyle = '#3d3d3d'
  ctx.fillText('This certificate is proudly presented to', W / 2, 250)

  ctx.font = 'bold 58px "Baloo 2", Georgia, sans-serif'
  ctx.fillStyle = '#0b2e1a'
  ctx.fillText(data.studentName, W / 2, 340)

  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - 220, 362)
  ctx.lineTo(W / 2 + 220, 362)
  ctx.stroke()

  ctx.font = '24px Georgia, serif'
  ctx.fillStyle = '#3d3d3d'
  const lines = wrapCenter(ctx, data.achievement, W - 260)
  let y = 420
  for (const line of lines) {
    ctx.fillText(line, W / 2, y)
    y += 34
  }

  if (data.className) {
    ctx.font = '20px sans-serif'
    ctx.fillStyle = 'rgba(11,46,26,0.7)'
    ctx.fillText(data.className, W / 2, y + 24)
  }

  ctx.font = '18px sans-serif'
  ctx.fillStyle = '#3d3d3d'
  ctx.textAlign = 'left'
  ctx.fillText(data.teacherName, 120, H - 100)
  ctx.strokeStyle = '#0b2e1a'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(120, H - 118)
  ctx.lineTo(360, H - 118)
  ctx.stroke()
  ctx.fillStyle = 'rgba(61,61,61,0.6)'
  ctx.font = '14px sans-serif'
  ctx.fillText('Teacher', 120, H - 78)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#3d3d3d'
  ctx.font = '18px sans-serif'
  ctx.fillText(data.date, W - 120, H - 100)
  ctx.strokeStyle = '#0b2e1a'
  ctx.beginPath()
  ctx.moveTo(W - 360, H - 118)
  ctx.lineTo(W - 120, H - 118)
  ctx.stroke()
  ctx.fillStyle = 'rgba(61,61,61,0.6)'
  ctx.font = '14px sans-serif'
  ctx.fillText('Date', W - 120, H - 78)

  return canvas.toDataURL('image/png')
}

function wrapCenter(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
