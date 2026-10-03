import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Circle, Crown, Glasses, Hand, Headphones, Image as ImageIcon, Palette, Scissors, Shirt, Sparkles, Star, type LucideIcon } from 'lucide-react'
import KidsPage from './KidsPage'
import {
  ACC_SPOT,
  ACCESSORIES,
  BACKGROUNDS,
  HAIR_COLOURS,
  HAIR_SHAPES,
  HAIRS,
  OUTFITS,
  SKINS,
  loadLook,
  renderLook,
  saveLook,
  shade,
  type AccKey,
  type AvatarLook,
  type AvatarTab,
} from '../lib/avatarLook'
import { updateMyStudentProfile } from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

// Avatar Studio - Claude Design handoff, Avatar Studio.dc.html. Every item is
// free (the app has no coins). Saving paints the look into a picture and sends
// it as the child's new profile picture, which their teacher sees first, the
// same as an uploaded photo.

const TABS: [AvatarTab, string, LucideIcon][] = [
  ['skin', 'Skin', Hand],
  ['hair', 'Hair', Scissors],
  ['hairCol', 'Hair colour', Palette],
  ['outfit', 'Outfit', Shirt],
  ['acc', 'Extras', Sparkles],
  ['bg', 'Background', ImageIcon],
]
const ACC_ICON: Record<AccKey, LucideIcon> = { glasses: Glasses, crown: Crown, headphones: Headphones, circle: Circle, star: Star }
const display = "'Bricolage Grotesque', sans-serif"
const abs = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s })

