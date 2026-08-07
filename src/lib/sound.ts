// Small synthesized sound engine (Web Audio API) so the app needs zero
// external audio assets and works fully offline.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

let muted = false
export function setMuted(value: boolean) {
  muted = value
}
export function isMuted() {
  return muted
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gainPeak = 0.2) {
  if (muted) return
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + start)
  gain.gain.setValueAtTime(0, c.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + duration + 0.05)
}

export function playTick() {
  tone(1200, 0, 0.05, 'square', 0.08)
}

export function playCorrect() {
  tone(523.25, 0, 0.15)
  tone(659.25, 0.12, 0.15)
  tone(783.99, 0.24, 0.3)
}

export function playWrong() {
  tone(200, 0, 0.25, 'sawtooth', 0.15)
  tone(140, 0.15, 0.35, 'sawtooth', 0.15)
}

export function playCheckpoint() {
  tone(523.25, 0, 0.12)
  tone(659.25, 0.1, 0.12)
  tone(783.99, 0.2, 0.12)
  tone(1046.5, 0.3, 0.4)
}

export function playWin() {
  ;[523.25, 587.33, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.35))
}

export function playLifeline() {
  tone(440, 0, 0.1)
  tone(660, 0.08, 0.15)
}

export function playWalkAway() {
  tone(392, 0, 0.15)
  tone(330, 0.12, 0.2)
  tone(262, 0.24, 0.3)
}

export function playCountdownBeep() {
  tone(880, 0, 0.08, 'square', 0.12)
}
