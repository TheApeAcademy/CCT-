import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Lock, Sparkles, Zap } from 'lucide-react'
import { listBibleCharacters, type BibleCharacterRow, type EarnedAchievement } from '../lib/ministry'
import { findLesson } from '../content/bibleJourney'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import KidsPage, { Confetti, HeaderChip } from './KidsPage'
import { makeConfetti } from '../design/kidsConfetti'

// Bible Heroes, rebuilt from the Claude Design handoff (Bible Characters).
// The heroes are the real catalog (bible_characters), and each one unlocks
// when its Bible Journey lesson is finished (check_character_unlocks writes
// the "character_<key>" achievement). The prototype's coin packs, rarities
// and stat bars have nothing behind them in the app, so the cards keep the
// prototype's frames and flip but show the real story instead.

const CHARACTER_CODE_PREFIX = 'character_'
const DISPLAY = "'Bricolage Grotesque', sans-serif"

/** Every activity that earns points feeds this - see check_character_unlocks() in Supabase. */
function unlockedCharacterKeys(achievements: EarnedAchievement[]): Set<string> {
  return new Set(
    achievements.filter((a) => a.code.startsWith(CHARACTER_CODE_PREFIX)).map((a) => a.code.slice(CHARACTER_CODE_PREFIX.length)),
  )
}

// The prototype's four card frames, worn in turn so the wall has its colour.
const FRAMES = [
  { col: '#4f9bff', a: '#2a5fd8', b: '#14286b', glow: 'rgba(79,155,255,.55)' },
  { col: '#c86be0', a: '#9c2bb0', b: '#3d1259', glow: 'rgba(200,107,224,.6)' },
  { col: '#ffd84d', a: '#f0a400', b: '#7a3d00', glow: 'rgba(255,216,77,.7)' },
  { col: '#9fb3c8', a: '#3b4a63', b: '#1f2a3d', glow: 'rgba(159,179,200,.35)' },
]
const frameFor = (sortOrder: number) => FRAMES[(Math.max(1, sortOrder) - 1) % FRAMES.length]
const lessonOf = (c: BibleCharacterRow) => findLesson(c.lesson_key)?.lesson

const CONFETTI = makeConfetti(33)

type Filter = 'all' | 'owned' | 'locked'

