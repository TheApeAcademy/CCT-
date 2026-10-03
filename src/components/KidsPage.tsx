import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Map as MapIcon, Moon, Sun, type LucideIcon } from 'lucide-react'
import { playClick } from '../lib/sound'
import { loadKidsSky, saveKidsSky, type KidsSky } from '../lib/kidsSky'
import { rng, type ConfettiPiece } from '../design/kidsConfetti'
import '../design/kidspage.css'

// The shell every full-page kids' app from the Claude Design handoff shares:
// a page laid over the dashboard with its own scroll, twinkling stars and a
// moon by night, a sun and a drifting cloud by day, and a sticky header with
// the Village link back to the map and the sky toggle.

export function Confetti({ pieces, top = '45%' }: { pieces: ConfettiPiece[]; top?: string }) {
  return (
    <div style={{ position: 'fixed', left: '50%', top, pointerEvents: 'none', zIndex: 100 }}>
      {pieces.map((c, i) => (
        <span
          key={i}
          style={{ position: 'absolute', width: c.s, height: c.h, borderRadius: 3, background: c.col, ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px`, animation: 'kp-burst 1.4s cubic-bezier(.2,.8,.3,1) forwards' } as CSSProperties}
        />
      ))}
    </div>
  )
}

export default function KidsPage({
  label,
  glow,
  starSeed,
  right,
  onExit,
  children,
  overlay,
  width = 1200,
  celestial = true,
  mainPadding = 'clamp(28px,4vw,48px) clamp(12px,2.5vw,28px) 100px',
  starCount = 36,
  page: pageKey,
  mainBorderBox = false,
  backLabel = 'Village',
  backIcon: BackIcon = MapIcon,
  glowAt = '50% 0%',
  sunMoon = { right: '3%', top: 74, size: 80, fixed: false },
}: {
  label: string
  glow: string
  starSeed: number
  right?: ReactNode
  onExit: () => void
  children: ReactNode
  /** Modals and confetti, painted above the page. */
  overlay?: ReactNode
  /** The header and main column width. */
  width?: number
  /** The moon by night and the sun and cloud by day. */
  celestial?: boolean
  mainPadding?: string
  starCount?: number
  /** Marks the page for its own token tweaks in kidspage.css. */
  page?: string
  /** Count the main padding inside its width, as some prototypes do. */
  mainBorderBox?: boolean
  /** The way back: the map by default, My House for the house's own apps. */
  backLabel?: string
  backIcon?: LucideIcon
  /** Where the top glow sits. */
  glowAt?: string
  /** Where the moon (and the sun, 4px larger) hangs. */
  sunMoon?: { right: string; top: number; size: number; fixed: boolean }
}) {
  const [sky, setSky] = useState<KidsSky>(loadKidsSky)
  const [stars] = useState(() => {
    const r = rng(starSeed)
    return Array.from({ length: starCount }, () => ({ x: +(r() * 100).toFixed(1), y: +(r() * 100).toFixed(1), s: r() > 0.8 ? 3 : 2, d: +(1.6 + r() * 2.6).toFixed(2), dl: +(-r() * 3).toFixed(2) }))
  })

  // The page sits over the dashboard, which must not scroll underneath it.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const toggle = () => {
    const next = sky === 'night' ? 'day' : 'night'
    setSky(next)
    saveKidsSky(next)
    playClick()
  }

  const page = (
    <div
      data-dc-screen="kidspage"
      data-sky={sky}
      data-page={pageKey}
      aria-label={label}
      style={
        {
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          ['--glow' as string]: glow,
          background: `radial-gradient(ellipse 60% 40% at ${glowAt},var(--glow),transparent 60%),var(--bg)`,
          color: 'var(--body)',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          WebkitFontSmoothing: 'antialiased',
          transition: 'background .6s,color .6s',
        } as CSSProperties
      }
    >
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {stars.map((st, i) => (
          <span key={i} style={{ position: 'fixed', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, opacity: 'var(--starop)', transition: 'opacity .6s', pointerEvents: 'none' }}>
            <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: '#fff', animation: `kp-twinkle ${st.d}s ease-in-out infinite`, animationDelay: `${st.dl}s` }} />
          </span>
        ))}
        {celestial && (
          <>
            <div style={{ position: sunMoon.fixed ? 'fixed' : 'absolute', right: sunMoon.right, top: sunMoon.top, width: sunMoon.size, height: sunMoon.size, borderRadius: '50%', background: '#fff6d8', boxShadow: `inset ${sunMoon.fixed ? -20 : -22}px -8px 0 #e3d6a8,0 0 60px rgba(255,246,216,.45)`, opacity: 'var(--moonop)', transition: 'opacity .6s', pointerEvents: 'none' }} />
            <div style={{ position: sunMoon.fixed ? 'fixed' : 'absolute', right: sunMoon.right, top: sunMoon.top, width: sunMoon.size + 4, height: sunMoon.size + 4, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%,#ffe98a,#ffc93c)', boxShadow: sunMoon.fixed ? '0 0 0 16px rgba(255,201,60,.2),0 0 80px rgba(255,201,60,.55)' : '0 0 0 16px rgba(255,201,60,.22),0 0 80px rgba(255,201,60,.6)', opacity: 'var(--sunop)', transition: 'opacity .6s', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', inset: 0, opacity: 'var(--sunop)', transition: 'opacity .6s', pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '30%', left: 0, width: 280, height: 80, borderRadius: '50%', background: '#fff', filter: 'blur(16px)', opacity: 0.85, animation: 'kp-drift 80s linear infinite' }} />
            </div>
          </>
        )}

        <header style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px clamp(12px,2.5vw,28px)', background: 'var(--hdr)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--hair)' }}>
          <div style={{ maxWidth: width, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <button
              type="button"
              className="kp-village"
              onClick={() => {
                playClick()
                onExit()
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px 10px 12px', borderRadius: 999, border: '1px solid var(--hair2)', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <BackIcon style={{ width: 18, height: 18 }} strokeWidth={2} />
              {backLabel}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="kp-sky"
                onClick={toggle}
                aria-label="Switch light or dark"
                style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {sky === 'night' ? <Sun style={{ width: 20, height: 20 }} strokeWidth={2} /> : <Moon style={{ width: 20, height: 20 }} strokeWidth={2} />}
              </button>
              {right}
            </div>
          </div>
        </header>

        <main style={{ position: 'relative', zIndex: 1, maxWidth: width, margin: '0 auto', padding: mainPadding, ...(mainBorderBox ? { boxSizing: 'border-box', width: '100%' } : {}) }}>{children}</main>
      </div>
      {overlay}
    </div>
  )

  return createPortal(page, document.body)
}

/** The rounded stat chip that sits beside the sky toggle. */
export function HeaderChip({ bg, col, children }: { bg: string; col: string; children: ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999, background: bg, color: col, fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}>{children}</span>
}
