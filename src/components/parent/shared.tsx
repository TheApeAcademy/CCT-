import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import type { ChildRow } from '../../lib/ministry'
import { display, KID_COLOURS, useSky } from './kit'
import { setLandingTheme } from '../../lib/landingTheme'
import { playClick } from '../../lib/sound'
import '../../design/parent.css'

// Shared pieces of the parent pages from the Claude Design handoff.

/** The child's approved picture, or their first letter on their colour. */
export function KidAvatar({ child, i, size, radius, font, ring }: { child: ChildRow; i: number; size: number; radius: number; font: number; ring?: boolean }) {
  const box = { width: size, height: size, borderRadius: radius, flexShrink: 0, border: ring ? '3px solid rgba(255,255,255,.7)' : undefined } as const
  if (child.avatar_url) return <img src={child.avatar_url} alt="" style={{ ...box, objectFit: 'cover', display: 'block' }} />
  return (
    <span style={{ ...box, background: KID_COLOURS[i % KID_COLOURS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 800, fontSize: font, color: '#fff' }}>
      {(child.full_name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}

const pill = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px 10px 12px', borderRadius: 999, fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' } as const

/** "← Parent Portal", the way every parent sub-page leads back. */
export function BackToPortal({ solid }: { solid?: boolean }) {
  return (
    <Link to="/parent" onClick={() => playClick()} className="pp-ghost" style={{ ...pill, border: '1px solid var(--hair2)', background: solid ? '#fff' : 'transparent', color: 'var(--ink)' }}>
      <ArrowLeft style={{ width: 16, height: 16 }} strokeWidth={2.25} />
      Parent Portal
    </Link>
  )
}

export function SkyToggle() {
  const sky = useSky()
  const Icon = sky === 'day' ? Moon : Sun
  return (
    <button
      type="button"
      aria-label="Switch light or dark"
      onClick={() => {
        playClick()
        setLandingTheme(sky === 'day' ? 'dark' : 'light')
      }}
      style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--hair2)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon style={{ width: 18, height: 18 }} strokeWidth={2} />
    </button>
  )
}

/** Take-Home Sunday and the calendar: back link and sky toggle in a sticky bar. */
export function SkyPage({ page, children }: { page: string; children: ReactNode }) {
  const sky = useSky()
  return (
    <div data-dc-screen="parent" data-page={page} data-sky={sky} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--body)', transition: 'background .5s,color .5s' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, padding: '12px clamp(12px,2.5vw,32px)', background: 'var(--hdr)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--hair)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <BackToPortal />
          <SkyToggle />
        </div>
      </header>
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(24px,3.5vw,44px) clamp(12px,2.5vw,32px) 80px' }}>{children}</main>
    </div>
  )
}
