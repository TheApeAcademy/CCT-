import { useState } from 'react'
import { playClick } from '../lib/sound'

const TITLE = 'Little Lights, Shining Bright'
const SUBTITLE = "Children's Ministry Anthem"

const VERSES = [
  {
    label: 'Verse 1',
    lines: [
      'We are little lights, shining bright,',
      "Learning God's Word day and night,",
      'From Genesis to Revelation,',
      "We're building faith, one generation.",
    ],
  },
  {
    label: 'Chorus',
    lines: [
      "Sing it loud, sing it clear,",
      "God's love for us is always near,",
      'We will grow, we will stand tall,',
      "Little lights shining for the Lord, one and all!",
    ],
  },
  {
    label: 'Verse 2',
    lines: [
      'With every question, every song,',
      "We learn where we truly belong,",
      "Teachers guide us, hand in hand,",
      "Raising children to take a stand.",
    ],
  },
  {
    label: 'Chorus',
    lines: [
      "Sing it loud, sing it clear,",
      "God's love for us is always near,",
      'We will grow, we will stand tall,',
      "Little lights shining for the Lord, one and all!",
    ],
  },
  {
    label: 'Bridge',
    lines: ['This is our church, this is our home,', 'Never alone, never alone,', 'Hand in hand, heart to heart,', "This is where our story starts!"],
  },
]

export default function Anthem() {
  const [speaking, setSpeaking] = useState(false)

  const sing = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = `${TITLE}. ${VERSES.map((v) => v.lines.join(', ')).join('. ')}`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.pitch = 1.2
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    playClick()
  }

  return (
    <div data-landing-theme="light" className="site-light-theme lp-page full-bleed px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div>
        <p className="text-4xl">🎶🧒🎤</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{TITLE}</h1>
        <p className="mt-1 text-[var(--ink-muted)]">{SUBTITLE}</p>
      </div>

      <button onClick={sing} className="btn-solid px-6 py-3 text-base">
        {speaking ? '⏹ Stop' : '🔊 Read the Anthem Aloud'}
      </button>

      <div className="panel space-y-5 p-6 text-left">
        {VERSES.map((v, i) => (
          <div key={i}>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--gold)]/80">{v.label}</p>
            {v.lines.map((line, j) => (
              <p key={j} className="text-lg leading-snug">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-faint)]">
        Suggested tune: a bright, bouncy 4/4 melody (think a simple major-key sing-along, around 110-120 BPM) so the
        whole class can clap along. Sheet music and a recorded track can be added by the music team.
      </p>
      </div>
    </div>
  )
}
