import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '@fontsource/share-tech-mono/latin-400.css'
import '../../design/quizshow.css'

export type QuizStep = 'setup' | 'rules' | 'play' | 'results'

const STEPS: [QuizStep, string][] = [
  ['setup', 'Setup'],
  ['rules', 'Rules'],
  ['play', 'Play'],
  ['results', 'Results'],
]

function rng(seed: number) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}
const r = rng(31)
const STARS = Array.from({ length: 50 }, () => ({ x: +(r() * 100).toFixed(1), y: +(r() * 100).toFixed(1), s: r() > 0.8 ? 3 : 2, d: +(1.6 + r() * 2.6).toFixed(2), dl: +(-r() * 3).toFixed(2) }))

/**
 * The Quiz Show stage from the Claude Design handoff: spotlights, stars, the
 * logo and the Setup / Rules / Play / Results steps. While a match is being
 * played the logo is not a link, so a stray tap cannot drop the match; the
 * match's own End Turn / End Match buttons are the way out.
 */
export default function QuizStage({ step, children }: { step: QuizStep; children: ReactNode }) {
  const logo = (
    <span style={{ display: 'flex', background: '#fff', borderRadius: 999, padding: '4px 10px' }}>
      <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 30, display: 'block' }} />
    </span>
  )
  return (
    <div data-dc-screen="quizshow">
      <div aria-hidden="true" style={{ position: 'absolute', left: '10%', top: '-20%', width: '30%', height: '140%', background: 'linear-gradient(180deg,rgba(255,255,255,.08),transparent 70%)', filter: 'blur(30px)', transformOrigin: 'top', animation: 'qs-spot 9s ease-in-out infinite alternate', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', right: '10%', top: '-20%', width: '30%', height: '140%', background: 'linear-gradient(180deg,rgba(193,59,255,.12),transparent 70%)', filter: 'blur(30px)', transformOrigin: 'top', animation: 'qs-spot 11s ease-in-out infinite alternate-reverse', pointerEvents: 'none' }} />
      {STARS.map((st, i) => (
        <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, borderRadius: '50%', background: '#fff', animation: `qs-twinkle ${st.d}s ease-in-out infinite`, animationDelay: `${st.dl}s`, pointerEvents: 'none' }} />
      ))}

      <header style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px clamp(12px,2.5vw,32px)' }}>
        {step === 'play' ? logo : <Link to="/" style={{ display: 'flex' }}>{logo}</Link>}
        <div className="qs-noscroll" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', overflowX: 'auto', minWidth: 0 }}>
          {STEPS.map(([k, label]) => (
            <span key={k} aria-current={k === step ? 'step' : undefined} style={{ padding: '7px 12px', borderRadius: 999, background: k === step ? '#ffd84d' : 'transparent', color: k === step ? '#1a0f2e' : 'rgba(236,230,250,.6)', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', whiteSpace: 'nowrap', transition: 'all .3s' }}>
              {label}
            </span>
          ))}
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 2, flex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', boxSizing: 'border-box', padding: '12px clamp(12px,2.5vw,32px) 40px', display: 'flex', flexDirection: 'column' }}>{children}</main>
    </div>
  )
}
