import type { CSSProperties } from 'react'

export const display = "'Bricolage Grotesque', sans-serif"
export const mono = "'Share Tech Mono', ui-monospace, monospace"

/** The design's four team colours first, then more for the bigger matches the app allows. */
const TEAM_COLOURS = ['#ff4fa3', '#4f9bff', '#2fe0b5', '#ffd84d', '#c13bff', '#ff8a3d', '#7a5cff', '#e0405a', '#19c99b', '#9db8ff']
export const teamColour = (i: number) => TEAM_COLOURS[i % TEAM_COLOURS.length]

export const eyebrow: CSSProperties = { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ffd84d' }
export const card: CSSProperties = { padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }
export const goldBtn: CSSProperties = {
  padding: '17px 34px',
  borderRadius: 18,
  border: 'none',
  background: 'linear-gradient(180deg,#ffe066,#f0a400)',
  boxShadow: '0 6px 0 #8a5a00',
  color: '#1a0f2e',
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 18,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
export const ghostBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '15px 22px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,.25)',
  background: 'transparent',
  color: '#fff',
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