export function BibleCharactersPage({
  achievements,
  points,
  onExit,
  onGoToJourney,
}: {
  achievements: EarnedAchievement[]
  points: number
  onExit: () => void
  onGoToJourney: () => void
}) {
  const [characters, setCharacters] = useState<BibleCharacterRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const own = unlockedCharacterKeys(achievements)

  useEffect(() => {
    listBibleCharacters()
      .then(setCharacters)
      .catch(() => {})
  }, [])

  const ownCount = characters.filter((c) => own.has(c.key)).length
  const total = characters.length
  const next = characters.find((c) => !own.has(c.key))
  const nextLesson = next ? lessonOf(next) : undefined
  const list = characters.filter((c) => filter === 'all' || (filter === 'owned' ? own.has(c.key) : !own.has(c.key)))

  return (
    <KidsPage label="Bible Heroes" glow="rgba(193,59,255,.25)" starSeed={33} onExit={onExit} right={<HeaderChip bg="rgba(193,59,255,.14)" col="#c86be0"><Zap style={{ width: 18, height: 18 }} strokeWidth={2} />{points.toLocaleString()}</HeaderChip>}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ maxWidth: 620 }}>
          <span style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 999, border: '1px solid var(--hair2)', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#c86be0' }}>Collection</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(44px,6vw,76px)', lineHeight: 0.92, letterSpacing: '-.045em', color: 'var(--ink)', margin: '16px 0 0' }}>Bible Heroes</h1>
          <p style={{ margin: '14px 0 0', fontSize: 17, lineHeight: 1.6 }}>Finish Bible Journey lessons to unlock heroes. Tap any card you own to flip it.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 24, background: 'var(--card)', border: '1px solid var(--hair)', boxShadow: '0 10px 30px -18px var(--sh)' }}>
          <div style={{ position: 'relative', width: 72, height: 96, borderRadius: 14, background: 'linear-gradient(150deg,#c13bff,#5a128a)', boxShadow: '0 10px 24px -8px rgba(193,59,255,.8)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'kp-bob 3s ease-in-out infinite', ['--r' as string]: '-6deg' } as CSSProperties}>
            <Sparkles style={{ width: 32, height: 32, color: '#ffd84d' }} strokeWidth={2} />
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)', animation: 'kp-shine 2.4s ease-in-out infinite' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>{next ? 'Next hero' : 'All heroes found!'}</p>
            <p style={{ margin: '2px 0 10px', fontSize: 13, color: 'var(--muted)' }}>{next ? `Finish “${nextLesson?.title ?? next.name}” in the Journey` : 'More heroes arrive as new books open.'}</p>
            {next && (
              <button
                type="button"
                className="kp-3d"
                onClick={() => {
                  playClick()
                  onGoToJourney()
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(180deg,#ffe066,#f0a400)', boxShadow: '0 4px 0 #9a6a00', ['--sh3' as string]: '#9a6a00', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' } as CSSProperties}
              >
                Open Bible Journey
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['all', 'All'],
              ['owned', 'Owned'],
              ['locked', 'Locked'],
            ] as [Filter, string][]
          ).map(([k, label]) => {
            const on = filter === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  playClick()
                  setFilter(k)
                }}
                style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${on ? 'var(--ink)' : 'var(--hair2)'}`, background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--bg)' : 'var(--ink)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all .2s' }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: '0 1 320px' }}>
          <div style={{ flex: 1, height: 12, borderRadius: 999, background: 'var(--track)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${total ? Math.round((ownCount / total) * 100) : 0}%`, borderRadius: 999, background: 'linear-gradient(90deg,#c13bff,#ffd84d)', transition: 'width .8s cubic-bezier(.34,1.56,.64,1)' }} />
          </div>
          <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 15, whiteSpace: 'nowrap' }}>
            {ownCount} / {total}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 18, marginTop: 26 }}>
        {list.map((c, i) => {
          const F = frameFor(c.sort_order)
          const has = own.has(c.key)
          const isFlipped = has && flipped[c.key]
          const lesson = lessonOf(c)
          const delay = `${(i * 0.03).toFixed(2)}s`
          return (
            <div key={c.key} style={{ perspective: 1000, aspectRatio: '5/7', animation: 'kp-up .5s both', animationDelay: delay }}>
              <button
                type="button"
                onClick={() => {
                  if (!has) return
                  playClick()
                  setFlipped({ ...flipped, [c.key]: !flipped[c.key] })
                }}
                aria-label={has ? c.name : 'Locked hero'}
                style={{ position: 'relative', display: 'block', width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: has ? 'pointer' : 'default', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'none', transition: 'transform .7s cubic-bezier(.34,1.3,.64,1)', fontFamily: 'inherit' }}
              >
                <span style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 22, overflow: 'hidden', background: has ? `linear-gradient(160deg,${F.a},${F.b})` : 'var(--lockbg)', border: `2px solid ${has ? F.col : 'var(--hair)'}`, boxShadow: `0 14px 30px -14px ${has ? F.glow : 'transparent'}`, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ position: 'relative', flex: 1, margin: '8px 8px 0', borderRadius: 15, background: has ? `radial-gradient(circle at 50% 35%,rgba(255,255,255,.25),transparent 60%),linear-gradient(160deg,${F.col}55,${F.b})` : 'var(--track)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 96, lineHeight: 1, color: has ? 'rgba(255,255,255,.16)' : 'var(--hair)' }}>{c.name[0]}</span>
                    {has && (
                      <>
                        <span style={{ position: 'absolute', inset: 0, background: `url(${c.image}) center/cover no-repeat` }} />
                        <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg,transparent 55%,${F.b})` }} />
                      </>
                    )}
                    {!has && <Lock style={{ position: 'absolute', width: '44%', height: '44%', color: 'var(--faint)' }} strokeWidth={2} />}
                    <span style={{ position: 'absolute', top: 8, right: 8, padding: '4px 9px', borderRadius: 999, background: 'rgba(0,0,0,.35)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.1em' }}>{c.book.toUpperCase()}</span>
                    {has && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)', animation: 'kp-shine 3.5s ease-in-out infinite', animationDelay: delay }} />}
                  </span>
                  <span style={{ padding: '10px 12px 12px' }}>
                    <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 19, letterSpacing: '-.02em', color: has ? '#fff' : 'var(--faint)' }}>{has ? c.name : '???'}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12, fontWeight: 700, color: has ? 'rgba(255,255,255,.72)' : 'var(--faint)' }}>
                      {has ? lesson?.reference ?? c.book : `Finish “${lesson?.title ?? c.name}” in the Journey`}
                    </span>
                  </span>
                </span>
                <span style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 22, overflow: 'hidden', background: `linear-gradient(160deg,${F.b},#0d0618)`, border: `2px solid ${F.col}`, padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', color: '#fff' }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 20 }}>{c.name}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.9 }}>{c.short_story}</span>
                  <span style={{ marginTop: 'auto', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.7 }}>{(lesson?.reference ?? c.book).toUpperCase()}</span>
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </KidsPage>
  )
}

/**
 * The "you got one!" moment, shown once per newly unlocked hero: the
 * prototype's pack opening. A sealed pack shakes until tapped, then the card
 * flies out under turning rays with confetti.
 */
export function CharacterRevealModal({ character, onClose }: { character: BibleCharacterRow; onClose: () => void; onGoToJourney?: () => void }) {
  const [stage, setStage] = useState<'sealed' | 'revealed'>('sealed')
  const [confetti, setConfetti] = useState(false)
  const F = frameFor(character.sort_order)

  useEffect(() => {
    if (!confetti) return
    const t = window.setTimeout(() => setConfetti(false), 1500)
    return () => window.clearTimeout(t)
  }, [confetti])

  const tap = () => {
    playClick()
    if (stage === 'sealed') {
      haptics.success()
      setStage('revealed')
      setConfetti(true)
    } else onClose()
  }

  return (
    <div data-dc-screen="kidspage" style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
      <div
        role="dialog"
        aria-label="New hero unlocked"
        onClick={tap}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,3,16,.92)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 900, height: 900, background: `repeating-conic-gradient(from 0deg,${F.glow} 0deg 8deg,transparent 8deg 22deg)`, opacity: stage === 'revealed' ? 0.5 : 0.15, animation: 'kp-rays 18s linear infinite', transition: 'opacity .6s', pointerEvents: 'none', WebkitMask: 'radial-gradient(circle,#000 10%,transparent 60%)', mask: 'radial-gradient(circle,#000 10%,transparent 60%)' }} />
        {stage === 'sealed' ? (
          <>
            <div style={{ position: 'relative', width: 220, height: 300, borderRadius: 26, background: 'linear-gradient(150deg,#c13bff,#5a128a)', border: '3px solid rgba(255,255,255,.3)', boxShadow: '0 30px 80px -20px rgba(193,59,255,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, animation: 'kp-shakepack .5s ease-in-out infinite', overflow: 'hidden' }}>
              <Sparkles style={{ width: 70, height: 70, color: '#ffd84d' }} strokeWidth={2} />
              <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: '#fff' }}>NEW HERO</span>
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)', animation: 'kp-shine 1.6s ease-in-out infinite' }} />
            </div>
            <p style={{ position: 'relative', margin: '28px 0 0', fontWeight: 800, color: '#fff', fontSize: 17, letterSpacing: '.06em' }}>TAP TO OPEN</p>
          </>
        ) : (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <p style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 800, letterSpacing: '.2em', color: F.col, animation: 'kp-up .5s .5s both' }}>{character.book.toUpperCase()}</p>
            <div style={{ width: 240, aspectRatio: '5/7', borderRadius: 24, background: `linear-gradient(160deg,${F.a},${F.b})`, border: `3px solid ${F.col}`, boxShadow: `0 0 80px ${F.glow}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'kp-reveal .9s cubic-bezier(.2,.9,.2,1) both' }}>
              <span style={{ position: 'relative', flex: 1, margin: '10px 10px 0', borderRadius: 16, background: `radial-gradient(circle at 50% 35%,rgba(255,255,255,.25),transparent 60%),linear-gradient(160deg,${F.col}55,${F.b})` }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: 16, background: `url(${character.image}) center/cover no-repeat` }} />
              </span>
              <span style={{ padding: '12px 14px 16px', textAlign: 'left' }}>
                <span style={{ display: 'block', fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, color: '#fff' }}>{character.name}</span>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>{lessonOf(character)?.reference ?? character.book}</span>
              </span>
            </div>
            <p style={{ margin: '22px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: '#fff', animation: 'kp-up .5s .7s both' }}>New hero unlocked!</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.6)', animation: 'kp-up .5s .9s both' }}>Tap anywhere to continue</p>
          </div>
        )}
      </div>
      {confetti && <Confetti pieces={CONFETTI} />}
    </div>
  )
}
