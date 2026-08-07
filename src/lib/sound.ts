// Synthesized sound engine (Web Audio API) — zero external audio assets,
// so every effect works fully offline and ships inside the JS bundle.

let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer
  const length = c.sampleRate * 2
  const buffer = c.createBuffer(1, length, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buffer
  return buffer
}

let muted = false
export function setMuted(value: boolean) {
  muted = value
}
export function isMuted() {
  return muted
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gainPeak = 0.2, glideTo?: number) {
  if (muted) return
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + start)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + start + duration)
  gain.gain.setValueAtTime(0, c.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + duration + 0.05)
}

function noiseBurst(start: number, duration: number, filterFreq: number, gainPeak = 0.2, filterType: BiquadFilterType = 'bandpass') {
  if (muted) return
  const c = getCtx()
  const src = c.createBufferSource()
  src.buffer = getNoiseBuffer(c)
  const filter = c.createBiquadFilter()
  filter.type = filterType
  filter.frequency.setValueAtTime(filterFreq, c.currentTime + start)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, c.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start(c.currentTime + start)
  src.stop(c.currentTime + start + duration + 0.05)
}

// ---------- UI micro-sounds ----------

export function playClick() {
  tone(880, 0, 0.045, 'square', 0.05)
}

export function playToggle(on: boolean) {
  tone(on ? 700 : 500, 0, 0.06, 'triangle', 0.08)
}

export function playNav() {
  tone(600, 0, 0.05, 'sine', 0.06)
  tone(900, 0.03, 0.08, 'sine', 0.06)
}

// ---------- gameplay feedback ----------

export function playTick() {
  tone(1200, 0, 0.05, 'square', 0.08)
}

export function playCountdownBeep(urgency = 0) {
  const freq = 780 + urgency * 60
  tone(freq, 0, 0.09, 'square', 0.14)
}

export function playHeartbeat() {
  tone(90, 0, 0.12, 'sine', 0.22)
  tone(70, 0.15, 0.15, 'sine', 0.16)
}

/** Rapid rising taps while an answer is locked in, building tension before reveal. */
export function playDrumroll(durationSec: number) {
  if (muted) return
  const c = getCtx()
  const startTime = c.currentTime
  const hitCount = Math.round(durationSec / 0.09)
  for (let i = 0; i < hitCount; i++) {
    const t = i * 0.09
    const intensity = 0.1 + (i / hitCount) * 0.18
    noiseBurst(t, 0.06, 2200, intensity, 'bandpass')
  }
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(80, startTime)
  osc.frequency.exponentialRampToValueAtTime(160, startTime + durationSec)
  gain.gain.setValueAtTime(0.05, startTime)
  gain.gain.linearRampToValueAtTime(0.12, startTime + durationSec)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(startTime)
  osc.stop(startTime + durationSec + 0.1)
}

export function playCorrect() {
  tone(523.25, 0, 0.15)
  tone(659.25, 0.12, 0.15)
  tone(783.99, 0.24, 0.35)
  tone(1046.5, 0.34, 0.25, 'triangle', 0.12)
}

export function playWrong() {
  noiseBurst(0, 0.3, 500, 0.18, 'lowpass')
  tone(220, 0, 0.3, 'sawtooth', 0.16, 90)
  tone(160, 0.18, 0.4, 'sawtooth', 0.14, 60)
}

export function playCheckpoint() {
  ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.14))
  noiseBurst(0.35, 0.5, 4000, 0.08, 'highpass')
}

export function playWin() {
  const melody = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5]
  melody.forEach((f, i) => tone(f, i * 0.13, 0.4, 'triangle', 0.16))
  melody.forEach((f, i) => tone(f * 2, i * 0.13 + 0.05, 0.3, 'sine', 0.06))
  noiseBurst(0.9, 0.8, 6000, 0.1, 'highpass')
}

export function playFirework() {
  const c = getCtx()
  if (muted) return
  noiseBurst(0, 0.15, 3000 + Math.random() * 2000, 0.14, 'bandpass')
  const pop = 400 + Math.random() * 400
  tone(pop, 0, 0.08, 'sine', 0.1)
  void c
}

export function playLifeline() {
  tone(440, 0, 0.1)
  tone(660, 0.08, 0.18)
  tone(880, 0.16, 0.15, 'triangle', 0.08)
}

export function playWalkAway() {
  tone(392, 0, 0.15)
  tone(330, 0.12, 0.2)
  tone(262, 0.24, 0.35)
}

export function playWhoosh() {
  noiseBurst(0, 0.35, 1200, 0.12, 'bandpass')
  const c = getCtx()
  if (muted) return
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(400, c.currentTime)
  filter.frequency.exponentialRampToValueAtTime(3000, c.currentTime + 0.3)
}

export function playCountIn(step: 3 | 2 | 1 | 0) {
  if (step === 0) {
    tone(880, 0, 0.15, 'triangle', 0.18)
    tone(1318.5, 0.08, 0.35, 'triangle', 0.16)
  } else {
    tone(440 + (3 - step) * 110, 0, 0.18, 'triangle', 0.16)
  }
}
