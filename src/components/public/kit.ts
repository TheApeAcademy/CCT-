import type { CSSProperties } from 'react'

/** Shared inline styles for the public pages (Public Pages.dc.html). */
export const display = "'Bricolage Grotesque', sans-serif"
export const card: CSSProperties = {
  padding: 24,
  borderRadius: 26,
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.1)',
}
export const cardTitle: CSSProperties = {
  margin: '16px 0 0',
  fontFamily: display,
  fontWeight: 800,
  fontSize: 22,
  color: '#fff',
}
export const cardText: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 15,
  lineHeight: 1.55,
}
export const label: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.14em',
  color: '#ffd84d',
}
export const pill = (on: boolean): CSSProperties => ({
  padding: '10px 14px',
  borderRadius: 999,
  border: `1px solid ${on ? '#ffd84d' : 'rgba(255,255,255,.16)'}`,
  background: on ? '#ffd84d' : 'transparent',
  color: on ? '#1a0f2e' : '#fff',
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})
export const field: CSSProperties = {
  boxSizing: 'border-box',
  padding: '14px 18px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'rgba(0,0,0,.25)',
  color: '#fff',
  fontSize: 15,
}
export const grid = (min: number): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit,minmax(min(100%,${min}px),1fr))`,
  gap: 16,
  marginTop: 30,
})
