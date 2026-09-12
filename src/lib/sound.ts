// Synthesized sound engine (Web Audio API), zero external audio assets,
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

/**
 * Creates and resumes the AudioContext. Browsers (especially iOS Safari in
 * installed/standalone mode) only allow audio to start inside a real user
 * gesture, so this is meant to be called directly from the very first
 * pointerdown/click of a session rather than lazily from the first sound.
 */
export function unlockAudio() {
  const c = getCtx()
  if (c.state === 'suspended') c.resume()
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

/**
 * A clock-style "tick" for every second of the question timer. Pitch, volume
 * and rhythm all ramp up as time runs out so it reads as calm -> tense ->
 * alarming without changing the melody, just intensity. Inside the final 3
 * seconds it becomes a sharp two-note alarm chirp instead of a single tick.
 */
export function playTimerTick(secondsLeft: number, totalSeconds: number) {
  if (secondsLeft <= 3) {
    tone(1500, 0, 0.07, 'square', 0.18)
    tone(1900, 0.09, 0.1, 'square', 0.2)
    return
  }
  const urgentWindow = Math.min(totalSeconds, 6)
  if (secondsLeft <= urgentWindow) {
    const urgency = urgentWindow - secondsLeft
    tone(1100 + urgency * 70, 0, 0.06, 'square', 0.14 + urgency * 0.01)
  } else {
    tone(720, 0, 0.04, 'square', 0.06)
  }
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

/**
 * A wash of overlapping hand-claps built from short randomized filtered
 * noise bursts - there's no recorded audio in this codebase (see the file
 * header), so this reads as applause rather than reproducing a real
 * recording of one.
 */
export function playApplause(durationSec = 1.4) {
  if (muted) return
  const clapCount = Math.round(durationSec * 22)
  for (let i = 0; i < clapCount; i++) {
    const t = Math.random() * durationSec
    noiseBurst(t, 0.06 + Math.random() * 0.05, 2200 + Math.random() * 2800, 0.16 + Math.random() * 0.1, 'bandpass')
  }
  // A few louder, lower-pitched thumps on top of the wash so it reads as
  // clapping hands rather than just static/fizz.
  const thumpCount = Math.round(durationSec * 6)
  for (let i = 0; i < thumpCount; i++) {
    const t = Math.random() * durationSec
    noiseBurst(t, 0.1 + Math.random() * 0.05, 900 + Math.random() * 500, 0.22, 'bandpass')
  }
}

/** Applause plus a rising scatter of short pitched tones standing in for a crowd of kids cheering. */
export function playCheer(durationSec = 2.2) {
  playApplause(durationSec)
  if (muted) return
  const voices = 14
  for (let i = 0; i < voices; i++) {
    const t = Math.random() * Math.max(0.1, durationSec - 0.4)
    const base = 500 + Math.random() * 500
    tone(base, t, 0.35 + Math.random() * 0.3, 'sawtooth', 0.1, base * (1.3 + Math.random() * 0.4))
  }
}

/** Comedic "wrong answer" sting for a missed question - a short buzzer punch followed by a descending sad-trombone slide. */
export function playOops() {
  noiseBurst(0, 0.12, 350, 0.22, 'lowpass')
  tone(180, 0, 0.15, 'square', 0.16)
  tone(520, 0.1, 0.24, 'sawtooth', 0.18, 280)
  tone(440, 0.32, 0.34, 'sawtooth', 0.16, 190)
}

export function playCountIn(step: 3 | 2 | 1 | 0) {
  if (step === 0) {
    tone(880, 0, 0.15, 'triangle', 0.18)
    tone(1318.5, 0.08, 0.35, 'triangle', 0.16)
  } else {
    tone(440 + (3 - step) * 110, 0, 0.18, 'triangle', 0.16)
  }
}

// ---------- background music (generative, still zero audio assets) ----------
// A soft looping chord progression under gameplay, independent of the SFX
// mute toggle above (its own on/off) since a host might want one without
// the other. Self-schedules with setTimeout rather than setInterval so
// there's no drift to correct for, and speeds up + adds a rhythmic tick
// layer for the last couple of ladder questions instead of just looping
// unchanged the whole match.
let musicMuted = false
let musicRunning = false
let musicTimer: number | null = null
let musicStep = 0
let musicIntensity: 'calm' | 'intense' = 'calm'

const MUSIC_PROGRESSION: number[][] = [
  [261.63, 329.63, 392.0], // C major
  [220.0, 261.63, 329.63], // A minor
  [174.61, 220.0, 261.63], // F major
  [196.0, 246.94, 293.66], // G major
]

export function isMusicMuted() {
  return musicMuted
}

export function setMusicMuted(value: boolean) {
  musicMuted = value
}

export function setMusicIntensity(level: 'calm' | 'intense') {
  musicIntensity = level
}

function scheduleMusicBar() {
  if (!musicRunning) return
  const barMs = musicIntensity === 'intense' ? 850 : 1500
  if (!musicMuted) {
    const chord = MUSIC_PROGRESSION[musicStep % MUSIC_PROGRESSION.length]
    const noteGap = barMs / 3200
    chord.forEach((freq, i) => {
      tone(freq, i * noteGap, noteGap * 1.8, 'triangle', musicIntensity === 'intense' ? 0.05 : 0.032)
    })
    tone(chord[0] / 2, 0, (barMs / 1000) * 0.9, 'sine', musicIntensity === 'intense' ? 0.055 : 0.035)
    if (musicIntensity === 'intense') {
      noiseBurst(barMs / 2000, 0.03, 4200, 0.035, 'highpass')
    }
  }
  musicStep++
  musicTimer = window.setTimeout(scheduleMusicBar, barMs)
}

export function startMusic() {
  if (musicRunning) return
  musicRunning = true
  musicStep = 0
  scheduleMusicBar()
}

export function stopMusic() {
  musicRunning = false
  if (musicTimer !== null) {
    window.clearTimeout(musicTimer)
    musicTimer = null
  }
}
