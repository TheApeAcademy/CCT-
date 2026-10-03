import { useEffect, useRef, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GameConfig } from '../db/types'
import { playNav, playWhoosh, playClick, playDramaticSting, playFanfare } from '../lib/sound'
import { haptics } from '../lib/haptics'
import QuizStage from '../components/quizshow/QuizStage'
import { display, ghostBtn, goldBtn } from '../components/quizshow/kit'

const RULES = [
  'Listen carefully while the question is being read aloud.',
  'Wait for the host to say "go" before you answer, no shouting out early.',
  'Cheer for every team, winners and friends, kind words only.',
  "One team talks at a time. If it's not your turn, cheer quietly.",
  "It's okay to get one wrong! Every question is a chance to learn something new about God's word.",
  'Have fun and remember whose you are while you play.',
]

/**
 * Every voice on the device, waiting once for the async 'voiceschanged'
 * event if the list isn't populated yet (Chrome in particular loads it
 * lazily) instead of just returning whatever getVoices() has synchronously.
 */
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      resolve(existing)
      return
    }
    const handle = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handle)
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', handle)
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handle)
      resolve(window.speechSynthesis.getVoices())
    }, 500)
  })
}

/**
 * The OS default voice most browsers fall back to reads flat and robotic.
 * Ranks whatever voices the device actually has toward the natural-sounding
 * ones (labelled Natural/Neural/Enhanced, or known good system voices)
 * instead - still plain Web Speech API, so the quiz stays fully offline.
 */
function pickNaturalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const pool = english.length ? english : voices
  const rank = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase()
    if (/natural|neural|enhanced|premium/.test(name)) return 0
    if (/google/.test(name)) return 1
    if (/samantha|karen|daniel|serena|aria|zira/.test(name)) return 2
    if (v.localService) return 3
    return 4
  }
  return [...pool].sort((a, b) => rank(a) - rank(b))[0]
}

export default function GroundRules() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state as GameConfig | undefined

  // Which rule is being read aloud right now: -1 before reading starts.
  const [ruleI, setRuleI] = useState(-1)
  const [speaking, setSpeaking] = useState(false)
  const speakingRef = useRef(false)

  useEffect(() => {
    if (!config) navigate('/setup', { replace: true })
  }, [config, navigate])

  useEffect(() => {
    playFanfare()
    playWhoosh()
    return () => {
      speakingRef.current = false
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  if (!config) return null

  const stop = () => {
    speakingRef.current = false
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  // Each rule is spoken on its own so the card being read lights up, the
  // same natural-voice pick as before, still plain Web Speech and offline.
  const readAloud = async () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) return stop()
    playClick()
    haptics.tap()
    const voice = pickNaturalVoice(await getVoicesAsync())
    window.speechSynthesis.cancel()
    speakingRef.current = true
    setSpeaking(true)
    const lines = [`Welcome to ${config.setName}. Before we begin, here are our ground rules.`, ...RULES.map((r, i) => `Rule ${i + 1}. ${r}`), "Let's begin!"]
    const say = (i: number) => {
      if (!speakingRef.current) return
      if (i >= lines.length) return stop()
      setRuleI(i === 0 ? -1 : Math.min(i - 1, RULES.length - 1))
      const u = new SpeechSynthesisUtterance(lines[i])
      if (voice) u.voice = voice
      u.rate = 0.95
      u.onend = () => window.setTimeout(() => say(i + 1), 300)
      u.onerror = () => stop()
      window.speechSynthesis.speak(u)
    }
    say(0)
  }

  const beginQuiz = () => {
    stop()
    playDramaticSting()
    playNav()
    haptics.success()
    navigate('/play', { state: config })
  }

  return (
    <QuizStage step="rules">
      <div style={{ width: '100%', maxWidth: 880, margin: '0 auto', textAlign: 'center', animation: 'qs-up .5s both' }}>
        <p style={{ margin: '20px 0 0', fontSize: 13, fontWeight: 800, letterSpacing: '.2em', color: '#ffd84d' }}>BEFORE WE BEGIN</p>
        <h1 style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(44px,7vw,92px)', lineHeight: 0.92, letterSpacing: '-.045em', color: '#fff' }}>Ground Rules</h1>
        <p style={{ margin: '12px 0 0', fontSize: 16, color: 'rgba(236,230,250,.6)' }}>{config.setName}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28, textAlign: 'left' }}>
          {RULES.map((t, i) => {
            const on = ruleI === i
            const idle = ruleI < 0
            return (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', borderRadius: 22, background: on ? 'rgba(255,216,77,.14)' : 'rgba(255,255,255,.05)', border: `1px solid ${on ? '#ffd84d' : 'rgba(255,255,255,.1)'}`, opacity: idle || on || i < ruleI ? 1 : 0.45, transform: `scale(${on ? 1.03 : 1})`, transition: 'all .5s cubic-bezier(.34,1.56,.64,1)', animation: 'qs-up .5s both', animationDelay: `${i * 80}ms` }}
              >
                <span style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 16, background: on || idle ? '#ffd84d' : 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 800, fontSize: 22, color: '#1a0f2e' }}>{i + 1}</span>
                <span style={{ fontSize: 'clamp(17px,2.2vw,22px)', fontWeight: 700, lineHeight: 1.4, color: '#fff' }}>{t}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
          <button type="button" onClick={readAloud} style={ghostBtn}>
            {speaking ? <Square style={{ width: 18, height: 18 }} /> : <Volume2 style={{ width: 18, height: 18 }} />}
            {speaking ? 'Stop' : 'Read aloud'}
          </button>
          <button type="button" className="qs-gold" onClick={beginQuiz} style={goldBtn}>
            Let’s play!
          </button>
        </div>
      </div>
    </QuizStage>
  )
}
