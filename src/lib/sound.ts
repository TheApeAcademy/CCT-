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

// Every tone()/noiseBurst() routes through this shared compressor + makeup
// gain instead of straight to the destination. Without it, effects built
// from many overlapping short bursts (applause, cheer) average out quiet on
// small phone speakers even though each individual burst has a healthy peak
// gain - the compressor keeps the busy passages loud and consistent instead
// of letting them blur into a faint wash.
let busInput: AudioNode | null = null
function getBusInput(c: AudioContext): AudioNode {
  if (!busInput) {
    const compressor = c.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-26, c.currentTime)
    compressor.knee.setValueAtTime(18, c.currentTime)
    compressor.ratio.setValueAtTime(9, c.currentTime)
    compressor.attack.setValueAtTime(0.003, c.currentTime)
    compressor.release.setValueAtTime(0.18, c.currentTime)
    const makeupGain = c.createGain()
    makeupGain.gain.setValueAtTime(1.35, c.currentTime)
    compressor.connect(makeupGain)
    makeupGain.connect(c.destination)
    busInput = compressor
  }
  return busInput
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

// ---------- optional real recorded audio, drop-in over the synth ----------
// applause/cheer/oops (and click) can be swapped for a real recorded MP3 by
// simply dropping a file at the path below - no code changes needed. Each
// path is confirmed to actually exist (a HEAD request, checked once and
// cached) before ever being used, so an unset/missing file always falls
// back to the synthesized version below rather than playing silence.
const AUDIO_FILES: Record<string, string> = {
  applause: '/sounds/applause.mp3',
  cheer: '/sounds/cheer.mp3',
  oops: '/sounds/oops.mp3',
  curtain: '/sounds/curtain-open.mp3',
  musicCalm: '/sounds/background-music-calm.mp3',
  musicIntense: '/sounds/background-music-intense.mp3',
}
const audioElements: Record<string, HTMLAudioElement> = {}
const audioAvailability: Record<string, Promise<boolean>> = {}

function checkAudioFile(key: string): Promise<boolean> {
  if (!audioAvailability[key]) {
    audioAvailability[key] = fetch(AUDIO_FILES[key], { method: 'HEAD' })
      // A missing file isn't a real 404 here - both Vercel's catch-all
      // rewrite (vercel.json) and this app's own local preview server
      // answer any unmatched path with a 200 + the index.html shell
      // instead of erroring, so res.ok alone can't tell "the mp3 exists"
      // from "nothing here, have the app instead". The content-type can:
      // a real audio file serves as audio/mpeg (or similar); the SPA
      // fallback always serves text/html.
      .then((res) => res.ok && (res.headers.get('content-type') ?? '').startsWith('audio/'))
      .catch(() => false)
  }
  return audioAvailability[key]
}

