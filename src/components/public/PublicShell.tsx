import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { playClick } from '../../lib/sound'
import '../../design/public.css'
import { display } from './kit'

/** The design's tinted icon square, with a lucide icon inside. */
export function IconTile({ col, size = 48, children }: { col: string; size?: number; children: ReactNode }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 3),
        background: `${col}24`,
        color: col,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

const NAV: [string, string][] = [
  ['/training', 'Training'],
  ['/questions', 'Question Bank'],
  ['/history', 'History'],
  ['/seasons', 'Seasons'],
  ['/anthem', 'Anthem'],
  ['/features', 'Features'],
  ['/safety', 'Safety'],
]

function rng(seed: number) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}
const r = rng(53)
const STARS = Array.from({ length: 36 }, () => ({
  x: +(r() * 100).toFixed(1),
  y: +(r() * 100).toFixed(1),
  s: r() > 0.8 ? 3 : 2,
  d: +(1.6 + r() * 2.6).toFixed(2),
  dl: +(-r() * 3).toFixed(2),
}))

/**
 * The shell every public page shares in the Claude Design handoff: fixed
 * stars, the glass pill header with the seven pages and "Start a quiz", then
 * the page's eyebrow chip, big title and one-line intro. `bare` drops the
 * title block for a screen mid-task, like a practice question.
 */
export default function PublicShell({ eyebrow, title, sub, accent, bare, children }: { eyebrow: string; title: string; sub: ReactNode; accent: string; bare?: boolean; children: ReactNode }) {
  // On a phone the pill row scrolls sideways; bring the current page's pill
  // into view so it is clear where you are.
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navRef.current
    const on = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (nav && on) nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2
  }, [])

  return (
    <div data-dc-screen="public">
      {STARS.map((st, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            borderRadius: '50%',
            background: '#fff',
            animation: `pb-twinkle ${st.d}s ease-in-out infinite`,
            animationDelay: `${st.dl}s`,
            pointerEvents: 'none',
          }}
        />
      ))}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          padding: '12px clamp(12px,2.5vw,28px)',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 8,
            borderRadius: 999,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.12)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <Link
            to="/"
            onClick={() => playClick()}
            style={{
              flexShrink: 0,
              display: 'flex',
              background: '#fff',
              borderRadius: 999,
              padding: '4px 10px',
            }}
          >
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" style={{ height: 30, display: 'block' }} />
          </Link>
          <nav
            ref={navRef}
            className="pb-nav"
            style={{
              position: 'relative',
              flex: 1,
              minWidth: 0,
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
            }}
          >
            {NAV.map(([to, name]) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => playClick()}
                className="pb-navlink"
                style={({ isActive }) => ({
                  flexShrink: 0,
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#1a0f2e' : 'rgba(236,230,250,.75)',
                  fontWeight: 800,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  transition: 'all .2s',
                })}
              >
                {name}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/setup"
            onClick={() => playClick()}
            style={{
              flexShrink: 0,
              padding: '11px 18px',
              borderRadius: 999,
              background: '#ffd84d',
              color: '#1a0f2e',
              fontWeight: 800,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            Start a quiz
          </Link>
        </div>
      </header>

      <main
        style={{
          position: 'relative',
          maxWidth: 1240,
          margin: '0 auto',
          padding: 'clamp(28px,4vw,52px) clamp(12px,2.5vw,28px) 90px',
          animation: 'pb-up .45s both',
        }}
      >
        {!bare && (
          <>
            <span
              style={{
                display: 'inline-flex',
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,.16)',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              {eyebrow}
            </span>
            <h1
              style={{
                margin: '16px 0 0',
                fontFamily: display,
                fontWeight: 800,
                fontSize: 'clamp(42px,6vw,80px)',
                lineHeight: 0.92,
                letterSpacing: '-.045em',
                color: '#fff',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: '14px 0 0',
                maxWidth: 600,
                fontSize: 17,
                lineHeight: 1.6,
              }}
            >
              {sub}
            </p>
          </>
        )}
        {children}
      </main>
    </div>
  )
}