export default function AvatarStudioPage({ name, onExit, onSaved }: { name: string; onExit: () => void; onSaved: () => void }) {
  const [look, setLook] = useState<AvatarLook>(loadLook)
  const [tab, setTab] = useState<AvatarTab>('skin')
  const [pop, setPop] = useState(0)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')
  const accRef = useRef<HTMLDivElement>(null)

  const H = HAIR_SHAPES[look.hair] ?? HAIR_SHAPES.short
  const bg = BACKGROUNDS.find((b) => b[0] === look.bg) ?? BACKGROUNDS[0]
  const acc = ACCESSORIES.find((a) => a[1] === look.acc)
  const AccIcon = look.acc ? ACC_ICON[look.acc] : null
  const spot = look.acc ? ACC_SPOT[look.acc] : null
  const skinShade = shade(look.skin)

  const pick = <K extends keyof AvatarLook>(key: K, value: AvatarLook[K]) => {
    playClick()
    setLook((l) => ({ ...l, [key]: value }))
    setPop((p) => p + 1)
    setState('idle')
  }

  const save = async () => {
    if (state === 'saving') return
    playClick()
    setState('saving')
    setError('')
    try {
      const url = await renderLook(look, accRef.current?.querySelector('svg') ?? null)
      await updateMyStudentProfile({ avatar_url: url })
      saveLook(look)
      haptics.success()
      setState('saved')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not save. Please try again.')
      haptics.error()
      setState('idle')
    }
  }

  type Item = { key: string; label: string; sel: boolean; swatch?: string; round?: boolean; icon?: LucideIcon; iconCol?: string; onPick: () => void }
  const items: Item[] =
    tab === 'skin'
      ? SKINS.map(([label, v]) => ({ key: label, label, sel: look.skin === v, swatch: v, onPick: () => pick('skin', v) }))
      : tab === 'hair'
        ? HAIRS.map(([label, v]) => ({ key: label, label, sel: look.hair === v, icon: Scissors, iconCol: look.hairCol, onPick: () => pick('hair', v) }))
        : tab === 'hairCol'
          ? HAIR_COLOURS.map(([label, v]) => ({ key: label, label, sel: look.hairCol === v, swatch: v, onPick: () => pick('hairCol', v) }))
          : tab === 'outfit'
            ? OUTFITS.map(([label, v]) => ({ key: label, label, sel: look.outfit === v, swatch: v, onPick: () => pick('outfit', v) }))
            : tab === 'acc'
              ? ACCESSORIES.map(([label, v, col]) => ({ key: label, label, sel: look.acc === v, icon: v ? ACC_ICON[v] : undefined, iconCol: col, onPick: () => pick('acc', v) }))
              : BACKGROUNDS.map(([label, v]) => ({ key: label, label, sel: look.bg === label, swatch: v, round: true, onPick: () => pick('bg', label) }))

  return (
    <KidsPage label="Avatar Studio" glow="rgba(193,59,255,.3)" starSeed={4} starCount={30} celestial={false} mainPadding="clamp(24px,3.5vw,44px) clamp(12px,2.5vw,28px) 100px" onExit={onExit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 28, alignItems: 'start' }}>
        <div className="kp-studio-preview" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid var(--hair2)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#c86be0' }}>Avatar Studio</span>
          <h1 style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(40px,5vw,64px)', lineHeight: 0.92, letterSpacing: '-.045em', color: 'var(--ink)' }}>Make it you</h1>
          <div
            key={pop}
            aria-label="Your avatar"
            role="img"
            style={{ position: 'relative', marginTop: 26, width: 'min(320px,80vw)', aspectRatio: '1 / 1', borderRadius: '50%', background: bg[1], boxShadow: `0 30px 70px -30px ${bg[2]},inset 0 -20px 40px rgba(0,0,0,.15)`, overflow: 'hidden', animation: pop ? 'kp-studiopop .45s cubic-bezier(.34,1.56,.64,1)' : 'none' }}
          >
            <div style={{ position: 'absolute', inset: 0, animation: 'kp-bob10 3.2s ease-in-out infinite' }}>
              <div style={abs({ left: '18%', right: '18%', bottom: '-14%', height: '42%', borderRadius: '50% 50% 0 0', background: look.outfit })} />
              <div style={abs({ left: '43%', right: '43%', bottom: '22%', height: '12%', background: skinShade })} />
              <div style={abs({ left: '26%', right: '26%', top: H[0], height: H[1], borderRadius: H[2], background: look.hairCol })} />
              <div style={abs({ left: '30%', right: '30%', top: '24%', height: '46%', borderRadius: '46% 46% 44% 44%', background: look.skin })} />
              <div style={abs({ left: '26%', width: '7%', top: '42%', height: '11%', borderRadius: '50%', background: skinShade })} />
              <div style={abs({ right: '26%', width: '7%', top: '42%', height: '11%', borderRadius: '50%', background: skinShade })} />
              <div style={abs({ left: H[3], right: H[4], top: '22%', height: H[5], borderRadius: H[6], background: look.hairCol })} />
              <div style={abs({ left: '39%', width: '5.5%', top: '43%', height: '7%', borderRadius: '50%', background: '#1a0f2e', animation: 'kp-blink 4s infinite' })} />
              <div style={abs({ right: '39%', width: '5.5%', top: '43%', height: '7%', borderRadius: '50%', background: '#1a0f2e', animation: 'kp-blink 4s infinite' })} />
              <div style={abs({ left: '35%', width: '7%', top: '53%', height: '4%', borderRadius: '50%', background: 'rgba(255,120,140,.45)' })} />
              <div style={abs({ right: '35%', width: '7%', top: '53%', height: '4%', borderRadius: '50%', background: 'rgba(255,120,140,.45)' })} />
              <div style={abs({ left: '44%', right: '44%', top: '56%', height: '5%', borderRadius: '0 0 50% 50%', background: '#7a1f2f' })} />
              {AccIcon && spot && (
                <div ref={accRef} style={abs({ left: spot[0], width: spot[1], top: spot[2], aspectRatio: '1 / 1', color: acc?.[2], filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.3))' })}>
                  <AccIcon style={{ display: 'block', width: '100%', height: '100%' }} strokeWidth={2} />
                </div>
              )}
            </div>
          </div>
          <p style={{ margin: '18px 0 0', fontFamily: display, fontWeight: 800, fontSize: 26, color: 'var(--ink)' }}>{name}</p>
          <button
            type="button"
            className="kp-3d"
            onClick={save}
            disabled={state === 'saving'}
            style={{ marginTop: 16, padding: '15px 30px', borderRadius: 18, border: 'none', background: 'linear-gradient(180deg,#d08af0,#8a1fb0)', ['--sh3' as string]: '#4a0d66', boxShadow: '0 5px 0 #4a0d66', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap', opacity: state === 'saving' ? 0.75 : 1 } as CSSProperties}
          >
            {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved ✓' : 'Save my avatar'}
          </button>
          {state === 'saved' && <p style={{ margin: '12px 0 0', maxWidth: 320, fontSize: 14, fontWeight: 700, color: '#e0a400' }}>Your teacher will have a quick look, then your class sees your new avatar.</p>}
          {error && <p style={{ margin: '12px 0 0', maxWidth: 320, fontSize: 14, fontWeight: 700, color: '#ff5b6b' }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 6, padding: 6, borderRadius: 20, background: 'var(--card)', border: '1px solid var(--hair)' }}>
            {TABS.map(([id, label, Icon]) => {
              const on = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    playClick()
                    setTab(id)
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 10px', borderRadius: 14, border: 'none', background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--bg)' : 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Icon style={{ width: 16, height: 16 }} strokeWidth={2} />
                  {label}
                </button>
              )
            })}
          </div>
          <div key={tab} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))', gap: 12, padding: 18, borderRadius: 26, background: 'var(--card)', border: '1px solid var(--hair)' }}>
            {items.map((i) => (
              <button
                key={i.key}
                type="button"
                className="kp-lift3"
                title={i.label}
                aria-pressed={i.sel}
                onClick={i.onPick}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 8px', borderRadius: 18, border: `2.5px solid ${i.sel ? '#ffd84d' : 'transparent'}`, background: i.sel ? 'rgba(255,216,77,.12)' : 'var(--track)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ width: 54, height: 54, borderRadius: i.round ? '50%' : 16, background: i.swatch ?? 'var(--track)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i.icon && <i.icon style={{ width: 30, height: 30, color: i.iconCol || 'var(--ink)' }} strokeWidth={2} />}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{i.label}</span>
              </button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Every look is free. When you save, your teacher checks your new avatar before your class sees it.</p>
        </div>
      </div>
    </KidsPage>
  )
}
