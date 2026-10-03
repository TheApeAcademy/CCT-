import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, getOrCreatePlayer } from '../db/db'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'
import CountUp from '../components/CountUp'
import { useKidProfile, KidSignupCard, KidProfileBar } from '../components/KidProfile'
import type { Question } from '../db/types'
import { shuffleOptions } from '../lib/selectQuestions'
import { Trophy, Timer, LifeBuoy, Sparkles, type LucideIcon } from 'lucide-react'
import PublicShell, { IconTile } from '../components/public/PublicShell'
import { card, display, grid, label } from '../components/public/kit'

// The design's four "how it works" cards, worded to what a match really does.
const HOW: [string, string, LucideIcon, string][] = [
  ['How a match works', 'Teams take turns on a question ladder that gets harder as you climb. Ten questions unless the host picks another number.', Trophy, '#ffd84d'],
  ['The clock', 'Each question has 30 seconds unless the host changes it. Answer before it turns red!', Timer, '#ff8a3d'],
  ['Lifelines', '50 / 50, Ask the Church and Ask a Friend, once each per team.', LifeBuoy, '#4f9bff'],
  ['Points', 'Every correct answer earns 10 points.', Sparkles, '#2fe0b5'],
]
const SHELL = { eyebrow: 'Training', title: 'Practice makes perfect', sub: 'Get ready for match day. Learn how the quiz works, then practise as much as you like. No teams, no timer, no pressure.', accent: '#2fe0b5' }
const greenBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: 16, border: 'none', background: 'linear-gradient(180deg,#5cf0c8,#13b48c)', boxShadow: '0 5px 0 #0b7a5e', color: '#03231b', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap' as const }

