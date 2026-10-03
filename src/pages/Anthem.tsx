import { useEffect, useState } from 'react'
import { Music } from 'lucide-react'
import { playClick } from '../lib/sound'
import PublicShell from '../components/public/PublicShell'
import { card, display, label } from '../components/public/kit'

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

const EQ = Array.from({ length: 14 }, (_, i) => ({ d: (0.5 + ((i * 37) % 7) / 10).toFixed(2), dl: (-((i * 13) % 9) / 10).toFixed(2) }))

export default function Anthem() {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  // There is no recorded track yet, so "play" reads the words aloud with the
  // device voice, and the disc and equaliser move while it does.
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
    <PublicShell eyebrow="Anthem" title="Sing it loud" sub="The MFM Children’s Ministry anthem." accent="#c13bff">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 20, marginTop: 30, alignItems: 'start' }}>
        <div style={{ padding: 26, borderRadius: 30, background: 'linear-gradient(160deg,#6d1b8f,#2a0d4a)', color: '#fff', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto', borderRadius: '50%', background: 'conic-gradient(from 0deg,#c13bff,#ffd84d,#ff4fa3,#c13bff)', animation: 'pb-spin 6s linear infinite', animationPlayState: speaking ? 'running' : 'paused', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 60, height: 60, borderRadius: '50%', background: '#2a0d4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd84d' }}>
              <Music style={{ width: 26, height: 26 }} strokeWidth={2.25} />
            </span>
          </div>
          <p style={{ margin: '20px 0 0', fontFamily: display, fontWeight: 800, fontSize: 26 }}>{TITLE}</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(236,230,250,.7)' }}>{SUBTITLE}</p>
          <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, height: 36, marginTop: 14 }}>
            {EQ.map((e, i) => (
              <span key={i} style={{ width: 6, height: '100%', borderRadius: 4, background: '#ffd84d', transformOrigin: 'bottom', transform: 'scaleY(.35)', animation: `pb-bar ${e.d}s ease-in-out infinite`, animationDelay: `${e.dl}s`, animationPlayState: speaking ? 'running' : 'paused' }} />
            ))}
          </div>
          <button type="button" onClick={sing} style={{ marginTop: 18, padding: '14px 30px', borderRadius: 999, border: 'none', background: '#ffd84d', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {speaking ? 'Stop' : 'Read it aloud'}
          </button>
        </div>
        <div style={{ padding: 26, borderRadius: 30, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={label}>LYRICS</p>
          {VERSES.map((v, i) => (
            <div key={i} style={{ marginTop: i ? 18 : 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(236,230,250,.5)' }}>{v.label}</p>
              {v.lines.map((line, j) => (
                <p key={j} style={{ margin: '2px 0 0', fontSize: 17, lineHeight: 1.6, color: v.label === 'Chorus' ? '#fff' : 'rgba(236,230,250,.82)', fontWeight: v.label === 'Chorus' ? 700 : 500 }}>
                  {line}
                </p>
              ))}
            </div>
          ))}
          <p style={{ ...card, padding: '12px 14px', marginTop: 20, marginBottom: 0, borderRadius: 14, fontSize: 13, lineHeight: 1.55, color: 'rgba(236,230,250,.6)' }}>
            Suggested tune: a bright, bouncy 4/4 melody, around 110 to 120 BPM, so the whole class can clap along. Sheet music and a recorded track can be added by the music team.
          </p>
        </div>
      </div>
    </PublicShell>
  )
}
