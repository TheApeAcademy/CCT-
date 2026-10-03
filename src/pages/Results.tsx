import { useEffect, useState, type CSSProperties } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../db/db'
import type { GameSession, Match, GameConfig } from '../db/types'
import Confetti from '../components/Confetti'
import Fireworks from '../components/Fireworks'
import CountUp from '../components/CountUp'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import QuizStage from '../components/quizshow/QuizStage'
import { card, display, eyebrow, ghostBtn, goldBtn, mono, teamColour } from '../components/quizshow/kit'

export default function Results() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<GameSession | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    db.gameSessions.get(Number(sessionId)).then(async (s) => {
      if (!s) return
      setSession(s)
      // Every finished run gets an audio verdict, not just a perfect score:
      // half the ladder or better earns the extended cheer, anything
      // rougher gets oops instead - a perfect run still gets the extra
      // fireworks/win flourish on top.
      const isPerfect = s.correctCount === s.totalLevels
      const ratio = s.totalLevels > 0 ? s.correctCount / s.totalLevels : 0
      if (isPerfect) {
        setShowFireworks(true)
        sound.playWin()
        sound.playCheer(2.6, 0.4)
        haptics.win()
        window.setTimeout(() => setShowFireworks(false), 4200)
      } else if (ratio >= 0.5) {
        setShowConfetti(true)
        sound.playCheer(2.2, 0.2)
        haptics.success()
        window.setTimeout(() => setShowConfetti(false), 3000)
      } else {
        sound.playOops()
        haptics.error()
      }
      if (s.matchId) {
        const m = await db.matches.get(s.matchId)
        if (m) setMatch(m)
      }
    })
  }, [sessionId])

  if (!session) {
    return (
      <QuizStage step="results">
        <div style={{ padding: '80px 0', textAlign: 'center', fontSize: 20 }}>Loading results…</div>
      </QuizStage>
    )
  }

  const isPerfect = session.correctCount === session.totalLevels
  const endedEarly = session.outcome === 'ended_early'
  const title = isPerfect ? 'Perfect score!' : endedEarly ? 'Turn ended' : 'Turn complete!'
  const encouragement = isPerfect
    ? 'Every single question, nailed it. Legendary run!'
    : endedEarly
      ? 'No worries, every point earned still counts.'
      : session.correctCount >= session.totalLevels / 2
        ? 'Great job! Solid round of trivia.'
        : 'Nice try! Every question is a chance to learn something new.'
  const colour = teamColour(session.teamIndex ?? 0)

  const hasNextTeam = !!match && session.teamIndex !== undefined && session.teamIndex < match.teamNames.length - 1

  const durationSec = Math.max(0, Math.round((session.finishedAt - session.startedAt) / 1000))
  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60

  const handleNextTeam = () => {
    if (!match || session.teamIndex === undefined) return
    sound.playNav()
    haptics.tap()
    const nextIndex = session.teamIndex + 1
    const config: GameConfig = {
      matchId: match.id!,
      teamNames: match.teamNames,
      teamPhotos: match.teamPhotos,
      teamStudentIds: match.teamStudentIds,
      teamStudentClassIds: match.teamStudentClassIds,
      teamIndex: nextIndex,
      setId: match.setId,
      setName: match.setName,
      seasonName: match.seasonName,
      timerSecondsPerQuestion: match.timerSecondsPerQuestion,
      lifelines: match.lifelines,
      mode: match.mode,
      questionMode: match.questionMode,
    }
    navigate('/play', { state: config })
  }

  const linkBtn: CSSProperties = { ...ghostBtn, fontSize: 16, padding: '15px 26px' }

  return (
    <QuizStage step="results">
      <Confetti active={showConfetti} />
      <Fireworks active={showFireworks} />
      <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', textAlign: 'center', animation: 'qs-up .5s both' }}>
        <p style={{ margin: '20px 0 0', fontSize: 13, fontWeight: 800, letterSpacing: '.2em', color: '#ffd84d' }}>
          {match && match.teamNames.length > 1 ? `TEAM ${(session.teamIndex ?? 0) + 1} OF ${match.teamNames.length}` : 'YOUR RESULT'}
        </p>
        {session.playerPhoto ? (
          <img src={session.playerPhoto} alt="" style={{ display: 'block', margin: '18px auto 0', width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${isPerfect ? '#ffd84d' : colour}`, animation: 'qs-pop .6s both' }} />
        ) : (
          <span style={{ display: 'block', margin: '18px auto 0', width: 80, height: 80, borderRadius: '50%', background: colour, border: `4px solid ${isPerfect ? '#ffd84d' : '#fff'}`, animation: 'qs-pop .6s both' }} />
        )}
        <h1 style={{ margin: '14px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(40px,6vw,72px)', lineHeight: 0.95, letterSpacing: '-.04em', color: isPerfect ? '#ffd84d' : '#fff' }}>{title}</h1>
        <p style={{ margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 22, color: '#fff', overflowWrap: 'anywhere' }}>{session.playerName}</p>
        <p style={{ margin: '6px 0 0', color: 'rgba(236,230,250,.6)' }}>{encouragement}</p>

        <div style={{ ...card, marginTop: 26 }}>
          <p style={eyebrow}>SCORE</p>
          <p style={{ margin: '6px 0 0', fontFamily: mono, fontSize: 'clamp(48px,7vw,72px)', lineHeight: 1, color: '#ffd84d', textShadow: '0 0 18px rgba(255,216,77,.5)' }}>
            <CountUp value={session.pointsWon} />
          </p>
          <p style={{ margin: '8px 0 0' }}>
            {session.correctCount} of {session.totalLevels} correct
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))', gap: 12, marginTop: 12 }}>
          <Stat label="Correct" value={session.correctCount} />
          <Stat label="Wrong" value={session.wrongCount} />
          <Stat label="Time played" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
          <Stat label="Lifelines used" value={Object.values(session.lifelinesUsed).filter(Boolean).length} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
          {hasNextTeam ? (
            <button type="button" className="qs-gold" onClick={handleNextTeam} style={{ ...goldBtn, padding: '15px 26px', fontSize: 16, boxShadow: '0 5px 0 #8a5a00' }}>
              Next: {match!.teamNames[(session.teamIndex ?? 0) + 1]} →
            </button>
          ) : match ? (
            <Link to={`/match-results/${match.id}`} onClick={() => sound.playClick()} className="qs-gold" style={{ ...goldBtn, padding: '15px 26px', fontSize: 16, boxShadow: '0 5px 0 #8a5a00', color: '#1a0f2e' }}>
              See the final results
            </Link>
          ) : null}
          <Link to="/setup" onClick={() => sound.playClick()} style={linkBtn}>
            New setup
          </Link>
          <Link to="/history" onClick={() => sound.playClick()} style={linkBtn}>
            Match history
          </Link>
        </div>

        <div style={{ ...card, marginTop: 26, textAlign: 'left' }}>
          <p style={eyebrow}>QUESTION RECAP</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {session.answers.map((a, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(0,0,0,.2)', animation: 'qs-up .4s both', animationDelay: `${i * 60}ms` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(236,230,250,.5)' }}>QUESTION {a.level}</span>
                    <span style={{ display: 'block', marginTop: 4, fontWeight: 700, color: '#fff' }}>{a.questionText}</span>
                  </span>
                  <span style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 999, background: a.correct ? 'rgba(47,224,181,.16)' : 'rgba(255,91,107,.14)', color: a.correct ? '#5cf0c8' : '#ff8a96', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {a.correct ? '✓ Correct' : a.timedOut ? 'Timed out' : '✗ Wrong'}
                  </span>
                </div>
                {!a.correct && <p style={{ margin: '6px 0 0', fontSize: 14, color: '#5cf0c8' }}>Answer: {a.options[a.correctIndex]}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </QuizStage>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 28, color: '#ffd84d' }}>{value}</div>
      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(236,230,250,.6)' }}>{label}</div>
    </div>
  )
}