/** Plays the real recorded file for `key` if one has been dropped into /public/sounds, otherwise runs `fallback` (the synthesized version). Never plays both. */
function playRecordedOr(key: keyof typeof AUDIO_FILES, fallback: () => void) {
  if (muted) return
  checkAudioFile(key).then((available) => {
    if (!available) return fallback()
    let audio = audioElements[key]
    if (!audio) {
      audio = new Audio(AUDIO_FILES[key])
      audioElements[key] = audio
    }
    audio.currentTime = 0
    audio.play().catch(() => fallback())
  })
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
  gain.connect(getBusInput(c))
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
  gain.connect(getBusInput(c))
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
// startAt lets a caller stagger this behind another sound fired in the same
// instant (e.g. the correct-answer chime) so the two read as two distinct
// events instead of blending into a wash - see reveal() in Gameplay.tsx.
function playApplauseSynth(durationSec = 1.4, startAt = 0) {
  if (muted) return
  // A single upfront burst before the randomized wash - one unmissable
  // "crack" of hands so the effect reads as applause starting immediately,
  // not just a texture that fades in underneath other sounds.
  noiseBurst(startAt, 0.09, 2600, 0.5, 'bandpass')
  noiseBurst(startAt, 0.14, 1100, 0.42, 'bandpass')
  const clapCount = Math.round(durationSec * 34)
  for (let i = 0; i < clapCount; i++) {
    const t = startAt + Math.random() * durationSec
    noiseBurst(t, 0.06 + Math.random() * 0.05, 2200 + Math.random() * 2800, 0.32 + Math.random() * 0.14, 'bandpass')
  }
  // A few louder, lower-pitched thumps on top of the wash so it reads as
  // clapping hands rather than just static/fizz.
  const thumpCount = Math.round(durationSec * 10)
  for (let i = 0; i < thumpCount; i++) {
    const t = startAt + Math.random() * durationSec
    noiseBurst(t, 0.1 + Math.random() * 0.05, 900 + Math.random() * 500, 0.4, 'bandpass')
  }
}

// startAt lets a caller stagger this behind another sound fired in the same
// instant (e.g. the correct-answer chime) so the two read as two distinct
// events instead of blending into a wash - see reveal() in Gameplay.tsx.
// Uses a real recorded /sounds/applause.mp3 if one has been added, else the
// synthesized clap wash above.
export function playApplause(durationSec = 1.4, startAt = 0) {
  playRecordedOr('applause', () => playApplauseSynth(durationSec, startAt))
}

function playCheerSynth(durationSec = 2.2, startAt = 0) {
  playApplauseSynth(durationSec, startAt)
  if (muted) return
  const voices = 22
  for (let i = 0; i < voices; i++) {
    const t = startAt + Math.random() * Math.max(0.1, durationSec - 0.4)
    const base = 500 + Math.random() * 500
    tone(base, t, 0.35 + Math.random() * 0.3, 'sawtooth', 0.2, base * (1.3 + Math.random() * 0.4))
  }
}

/** Applause plus a rising scatter of short pitched tones standing in for a crowd of kids cheering - or a real /sounds/cheer.mp3, if one's been added. */
export function playCheer(durationSec = 2.2, startAt = 0) {
  playRecordedOr('cheer', () => playCheerSynth(durationSec, startAt))
}

function playOopsSynth() {
  noiseBurst(0, 0.15, 350, 0.35, 'lowpass')
  tone(180, 0, 0.2, 'square', 0.26)
  tone(520, 0.1, 0.26, 'sawtooth', 0.26, 280)
  tone(440, 0.32, 0.36, 'sawtooth', 0.24, 190)
}

/** Comedic "wrong answer" sting for a missed question - a short buzzer punch followed by a descending sad-trombone slide, or a real /sounds/oops.mp3 if one's been added. */
export function playOops() {
  playRecordedOr('oops', playOopsSynth)
}

export function playCountIn(step: 3 | 2 | 1 | 0) {
  if (step === 0) {
    tone(880, 0, 0.15, 'triangle', 0.18)
    tone(1318.5, 0.08, 0.35, 'triangle', 0.16)
  } else {
    tone(440 + (3 - step) * 110, 0, 0.18, 'triangle', 0.16)
  }
}

// ---------- background music ----------
// One continuous track for the whole match, start to finish - never
// stopped mid-match. A real recorded track loops with a 3-second
// crossfade instead of native <audio loop> (which just jumps back to 0
// with an audible click at the seam) - see crossfadeLoop below, which
// runs two <audio> elements a beat apart and hands off between them.
// "Intensity" for the last couple of ladder questions is a volume swell
// on top of that (ramped, not an abrupt jump), not a different track
// cutting in. Independent of the SFX mute toggle above (its own on/off)
// since a host might want one without the other.
const CROSSFADE_SEC = 3

let musicMuted = false
let musicRunning = false
let musicTimer: number | null = null
let musicStep = 0
let musicIntensity: 'calm' | 'intense' = 'calm'
let volumeRampId: number | null = null

// The two alternating players for the crossfade loop, and which one is
// currently the audible one - null/unused while running on the synth path.
let playerA: HTMLAudioElement | null = null
let playerB: HTMLAudioElement | null = null
let activeIsA = true
let crossfadeTimer: number | null = null
let crossfadeIntervalId: number | null = null

// Every real recorded track drops in here (in upload order) and the match
// rotates through all of them, crossfading from one straight into the
// next rather than just looping a single file - variety over a long
// match, same "never actually stops" feel. A single track left in here
// alone still works fine: it just crossfades into itself each lap, same
// as the original single-track version of this feature.
const MUSIC_PLAYLIST_KEYS = ['musicIntense', 'musicCalm'] as const
let musicPlaylist: string[] = []
let playlistIndex = 0

const MUSIC_PROGRESSION: number[][] = [
  [261.63, 329.63, 392.0], // C major
  [220.0, 261.63, 329.63], // A minor
  [174.61, 220.0, 261.63], // F major
  [196.0, 246.94, 293.66], // G major
]

const MUSIC_VOLUME = { calm: 0.55, intense: 1 }
// User-controlled multiplier (0-1) on top of the calm/intense preset above,
// driven by the volume slider in the in-game settings panel - separate
// from the calm->intense swell so dragging it doesn't fight that ramp.
let musicVolumeMultiplier = 1

/** What the currently-audible player's volume should be right now, given both the calm/intense preset and the user's own slider. */
function musicTargetVolume(): number {
  return MUSIC_VOLUME[musicIntensity] * musicVolumeMultiplier
}

export function isMusicMuted() {
  return musicMuted
}

export function setMusicMuted(value: boolean) {
  musicMuted = value
  if (playerA) playerA.muted = value
  if (playerB) playerB.muted = value
}

export function getMusicVolume() {
  return musicVolumeMultiplier
}

/** Applied immediately (not ramped) - this is a direct drag on a slider, not an automatic swell. */
export function setMusicVolume(value: number) {
  musicVolumeMultiplier = Math.max(0, Math.min(1, value))
  const audio = activePlayer()
  if (audio) audio.volume = musicTargetVolume()
}

/** Every MUSIC_PLAYLIST_KEYS entry that's actually had a file dropped in, in order - empty if none, meaning fall back to the generative synth progression below. */
async function resolveMusicPlaylist(): Promise<string[]> {
  const available = await Promise.all(MUSIC_PLAYLIST_KEYS.map((key) => checkAudioFile(key)))
  return MUSIC_PLAYLIST_KEYS.filter((_, i) => available[i]).map((key) => AUDIO_FILES[key])
}

function activePlayer(): HTMLAudioElement | null {
  return activeIsA ? playerA : playerB
}

/** Smoothly moves the currently-audible player's volume to `target` over ~1.2s, so intensity reads as the music swelling rather than clipping to full blast instantly. Leaves the idle (pre-loaded, silent) player alone - the next crossfade reads musicIntensity fresh anyway. */
function rampVolume(target: number) {
  const audio = activePlayer()
  if (!audio) return
  if (volumeRampId !== null) window.clearInterval(volumeRampId)
  const steps = 12
  const start = audio.volume
  let i = 0
  volumeRampId = window.setInterval(() => {
    i++
    audio.volume = start + (target - start) * (i / steps)
    if (i >= steps) {
      window.clearInterval(volumeRampId!)
      volumeRampId = null
    }
  }, 100)
}

export function setMusicIntensity(level: 'calm' | 'intense') {
  if (musicIntensity === level) return
  musicIntensity = level
  // The synth path already reads musicIntensity fresh on every bar it
  // schedules - only a recorded track already playing needs its volume moved.
  rampVolume(MUSIC_VOLUME[level] * musicVolumeMultiplier)
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

/**
 * Crossfades from `outgoing` (audible, about to end) into `incoming`
 * (silent, loaded with the next playlist track and primed at time 0) over
 * CROSSFADE_SEC, then swaps which one counts as "active", advances the
 * playlist, and schedules the next handoff off the newly active player -
 * so this rotates through every track forever without ever stopping.
 */
function runCrossfade(outgoing: HTMLAudioElement, incoming: HTMLAudioElement) {
  if (!musicRunning || musicPlaylist.length === 0) return
  const nextIndex = (playlistIndex + 1) % musicPlaylist.length
  const target = musicTargetVolume()
  incoming.src = musicPlaylist[nextIndex]
  incoming.currentTime = 0
  incoming.volume = 0
  incoming.muted = musicMuted
  incoming.play().catch(() => {})
  if (crossfadeIntervalId !== null) window.clearInterval(crossfadeIntervalId)
  const steps = 30
  const stepMs = (CROSSFADE_SEC * 1000) / steps
  let i = 0
  crossfadeIntervalId = window.setInterval(() => {
    i++
    const t = i / steps
    outgoing.volume = target * (1 - t)
    incoming.volume = target * t
    if (i >= steps) {
      window.clearInterval(crossfadeIntervalId!)
      crossfadeIntervalId = null
      outgoing.pause()
      outgoing.currentTime = 0
      activeIsA = !activeIsA
      playlistIndex = nextIndex
      scheduleCrossfade(incoming, outgoing)
    }
  }, stepMs)
}

/** Waits for `current`'s real duration (unknown until its metadata loads) then times the next crossfade to land exactly CROSSFADE_SEC before it would otherwise loop. */
function scheduleCrossfade(current: HTMLAudioElement, next: HTMLAudioElement) {
  if (crossfadeTimer !== null) window.clearTimeout(crossfadeTimer)
  const duration = current.duration
  if (!isFinite(duration) || duration <= CROSSFADE_SEC) {
    crossfadeTimer = window.setTimeout(() => {
      if (musicRunning) scheduleCrossfade(current, next)
    }, 200)
    return
  }
  const msUntilCrossfade = Math.max(0, (duration - CROSSFADE_SEC - current.currentTime) * 1000)
  crossfadeTimer = window.setTimeout(() => runCrossfade(current, next), msUntilCrossfade)
}

/** Starts rotating through every recorded track that's been dropped into /public/sounds for the whole match, otherwise the generative chord progression below. Each one crossfades straight into the next rather than a hard cut back to 0. */
export function startMusic() {
  if (musicRunning) return
  musicRunning = true
  musicStep = 0
  resolveMusicPlaylist().then((list) => {
    if (!musicRunning) return // stopped again before the check resolved
    if (list.length === 0) {
      scheduleMusicBar()
      return
    }
    musicPlaylist = list
    playlistIndex = 0
    activeIsA = true
    playerA = new Audio(list[0])
    playerB = new Audio()
    playerA.muted = musicMuted
    playerB.muted = musicMuted
    playerA.volume = musicTargetVolume()
    playerB.volume = 0
    playerA.play().catch(() => {
      playerA = null
      playerB = null
      scheduleMusicBar()
    })
    scheduleCrossfade(playerA, playerB)
  })
}

export function stopMusic() {
  musicRunning = false
  if (musicTimer !== null) {
    window.clearTimeout(musicTimer)
    musicTimer = null
  }
  if (volumeRampId !== null) {
    window.clearInterval(volumeRampId)
    volumeRampId = null
  }
  if (crossfadeTimer !== null) {
    window.clearTimeout(crossfadeTimer)
    crossfadeTimer = null
  }
  if (crossfadeIntervalId !== null) {
    window.clearInterval(crossfadeIntervalId)
    crossfadeIntervalId = null
  }
  for (const player of [playerA, playerB]) {
    if (player) {
      player.pause()
      player.currentTime = 0
    }
  }
  playerA = null
  playerB = null
  musicPlaylist = []
  playlistIndex = 0
}

/**
 * A movie-trailer-style hit for a big narrative beat (the curtain rising,
 * starting the quiz after ground rules) - a low rising drone building into
 * a sharp low hit, not a light UI chime.
 */
export function playDramaticSting() {
  if (muted) return
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(55, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(115, c.currentTime + 0.85)
  gain.gain.setValueAtTime(0.0001, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 0.65)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.0)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 1.05)

  noiseBurst(0.78, 0.3, 800, 0.3, 'lowpass')
  tone(75, 0.78, 0.4, 'square', 0.24)
  tone(150, 0.78, 0.35, 'sawtooth', 0.16, 55)
}

/**
 * A ~5 second trumpet-style fanfare for the curtain rising - three short
 * announcing notes, a rising run, then a big held final note, all built
 * from layered sawtooth+square+triangle oscillators (a single sine tone
 * reads as a UI beep, not brass) so it lands as an actual musical flourish.
 */
/** Real /sounds/curtain-open.mp3 if one's been added, else the synthesized trumpet fanfare below. */
export function playFanfare() {
  playRecordedOr('curtain', playFanfareSynth)
}

function playFanfareSynth() {
  if (muted) return
  const notes: [number, number, number][] = [
    [392.0, 0, 0.28], // G4
    [392.0, 0.32, 0.28], // G4
    [392.0, 0.64, 0.4], // G4
    [523.25, 1.15, 0.3], // C5
    [659.25, 1.5, 0.3], // E5
    [783.99, 1.85, 0.35], // G5
    [880.0, 2.25, 0.35], // A5
    [1046.5, 2.7, 2.2], // C6 - big held finish
  ]
  notes.forEach(([freq, start, dur]) => {
    tone(freq, start, dur, 'sawtooth', 0.2)
    tone(freq * 1.004, start, dur, 'square', 0.1)
    tone(freq / 2, start, dur, 'triangle', 0.07)
  })
  // Low brass punch underneath the final held note.
  tone(130.81, 2.7, 2.2, 'sawtooth', 0.14)
  noiseBurst(2.68, 0.4, 3200, 0.14, 'highpass')
}
