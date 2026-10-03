import { useEffect, useState, type CSSProperties } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db, getMatchSessions, createMatch } from '../db/db'
import type { GameConfig, GameSession, Match } from '../db/types'
import Fireworks from '../components/Fireworks'
import CountUp from '../components/CountUp'
import QuizStage from '../components/quizshow/QuizStage'
import { card, display, eyebrow, ghostBtn, goldBtn, mono, teamColour } from '../components/quizshow/kit'
import { selectQuestionsForGame } from '../lib/selectQuestions'
import { buildLadder } from '../lib/ladder'
import { playClick, playNav, playWin, playCheer, playOops } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function MatchResults() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState<Match | null>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [showFireworks, setShowFireworks] = useState(false)
  const [restarting, setRestarting] = useState(false)

  useEffect(() => {
    if (!matchId) return
    const id = Number(matchId)
    Promise.all([db.matches.get(id), getMatchSessions(id)]).then(([m, s]) => {
      if (m) setMatch(m)
      setSessions(s)
      // Every match gets an audio verdict at the end, not just a winner
      // celebration on multi-team matches - judged by the top scorer's
      // accuracy across the whole ladder: a real match (half or better)
      // earns the extended cheer, a rough one gets oops instead.
      if (s.length > 0) {
        const top = [...s].sort((a, b) => b.correctCount - a.correctCount)[0]
        const ratio = top.totalLevels > 0 ? top.correctCount / top.totalLevels : 0
        if (ratio >= 0.5) {
          setShowFireworks(true)
          if (s.length > 1) playWin()
          playCheer(2.6, 0.4)
          haptics.win()
          window.setTimeout(() => setShowFireworks(false), 4200)
        } else {
          playOops()
          haptics.error()
        }
      }
    })
  }, [matchId])

  if (!match || sessions.length === 0) {
    return (
      <QuizStage step="results">
        <div style={{ padding: '80px 0', textAlign: 'center', fontSize: 20 }}>Loading match results…</div>
      </QuizStage>
    )
  }

  const ranked = [...sessions].sort((a, b) => b.pointsWon - a.pointsWon)
  const tie = ranked.length > 1 && ranked[0].pointsWon === ranked[1].pointsWon
  const colourOf = (s: GameSession) => teamColour(s.teamIndex ?? sessions.indexOf(s))
  const podium = [1, 0, 2].map((i) => ranked[i]).filter(Boolean)

  // Same teams, same settings, fresh match. A random quiz draws new
  // questions from the same sets; a hand-picked one plays the same list.
  const playAgain = async () => {
    if (restarting) return
    setRestarting(true)
    playNav()
    haptics.tap()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _c, completedAt: _d, ...settings } = match
    let questionIds = match.questionIds
    if ((match.questionMode ?? 'random') === 'random') {
      const pool = await db.questions.where('setId').anyOf(match.setIds ?? [match.setId]).toArray()
      const drawn = selectQuestionsForGame(pool, buildLadder(match.questionIds.length)).map((q) => q.id!)
      if (drawn.length) questionIds = drawn
    }
    const newId = await createMatch({ ...settings, questionIds })
    const config: GameConfig = {
      matchId: newId,
      teamNames: match.teamNames,
      teamPhotos: match.teamPhotos,
      teamStudentIds: match.teamStudentIds,
      teamStudentClassIds: match.teamStudentClassIds,
      teamIndex: 0,
      setId: match.setId,
      setName: match.setName,
      seasonName: match.seasonName,
      timerSecondsPerQuestion: match.timerSecondsPerQuestion,
      lifelines: match.lifelines,
      mode: match.mode,
      questionMode: match.questionMode,
    }
    navigate('/ground-rules', { state: config })
  }

  const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }

  return (
    <QuizStage step="results">
      <Fireworks active={showFireworks} />
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', textAlign: 'center', animation: 'qs-up .5s both' }}>
        <p style={{ margin: '20px 0 0', fontSize: 13, fontWeight: 800, letterSpacing: '.2em', color: '#ffd84d' }}>FINAL RESULTS</p>
        <h1 style={{ margin: '8px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(40px,6vw,76px)', lineHeight: 0.95, letterSpacing: '-.04em', color: '#fff', overflowWrap: 'anywhere' }}>
          {ranked.length === 1 ? `Well played, ${ranked[0].playerName}!` : tie ? 'It’s a tie!' : `${ranked[0].playerName} wins!`}
        </h1>
        <p style={{ margin: '10px 0 0', color: 'rgba(236,230,250,.6)' }}>
          {match.setName}
          {match.seasonName ? ` · ${match.seasonName}` : ''}
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(8px,2vw,20px)', marginTop: 36 }}>
          {podium.map((s) => {
            const rk = ranked.indexOf(s) + 1
            const first = rk === 1
            const size = first ? 90 : 68
            const dl = first ? 0.5 : rk === 2 ? 0.25 : 0
            return (
              <div key={s.id} style={{ flex: 1, maxWidth: 240, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {s.playerPhoto ? (
                  <img src={s.playerPhoto} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${first ? '#ffd84d' : '#fff'}`, boxShadow: `0 0 40px ${first ? 'rgba(255,216,77,.6)' : 'transparent'}`, animation: 'qs-pop .6s both', animationDelay: `${dl}s` }} />
                ) : (
                  <span style={{ width: size, height: size, borderRadius: '50%', background: colourOf(s), border: `4px solid ${first ? '#ffd84d' : '#fff'}`, boxShadow: `0 0 40px ${first ? 'rgba(255,216,77,.6)' : 'transparent'}`, animation: 'qs-pop .6s both', animationDelay: `${dl}s` }} />
                )}
                <p style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 20, color: '#fff', maxWidth: '100%', overflowWrap: 'anywhere' }}>{s.playerName}</p>
                <p style={{ margin: '2px 0 0', fontFamily: mono, fontSize: 26, color: '#ffd84d' }}>
                  <CountUp value={s.pointsWon} durationMs={900} />
                </p>
                <div style={{ marginTop: 10, width: '100%', height: first ? 180 : rk === 2 ? 130 : 96, borderRadius: '20px 20px 0 0', background: first ? 'linear-gradient(180deg,#ffd84d,rgba(240,164,0,.3))' : 'rgba(255,255,255,.1)', display: 'flex', justifyContent: 'center', paddingTop: 12, boxSizing: 'border-box', fontFamily: display, fontWeight: 800, fontSize: 48, color: first ? '#1a0f2e' : '#fff', transformOrigin: 'bottom', animation: 'qs-rise .8s cubic-bezier(.34,1.3,.64,1) both', animationDelay: `${dl}s` }}>
                  {rk}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 30 }}>
          <button type="button" className="qs-gold" onClick={playAgain} disabled={restarting} style={{ ...goldBtn, padding: '15px 26px', fontSize: 16, boxShadow: '0 5px 0 #8a5a00' }}>
            {restarting ? 'Getting ready…' : 'Play again'}
          </button>
          <Link to="/setup" onClick={() => playClick()} style={{ ...ghostBtn, fontSize: 16, padding: '15px 26px' }}>
            New setup
          </Link>
          <Link to="/history" onClick={() => playClick()} style={{ ...ghostBtn, fontSize: 16, padding: '15px 26px' }}>
            Match history
          </Link>
        </div>

        <div style={{ ...card, marginTop: 34, textAlign: 'left' }}>
          <p style={eyebrow}>FINAL STANDINGS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {ranked.map((s, i) => (
              <div key={s.id} style={{ ...row, border: `1px solid ${i === 0 && !tie ? 'rgba(255,216,77,.45)' : 'rgba(255,255,255,.08)'}` }}>
                <span style={{ width: 24, flexShrink: 0, fontFamily: display, fontWeight: 800, fontSize: 18, color: i === 0 ? '#ffd84d' : 'rgba(236,230,250,.6)' }}>{i + 1}</span>
                <span style={{ flexShrink: 0, width: 10, height: 28, borderRadius: 4, background: colourOf(s) }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{s.playerName}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(236,230,250,.55)' }}>
                    {s.correctCount} of {s.totalLevels} correct{s.correctCount === s.totalLevels ? ' · Perfect!' : ''}
                  </span>
                </span>
                <span style={{ flexShrink: 0, fontFamily: mono, fontSize: 22, color: '#ffd84d' }}>{s.pointsWon}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, marginTop: 18, textAlign: 'left' }}>
          <p style={eyebrow}>FULL QUESTION RECAP</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {match.questionIds.map((_qid, qIndex) => {
              const level = qIndex + 1
              // Looked up by recorded ladder level, not array position: in
              // rotational mode each team's own answers are a sparse subset of
              // the shared ladder (only the questions that were their turn),
              // not one answer per question in order like marathon mode.
              const sample = sessions.map((s) => s.answers.find((a) => a.level === level)).find((a) => a)
              if (!sample) return null
              return (
                <div key={qIndex} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(0,0,0,.2)' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(236,230,250,.5)' }}>QUESTION {level}</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#fff' }}>{sample.questionText}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#5cf0c8' }}>Answer: {sample.options[sample.correctIndex]}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {sessions.map((s) => {
                      const a = s.answers.find((rec) => rec.level === level)
                      if (!a) return null
                      return (
                        <span key={s.id} style={{ padding: '4px 10px', borderRadius: 999, background: a.correct ? 'rgba(47,224,181,.16)' : 'rgba(255,91,107,.14)', color: a.correct ? '#5cf0c8' : '#ff8a96', fontSize: 12, fontWeight: 800 }}>
                          {a.correct ? '✓' : '✗'} {s.playerName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </QuizStage>
  )
}