type Phase = 'setup' | 'question' | 'feedback' | 'summary'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Training() {
  useEffect(() => {
    ensureSeedData()
  }, [])

  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const { profile, save: saveProfile, clear: clearProfile } = useKidProfile()
  const playerName = profile?.name ?? ''

  const [phase, setPhase] = useState<Phase>('setup')
  const [setId, setSetId] = useState<number | null>(null)
  const [pool, setPool] = useState<Question[]>([])
  const [queue, setQueue] = useState<Question[]>([])
  const [current, setCurrent] = useState<Question | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)
  const [shake, setShake] = useState(false)

  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [startedAt, setStartedAt] = useState(0)

  useEffect(() => {
    if (setId === null && sets.length > 0) setSetId(sets[0].id!)
  }, [sets, setId])

  const nextFromQueue = useCallback(
    (fromQueue: Question[], fromPool: Question[]) => {
      let q = fromQueue
      if (q.length === 0) q = shuffle(fromPool)
      const [head, ...rest] = q
      setCurrent(head)
      setQueue(rest)
      setSelectedIndex(null)
      setRevealed(false)
      setPhase('question')
    },
    []
  )

  const handleStart = async () => {
    if (!setId || !profile) return
    const rawQs = await db.questions.where('setId').equals(setId).toArray()
    if (rawQs.length < 4) return
    await getOrCreatePlayer(profile.name, profile.className)
    sound.playNav()
    haptics.success()
    const qs = rawQs.map(shuffleOptions)
    const shuffled = shuffle(qs)
    setPool(qs)
    setAnswered(0)
    setCorrect(0)
    setStreak(0)
    setBestStreak(0)
    setStartedAt(Date.now())
    nextFromQueue(shuffled, qs)
  }

  const handleSelect = (index: number) => {
    if (phase !== 'question' || !current) return
    setSelectedIndex(index)
    haptics.select()
    sound.playDrumroll(0.5)
    window.setTimeout(() => {
      setRevealed(true)
      const isCorrect = index === current.correctIndex
      setAnswered((a) => a + 1)
      if (isCorrect) {
        setCorrect((c) => c + 1)
        setStreak((s) => {
          const next = s + 1
          setBestStreak((b) => Math.max(b, next))
          return next
        })
        sound.playCorrect()
        haptics.success()
        setFlash('green')
        setShowConfetti(true)
        window.setTimeout(() => setShowConfetti(false), 1500)
      } else {
        setStreak(0)
        sound.playOops()
        haptics.error()
        setFlash('red')
        setShake(true)
        window.setTimeout(() => setShake(false), 500)
      }
      window.setTimeout(() => setFlash(null), 600)
      window.setTimeout(() => setPhase('feedback'), 250)
    }, 500)
  }

  const handleNext = () => {
    sound.playWhoosh()
    nextFromQueue(queue, pool)
  }

  const handleEnd = async () => {
    sound.playClick()
    haptics.tap()
    if (answered > 0 && setId) {
      const selectedSet = sets.find((s) => s.id === setId)
      await db.practiceSessions.add({
        playerName: profile?.name ?? 'Guest',
        setId,
        setName: selectedSet?.name ?? '',
        startedAt,
        finishedAt: Date.now(),
        questionsAnswered: answered,
        correctCount: correct,
        bestStreak,
      })
    }
    setPhase('summary')
  }

  const handleTrainAgain = () => {
    setPhase('setup')
  }

  const optionLabel = (i: number) => String.fromCharCode(65 + i)
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

  if (phase === 'setup') {
    return (
      <PublicShell {...SHELL}>
        <div style={grid(280)}>
          {HOW.map(([t, sub, Icon, col]) => (
            <div key={t} style={card}>
              <IconTile col={col}>
                <Icon style={{ width: 24, height: 24 }} strokeWidth={2} />
              </IconTile>
              <p style={{ margin: '16px 0 0', fontFamily: display, fontWeight: 800, fontSize: 22, color: '#fff' }}>{t}</p>
              <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.55 }}>{sub}</p>
            </div>
          ))}
        </div>
        {!profile ? (
          <div style={{ marginTop: 24 }}>
            <KidSignupCard subtitle="Sign up once and Training will remember you next time." onDone={saveProfile} />
          </div>
        ) : (
          <div style={{ ...card, marginTop: 24, maxWidth: 640 }}>
            <KidProfileBar profile={profile} onSwitch={clearProfile} />
            <p style={{ ...label, marginTop: 18 }}>QUESTION SET</p>
            <select
              value={setId ?? ''}
              onChange={(e) => {
                setSetId(Number(e.target.value))
                sound.playClick()
              }}
              className="pb-field"
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '13px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(0,0,0,.25)', color: '#fff', fontWeight: 700, fontSize: 15 }}
            >
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleStart} className="pb-press" style={{ ...greenBtn, marginTop: 20 }}>
              Start practising →
            </button>
          </div>
        )}
      </PublicShell>
    )
  }

  if (phase === 'summary') {
    return (
      <PublicShell {...SHELL} bare>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...label, color: '#2fe0b5' }}>TRAINING DONE</p>
          <h1 style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(38px,6vw,64px)', lineHeight: 0.95, letterSpacing: '-.04em', color: '#fff' }}>Nice session!</h1>
          <p style={{ margin: '10px 0 0', color: 'rgba(236,230,250,.6)' }}>
            {playerName || 'Guest'}
            {profile?.className ? ` · ${profile.className}` : ''}
          </p>
          <div style={{ ...card, marginTop: 26, background: 'linear-gradient(160deg,rgba(47,224,181,.22),rgba(20,8,40,.9))', borderColor: 'rgba(47,224,181,.4)' }}>
            <p style={{ ...label, color: 'rgba(236,230,250,.7)' }}>ACCURACY</p>
            <p style={{ margin: '6px 0 0', fontFamily: display, fontWeight: 800, fontSize: 56, color: '#5cf0c8' }}>
              <CountUp value={accuracy} />%
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 12 }}>
            <Stat label="Answered" value={answered} />
            <Stat label="Correct" value={correct} />
            <Stat label="Best streak" value={bestStreak} />
          </div>
          <button type="button" onClick={handleTrainAgain} className="pb-press" style={{ ...greenBtn, marginTop: 26 }}>
            Train again
          </button>
        </div>
      </PublicShell>
    )
  }

  if (!current) return <PublicShell {...SHELL} bare><p style={{ textAlign: 'center', padding: '60px 0', fontSize: 20 }}>Loading…</p></PublicShell>

  const showResult = revealed
  const suspense = selectedIndex !== null && !revealed
  const right = selectedIndex === current.correctIndex

  return (
    <PublicShell {...SHELL} bare>
      <Confetti active={showConfetti} />
      {flash && <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />}

      <div className={shake ? 'animate-screen-shake' : undefined} style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#2fe0b5' }}>TRAINING AS</p>
            <p style={{ margin: '2px 0 0', fontFamily: display, fontWeight: 800, fontSize: 22, color: '#fff', overflowWrap: 'anywhere' }}>{playerName || 'Guest'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={chip}>🔥 {streak} streak</span>
            <span style={chip}>{accuracy}% right</span>
            <button type="button" onClick={handleEnd} style={{ ...chip, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(255,255,255,.25)' }}>
              End training
            </button>
          </div>
        </div>

        <div style={{ ...card, marginTop: 20, padding: 'clamp(20px,3vw,32px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ ...chip, padding: '5px 11px', fontSize: 12 }}>{current.category}</span>
            <span style={{ ...chip, padding: '5px 11px', fontSize: 12, color: '#ffd84d' }}>
              {'●'.repeat(current.difficulty)}
              {'○'.repeat(5 - current.difficulty)}
            </span>
          </div>
          <p style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', lineHeight: 1.2, color: '#fff' }}>{current.text}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 10, marginTop: 14 }}>
          {current.options.map((opt, i) => {
            const isSelected = selectedIndex === i
            const isCorrectAnswer = i === current.correctIndex
            let bg = 'rgba(255,255,255,.05)'
            let bd = 'rgba(255,255,255,.12)'
            let dim = false
            if (suspense && isSelected) {
              bg = 'rgba(255,216,77,.18)'
              bd = '#ffd84d'
            }
            if (showResult) {
              if (isCorrectAnswer) {
                bg = 'rgba(47,224,181,.2)'
                bd = '#2fe0b5'
              } else if (isSelected) {
                bg = 'rgba(255,91,107,.18)'
                bd = '#ff5b6b'
              } else dim = true
            }
            return (
              <button
                key={i}
                type="button"
                disabled={phase !== 'question'}
                onClick={() => handleSelect(i)}
                className="pb-row"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 18, border: `2px solid ${bd}`, background: bg, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 17, textAlign: 'left', cursor: phase === 'question' ? 'pointer' : 'default', opacity: dim ? 0.45 : 1, transition: 'all .25s' }}
              >
                <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 12, background: '#ffd84d', color: '#1a0f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 800 }}>{optionLabel(i)}</span>
                <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{opt}</span>
                {showResult && isCorrectAnswer && <span style={{ flexShrink: 0, color: '#5cf0c8', fontWeight: 800 }}>✓</span>}
                {showResult && isSelected && !isCorrectAnswer && <span style={{ flexShrink: 0, color: '#ff8a96', fontWeight: 800 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {phase === 'feedback' && (
          <div style={{ marginTop: 14, padding: '18px 20px', borderRadius: 20, textAlign: 'center', background: right ? 'rgba(47,224,181,.12)' : 'rgba(255,91,107,.1)', border: `1px solid ${right ? 'rgba(47,224,181,.4)' : 'rgba(255,91,107,.35)'}`, animation: 'pb-up .35s both' }}>
            <p style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 20, color: right ? '#5cf0c8' : '#ff8a96' }}>
              {right ? 'Correct!' : `Not quite. The answer was ${optionLabel(current.correctIndex)}: ${current.options[current.correctIndex]}`}
            </p>
            {current.funFact && <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(236,230,250,.7)' }}>💡 {current.funFact}</p>}
            <button type="button" onClick={handleNext} className="pb-press" style={{ ...greenBtn, marginTop: 14 }}>
              Next question →
            </button>
          </div>
        )}
      </div>
    </PublicShell>
  )
}

const chip = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' as const }

function Stat({ label: name, value }: { label: string; value: number }) {
  return (
    <div style={{ ...card, padding: '16px 10px' }}>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 28, color: '#ffd84d' }}>{value}</div>
      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(236,230,250,.6)' }}>{name}</div>
    </div>
  )
}
