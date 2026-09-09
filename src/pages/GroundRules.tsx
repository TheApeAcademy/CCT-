import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GameConfig } from '../db/types'
import { playNav, playWhoosh, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const RULES = [
  'Listen carefully while the question is being read aloud.',
  'Wait for the host to say "go" before you answer, no shouting out early.',
  'Cheer for every team, winners and friends, kind words only.',
  "One team talks at a time. If it's not your turn, cheer quietly.",
  "It's okay to get one wrong! Every question is a chance to learn something new about God's word.",
  'Have fun and remember whose you are while you play.',
]

export default function GroundRules() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state as GameConfig | undefined

  const [open, setOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (!config) navigate('/setup', { replace: true })
  }, [config, navigate])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  if (!config) return null

  const raiseCurtain = () => {
    setOpen(true)
    playWhoosh()
    haptics.tap()
  }

  const readAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = `Welcome to ${config.setName}. Before we begin, here are our ground rules. ${RULES.join(' ')} Let's begin!`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.15
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    playClick()
  }

  const beginQuiz = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    playNav()
    haptics.success()
    navigate('/play', { state: config })
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center overflow-hidden py-8 text-center">
      {/* Stage revealed behind the curtain: a simple children's-church backdrop, CSS only. */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-300/20 to-transparent" />
        <p className="absolute left-1/2 top-10 -translate-x-1/2 text-6xl">⛪</p>
        <p className="absolute bottom-6 left-1/2 w-full -translate-x-1/2 text-4xl tracking-[0.5em]">🧒🧑‍🤝‍🧑👧🧒👦</p>
        <div
          className="animate-spotlight-1 absolute -left-1/4 -top-1/4 h-[60vmax] w-[60vmax] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 65%)' }}
        />
      </div>

      <div className={`relative z-10 space-y-6 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}>
        <div>
          <p className="text-sm uppercase tracking-widest text-amber-300/80">Ground Rules</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Before We Begin...</h1>
          <p className="mt-1 text-white/60">{config.setName}</p>
        </div>

        <ul className="mx-auto max-w-xl space-y-2 rounded-2xl border border-white/10 bg-black/30 p-5 text-left">
          {RULES.map((rule, i) => (
            <li key={i} className="animate-page-in flex items-start gap-3" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="mt-0.5 shrink-0 text-amber-300">✦</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={readAloud}
            className="rounded-2xl bg-white/10 px-6 py-3 font-semibold transition hover:scale-105 hover:bg-white/20"
          >
            {speaking ? '⏹ Stop Reading' : '🔊 Read Rules Aloud'}
          </button>
          <button
            onClick={beginQuiz}
            className="animate-pulse-glow rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-3 font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
          >
            Let's Begin the Quiz! →
          </button>
        </div>
      </div>

      {/* Two velvet curtain panels that part on click, revealing the stage above. */}
      {!open && (
        <button onClick={raiseCurtain} className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center" aria-label="Raise the curtain">
          <div className="curtain-panel curtain-panel-left" />
          <div className="curtain-panel curtain-panel-right" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <p className="text-5xl">🎭</p>
            <p className="font-display text-2xl font-extrabold text-amber-200 drop-shadow-lg">Tap to Raise the Curtain</p>
            <p className="text-sm text-white/70">and reveal the ground rules for {config.setName}</p>
          </div>
        </button>
      )}
      {open && <div className="curtain-panel curtain-panel-left curtain-open-left pointer-events-none z-0" />}
      {open && <div className="curtain-panel curtain-panel-right curtain-open-right pointer-events-none z-0" />}
    </div>
  )
}
