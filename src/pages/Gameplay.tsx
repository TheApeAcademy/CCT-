import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db, getOrCreatePlayer, completeMatch, getMatchSessions } from '../db/db'
import { buildLadder, pointsForLevel } from '../lib/ladder'
import { shuffleOptions } from '../lib/selectQuestions'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'
import CountUp from '../components/CountUp'
import QuizStage from '../components/quizshow/QuizStage'
import { display, goldBtn, mono, teamColour } from '../components/quizshow/kit'
import { Pause, Phone, Settings, Split, Users, type LucideIcon } from 'lucide-react'
import type { AnswerRecord, GameConfig, GameOutcome, GameSession, LifelinesUsed, Question } from '../db/types'

type Phase =
  | 'loading'
  | 'intro'
  | 'switching'
  | 'picking'
  | 'question'
  | 'locked'
  | 'feedback'
  | 'lifeline-audience'
  | 'lifeline-friend'
  | 'paused'
  | 'finishing'

const FRIEND_LINES = [
  "Hmm, I'm pretty sure it's...",
  "Ooh, I remember this one! I think it's...",
  "Let me think... I'll guess...",
  "I'm not 100% sure, but my best guess is...",
]

const COUNT_IN_STEPS: (3 | 2 | 1 | 0)[] = [3, 2, 1, 0]

/** How long the "Next up" reveal between contestants holds before their question starts. */
const NEXT_UP_MS = 4000

export default function Gameplay() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state as GameConfig | undefined

  const [questions, setQuestions] = useState<Question[] | null>(null)
  // The ladder's length follows however many questions this match actually
  // has (a teacher's choice at setup, not a fixed 10) - built fresh once the
  // real question count is known, rather than assumed up front.
  const ladder = useMemo(() => buildLadder(questions?.length || 1), [questions])
  const [phase, setPhase] = useState<Phase>('loading')
  const [introStep, setIntroStep] = useState<3 | 2 | 1 | 0>(3)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [disabledOptions, setDisabledOptions] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)
  const [shake, setShake] = useState(false)
  const [lifelinesUsed, setLifelinesUsed] = useState<LifelinesUsed>({ fiftyFifty: false, askChurch: false, phoneFriend: false })
  const [audiencePoll, setAudiencePoll] = useState<number[] | null>(null)
  const [friendHint, setFriendHint] = useState<{ line: string; index: number } | null>(null)
  // Keyed by team index rather than a single flat list so rotational mode
  // (where the active team changes every question) can track each
  // contestant's own answers separately, in the same shape marathon mode
  // uses for just the one team it's currently running.
  const [answersByTeam, setAnswersByTeam] = useState<Record<number, AnswerRecord[]>>({})
  const [showConfetti, setShowConfetti] = useState(false)
  const [pastSessions, setPastSessions] = useState<GameSession[]>([])
  // All-time ministry leaderboard total per team index, for teams linked to
  // a registered Student Code - best-effort only. The quiz itself must keep
  // working fully offline, so this is a silent, non-blocking fetch: no
  // network (or no linked teams at all) just means the secondary line never
  // appears, never a loading state gameplay waits on.
  const [xpTotals, setXpTotals] = useState<Record<number, number>>({})
  // Counts questions actually completed so far, independent of which numbered
  // level was just played - see the "pick a number" flow below, where a
  // contestant can jump straight to Q11 first. Team-rotation and the
  // match-complete check both need a running total, not the arbitrary level
  // number that happened to be picked.
  const [turnsCompleted, setTurnsCompleted] = useState(0)
  const [pausedFrom, setPausedFrom] = useState<Phase | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [sfxMuted, setSfxMuted] = useState(() => sound.isMuted())
  const [musicMuted, setMusicMuted] = useState(() => sound.isMusicMuted())
  const [musicVolume, setMusicVolumeState] = useState(() => sound.getMusicVolume())
  // Adjustable mid-match from the settings panel - takes effect from the
  // next question onward, never mid-countdown, so a change can't skip or
  // extend the question currently being timed.
  const [timerSeconds, setTimerSeconds] = useState(() => config?.timerSecondsPerQuestion ?? 30)

  const questionStartRef = useRef<number>(Date.now())
  const turnStartRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!config) {
      navigate('/setup', { replace: true })
      return
    }
    turnStartRef.current = Date.now()
    db.matches.get(config.matchId).then(async (match) => {
      if (!match) {
        navigate('/setup', { replace: true })
        return
      }
      const qs = await db.questions.bulkGet(match.questionIds)
      // Shuffled once here, when the match's questions are loaded, so the
      // board, the 50/50 lifeline, the recorded answer and the recap all
      // agree on where the correct option sits.
      setQuestions(qs.filter((q): q is NonNullable<typeof q> => !!q).map(shuffleOptions))
      setTimeLeft(timerSeconds)
      setPhase('intro')
    })
    getMatchSessions(config.matchId).then(setPastSessions)

    const linkedTeamIds = config.teamStudentIds
    if (linkedTeamIds?.some(Boolean) && typeof navigator !== 'undefined' && navigator.onLine) {
      import('../lib/ministry')
        .then((m) => m.getLeaderboard(500))
        .then((rows) => {
          const totals: Record<number, number> = {}
          linkedTeamIds.forEach((studentId, idx) => {
            const row = studentId && rows.find((r) => r.student_id === studentId)
            if (row) totals[idx] = row.total_points
          })
          setXpTotals(totals)
        })
        .catch(() => {
          // Offline mid-fetch, or the module failed to load - the secondary
          // XP line just stays hidden, nothing gameplay depends on.
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Soft ambient background music for the whole match, independent of the
  // sound-effects mute toggle - stops on unmount regardless of how the
  // screen is left (finished, quit, or just navigated away).
  useEffect(() => {
    sound.startMusic()
    return () => sound.stopMusic()
  }, [])

  // Ramps the music's intensity up for the last stretch of the ladder.
  useEffect(() => {
    sound.setMusicIntensity(currentLevel >= ladder.length - 2 ? 'intense' : 'calm')
  }, [currentLevel, ladder.length])

  // 3-2-1-GO intro sequence before this team's first question
  useEffect(() => {
    if (phase !== 'intro') return
    setIntroStep(3)
    sound.playCountIn(3)
    haptics.tap()
    let i = 0
    const interval = window.setInterval(() => {
      i++
      if (i >= COUNT_IN_STEPS.length) {
        window.clearInterval(interval)
        window.setTimeout(() => {
          if (config?.questionMode === 'pickNumber') {
            setPhase('picking')
          } else {
            questionStartRef.current = Date.now()
            setPhase('question')
          }
        }, 550)
        return
      }
      setIntroStep(COUNT_IN_STEPS[i])
      sound.playCountIn(COUNT_IN_STEPS[i])
      haptics.tap()
    }, 700)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const usesQuestionPicker = config?.questionMode === 'pickNumber'
  const isRotational = config?.mode === 'rotational'
  const activeTeamIndex = config ? (isRotational ? turnsCompleted % config.teamNames.length : config.teamIndex) : 0
  const currentQuestion = questions?.[currentLevel - 1]
  const teamName = config?.teamNames[activeTeamIndex] ?? ''
  const isLastTeam = config ? config.teamIndex >= config.teamNames.length - 1 : false
  const answers = answersByTeam[activeTeamIndex] ?? []

  const queueLeaderboardSync = useCallback(
    async (teamIdx: number, playerName: string, pointsWon: number, correctCount: number) => {
      if (!config) return
      const linkedStudentId = config.teamStudentIds?.[teamIdx]
      if (!linkedStudentId) return
      await db.pendingLeaderboardSync.add({
        studentId: linkedStudentId,
        studentName: playerName,
        classId: config.teamStudentClassIds?.[teamIdx] ?? null,
        setName: config.setName,
        seasonName: config.seasonName,
        points: pointsWon,
        correctCount,
        totalQuestions: ladder.length,
        createdAt: Date.now(),
        synced: 0,
      })
      import('../lib/leaderboardSync').then((m) => m.syncPendingLeaderboard())
    },
    [config, ladder.length]
  )

  // Marathon: finishes just the one team this Gameplay mount is running.
  const finishTurn = useCallback(
    async (outcome: GameOutcome, finalAnswers: AnswerRecord[]) => {
      if (!config) return
      setPhase('finishing')
      await getOrCreatePlayer(teamName)
      const correctCount = finalAnswers.filter((a) => a.correct).length
      const pointsWon = finalAnswers.reduce((sum, a) => sum + (a.correct ? a.points : 0), 0)
      const id = await db.gameSessions.add({
        matchId: config.matchId,
        teamIndex: config.teamIndex,
        playerName: teamName,
        playerPhoto: config.teamPhotos?.[config.teamIndex],
        setId: config.setId,
        setName: config.setName,
        seasonName: config.seasonName,
        startedAt: turnStartRef.current,
        finishedAt: Date.now(),
        outcome,
        levelReached: finalAnswers.length,
        pointsWon,
        totalLevels: ladder.length,
        correctCount,
        wrongCount: finalAnswers.length - correctCount,
        lifelinesUsed,
        answers: finalAnswers,
        timerSecondsPerQuestion: config.timerSecondsPerQuestion,
        studentId: config.teamStudentIds?.[config.teamIndex] ?? null,
        synced: 0,
      })
      if (isLastTeam) await completeMatch(config.matchId)
      await queueLeaderboardSync(config.teamIndex, teamName, pointsWon, correctCount)
      import('../lib/sessionSync').then((m) => m.syncPendingSessions())
      navigate(`/results/${id}`, { replace: true })
    },
    [config, lifelinesUsed, navigate, teamName, isLastTeam, queueLeaderboardSync, ladder.length]
  )

  // Rotational: the shared ladder is done (or ended early) - write every
  // team's own slice of answers at once and go straight to the match-wide
  // results, since there's no single "team just finished" screen that fits.
  const finishRotationalMatch = useCallback(
    async (outcome: GameOutcome, finalAnswersByTeam: Record<number, AnswerRecord[]>) => {
      if (!config) return
      setPhase('finishing')
      for (let idx = 0; idx < config.teamNames.length; idx++) {
        const teamAnswers = finalAnswersByTeam[idx] ?? []
        const name = config.teamNames[idx]
        await getOrCreatePlayer(name)
        const correctCount = teamAnswers.filter((a) => a.correct).length
        const pointsWon = teamAnswers.reduce((sum, a) => sum + (a.correct ? a.points : 0), 0)
        await db.gameSessions.add({
          matchId: config.matchId,
          teamIndex: idx,
          playerName: name,
          playerPhoto: config.teamPhotos?.[idx],
          setId: config.setId,
          setName: config.setName,
          seasonName: config.seasonName,
          startedAt: turnStartRef.current,
          finishedAt: Date.now(),
          outcome,
          levelReached: teamAnswers.length,
          pointsWon,
          totalLevels: ladder.length,
          correctCount,
          wrongCount: teamAnswers.length - correctCount,
          lifelinesUsed,
          answers: teamAnswers,
          timerSecondsPerQuestion: config.timerSecondsPerQuestion,
          studentId: config.teamStudentIds?.[idx] ?? null,
          synced: 0,
        })
        await queueLeaderboardSync(idx, name, pointsWon, correctCount)
      }
      await completeMatch(config.matchId)
      import('../lib/sessionSync').then((m) => m.syncPendingSessions())
      navigate(`/match-results/${config.matchId}`, { replace: true })
    },
    [config, lifelinesUsed, navigate, queueLeaderboardSync, ladder.length]
  )

  const reveal = useCallback(
    (index: number | null, wasTimeout: boolean) => {
      if (!currentQuestion) return
      setPhase('locked')
      setSelectedIndex(index)
      setTimedOut(wasTimeout)
      setRevealed(false)
      haptics.select()
      const correct = index === currentQuestion.correctIndex
      const timeTaken = Math.round((Date.now() - questionStartRef.current) / 1000)
      const record: AnswerRecord = {
        questionId: currentQuestion.id!,
        questionText: currentQuestion.text,
        options: currentQuestion.options,
        selectedIndex: index,
        correctIndex: currentQuestion.correctIndex,
        correct,
        timedOut: wasTimeout,
        timeTakenSec: timeTaken,
        level: currentLevel,
        points: pointsForLevel(currentLevel),
        funFact: currentQuestion.funFact,
      }
      setAnswersByTeam((prev) => ({ ...prev, [activeTeamIndex]: [...(prev[activeTeamIndex] ?? []), record] }))

      sound.playDrumroll(0.85)

      window.setTimeout(() => {
        setRevealed(true)
        const isMilestone = ladder.find((l) => l.level === currentLevel)?.isMilestone
        if (correct) {
          sound.playApplause()
          haptics.success()
          setFlash('green')
          setShowConfetti(true)
          if (isMilestone) sound.playCheckpoint()
          window.setTimeout(() => setFlash(null), 700)
          window.setTimeout(() => setShowConfetti(false), 1800)
        } else {
          sound.playOops()
          haptics.error()
          setFlash('red')
          setShake(true)
          window.setTimeout(() => setFlash(null), 700)
          window.setTimeout(() => setShake(false), 550)
        }
        window.setTimeout(() => setPhase('feedback'), 300)
      }, 850)
    },
    [activeTeamIndex, currentLevel, currentQuestion, ladder]
  )

  // Timer: ticks every second, getting faster and more alarming as it nears zero.
  useEffect(() => {
    if (phase !== 'question') return
    if (timeLeft <= 0) {
      reveal(null, true)
      return
    }
    sound.playTimerTick(timeLeft, timerSeconds)
    if (timeLeft <= 3) {
      haptics.tap()
      // The last few seconds get a full-screen red flash on every tick, not
      // just the timer box itself - meant to feel urgent, not just visible.
      setFlash('red')
      window.setTimeout(() => setFlash((f) => (f === 'red' ? null : f)), 400)
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  // Pausable from the two phases that would otherwise leave a timer running
  // or a decision hanging: an in-progress question (the countdown ticks in
  // the background) and the number-picker (nothing ticking there, but a
  // host may still want to freeze the screen). Remembers which one so
  // Resume lands back exactly where it paused, not always at 'question'.
  const handlePause = () => {
    if (phase !== 'question' && phase !== 'picking') return
    sound.playClick()
    haptics.tap()
    setPausedFrom(phase)
    setPhase('paused')
  }
  const handleResume = () => {
    sound.playClick()
    haptics.tap()
    setPhase(pausedFrom ?? 'question')
    setPausedFrom(null)
  }

  if (!config) return null
  if (!questions || phase === 'loading' || !currentQuestion) {
    return (
      <QuizStage step="play">
        <div style={{ padding: '80px 0', textAlign: 'center', fontSize: 20 }}>Loading game…</div>
      </QuizStage>
    )
  }

  if (phase === 'switching') {
    return (
      <QuizStage step="play">
        <NextUpReveal
          teamName={teamName}
          teamPhoto={config.teamPhotos?.[activeTeamIndex]}
          teamNumber={activeTeamIndex + 1}
          totalTeams={config.teamNames.length}
          questionNumber={turnsCompleted + 1}
          totalQuestions={ladder.length}
        />
      </QuizStage>
    )
  }

  if (phase === 'intro') {
    return (
      <QuizStage step="play">
        <IntroCountdown
          teamName={teamName}
          teamPhoto={config.teamPhotos?.[activeTeamIndex]}
          teamNumber={activeTeamIndex + 1}
          totalTeams={config.teamNames.length}
          step={introStep}
        />
      </QuizStage>
    )
  }

  if (phase === 'paused') {
    return (
      <QuizStage step="play">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '80px 0', textAlign: 'center', animation: 'qs-up .4s both' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: '.2em', color: '#ffd84d' }}>PAUSED</p>
          <h1 style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 'clamp(40px,6vw,72px)', lineHeight: 0.95, letterSpacing: '-.04em', color: '#fff' }}>Take a breath</h1>
          <p style={{ margin: 0, color: 'rgba(236,230,250,.6)' }}>Nothing is ticking while you're here. Resume whenever you're ready.</p>
          <button type="button" className="qs-gold" onClick={handleResume} style={goldBtn}>
            Resume
          </button>
        </div>
      </QuizStage>
    )
  }

  const handleSelect = (index: number) => {
    if (phase !== 'question' || disabledOptions.has(index)) return
    reveal(index, false)
  }

  const handlePickLevel = (level: number) => {
    sound.playWhoosh()
    haptics.tap()
    setCurrentLevel(level)
    setSelectedIndex(null)
    setDisabledOptions(new Set())
    setAudiencePoll(null)
    setFriendHint(null)
    setTimedOut(false)
    setRevealed(false)
    setTimeLeft(timerSeconds)
    questionStartRef.current = Date.now()
    setPhase('question')
  }

  const handleNext = () => {
    const justCompleted = turnsCompleted + 1
    if (justCompleted >= ladder.length) {
      setTurnsCompleted(justCompleted)
      if (isRotational) finishRotationalMatch('completed', answersByTeam)
      else finishTurn('completed', answers)
      return
    }
    sound.playWhoosh()
    haptics.tap()
    const wasTeamIndex = activeTeamIndex
    setTurnsCompleted(justCompleted)
    setSelectedIndex(null)
    setDisabledOptions(new Set())
    setAudiencePoll(null)
    setFriendHint(null)
    setTimedOut(false)
    setRevealed(false)
    // Random/Selected modes keep advancing straight through the ladder in
    // order, same as always - only Pick-a-Number hands the next question
    // choice to the contestant.
    if (!usesQuestionPicker) setCurrentLevel((l) => l + 1)
    // In rotational mode, the next question may belong to a different
    // team - a suspenseful "Next up" reveal of who's answering instead of
    // jumping straight into it.
    const nextTeamIndex = isRotational ? (justCompleted % config.teamNames.length) : wasTeamIndex
    if (isRotational && nextTeamIndex !== wasTeamIndex) {
      setPhase('switching')
      sound.playDrumroll(3.1)
      window.setTimeout(() => {
        sound.playCountIn(0)
        haptics.success()
      }, 3150)
      window.setTimeout(() => {
        if (usesQuestionPicker) {
          setPhase('picking')
        } else {
          setTimeLeft(timerSeconds)
          questionStartRef.current = Date.now()
          setPhase('question')
        }
      }, NEXT_UP_MS)
      return
    }
    if (usesQuestionPicker) {
      setPhase('picking')
    } else {
      setTimeLeft(timerSeconds)
      questionStartRef.current = Date.now()
      setPhase('question')
    }
  }

  const handleQuit = () => {
    if (isRotational) {
      if (!confirm('End the match now? Every team\'s score so far will be saved.')) return
      sound.playWalkAway()
      finishRotationalMatch('ended_early', answersByTeam)
      return
    }
    if (!confirm(`End ${teamName}'s turn now? Their score so far will be saved.`)) return
    sound.playWalkAway()
    finishTurn('ended_early', answers)
  }

  const useFiftyFifty = () => {
    if (lifelinesUsed.fiftyFifty || phase !== 'question') return
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctIndex && !disabledOptions.has(i))
    const toDisable = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2)
    setDisabledOptions(new Set(toDisable))
    setLifelinesUsed((v) => ({ ...v, fiftyFifty: true }))
    sound.playLifeline()
    haptics.tap()
  }

  const useAskChurch = () => {
    if (lifelinesUsed.askChurch || phase !== 'question') return
    const difficulty = currentQuestion.difficulty
    const confidence = 45 + (5 - difficulty) * 9 + Math.random() * 10
    const remainingIndices = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctIndex && !disabledOptions.has(i))
    const poll = [0, 0, 0, 0]
    poll[currentQuestion.correctIndex] = Math.round(confidence)
    const leftover = 100 - poll[currentQuestion.correctIndex]
    const shares = remainingIndices.map(() => Math.random())
    const shareSum = shares.reduce((a, b) => a + b, 0) || 1
    remainingIndices.forEach((idx, i) => {
      poll[idx] = Math.round((shares[i] / shareSum) * leftover)
    })
    setAudiencePoll(poll)
    setLifelinesUsed((v) => ({ ...v, askChurch: true }))
    setPhase('lifeline-audience')
    sound.playLifeline()
    haptics.tap()
  }

  const usePhoneFriend = () => {
    if (lifelinesUsed.phoneFriend || phase !== 'question') return
    const difficulty = currentQuestion.difficulty
    const accuracy = 78 - (difficulty - 1) * 8
    const isRight = Math.random() * 100 < accuracy
    let index: number = currentQuestion.correctIndex
    if (!isRight) {
      const wrongPool = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctIndex && !disabledOptions.has(i))
      index = wrongPool[Math.floor(Math.random() * wrongPool.length)] ?? currentQuestion.correctIndex
    }
    const line = FRIEND_LINES[Math.floor(Math.random() * FRIEND_LINES.length)]
    setFriendHint({ line, index })
    setLifelinesUsed((v) => ({ ...v, phoneFriend: true }))
    setPhase('lifeline-friend')
    sound.playLifeline()
    haptics.tap()
  }

  const dismissLifelinePanel = () => {
    sound.playClick()
    setPhase('question')
  }

  const optionLabel = (i: number) => String.fromCharCode(65 + i)
  const showResult = revealed && (phase === 'locked' || phase === 'feedback')
  const suspense = phase === 'locked' && !revealed
  const inLifeline = phase === 'lifeline-audience' || phase === 'lifeline-friend'
  const lastAnswer = answers[answers.length - 1]
  const tc = teamColour(activeTeamIndex)
  const ticking = phase === 'question'
  const urgent = ticking && timeLeft <= 5
  const clockCol = urgent ? '#ff5b6b' : '#2fe0b5'
  const clockText = timeLeft >= 60 ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : `00:${String(Math.max(0, timeLeft)).padStart(2, '0')}`
  const usedLevels = new Set(isRotational ? Object.values(answersByTeam).flat().map((a) => a.level) : answers.map((a) => a.level))
  const teamAnswersFor = (idx: number) => answersByTeam[idx] ?? pastSessions.find((s) => s.teamIndex === idx)?.answers ?? []
  const roundBtn: CSSProperties = { flexShrink: 0, height: 40, minWidth: 40, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
  const lifelines: [keyof LifelinesUsed, string, LucideIcon, () => void][] = [
    ['fiftyFifty', '50 / 50', Split, useFiftyFifty],
    ['askChurch', 'Ask the Church', Users, useAskChurch],
    ['phoneFriend', 'Ask a Friend', Phone, usePhoneFriend],
  ]
  const finalStep = turnsCompleted + 1 >= ladder.length

  return (
    <QuizStage step="play">
      <Confetti active={showConfetti} />
      {flash && <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />}

      <div className={shake ? 'animate-screen-shake' : ''} style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div key={`${turnsCompleted}-${activeTeamIndex}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 10px 10px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: `2px solid ${tc}`, animation: 'qs-pop .45s both', minWidth: 0 }}>
              {config.teamPhotos?.[activeTeamIndex] ? (
                <img src={config.teamPhotos[activeTeamIndex]} alt="" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: tc }} />
              )}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: 'rgba(236,230,250,.6)' }}>
                  NOW PLAYING{config.teamNames.length > 1 ? ` · TEAM ${activeTeamIndex + 1} OF ${config.teamNames.length}` : ''}
                </span>
                <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 22, color: '#fff', overflowWrap: 'anywhere' }}>{teamName}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderRadius: 20, background: '#07020f', border: `2px solid ${urgent ? 'rgba(255,91,107,.6)' : 'rgba(255,255,255,.12)'}`, boxShadow: 'inset 0 0 20px rgba(0,0,0,.8)' }}>
                <span role="timer" aria-label={`${timeLeft} seconds left`} style={{ fontFamily: mono, fontSize: 'clamp(44px,6vw,64px)', lineHeight: 1, letterSpacing: '.06em', color: phase === 'picking' ? 'rgba(236,230,250,.35)' : clockCol, textShadow: phase === 'picking' ? 'none' : `0 0 18px ${clockCol}`, animation: urgent ? 'qs-blink .5s infinite' : 'none' }}>
                  {phase === 'picking' ? `00:${String(timerSeconds).padStart(2, '0')}` : clockText}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(phase === 'question' || phase === 'picking') && (
                    <button type="button" onClick={handlePause} aria-label="Pause" title="Pause" style={roundBtn}>
                      <Pause style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                  <button type="button" onClick={() => setShowSettings(true)} aria-label="Quiz settings" title="Quiz settings" style={roundBtn}>
                    <Settings style={{ width: 16, height: 16 }} />
                  </button>
                </div>
                <button type="button" onClick={handleQuit} style={roundBtn}>
                  {isRotational ? 'End match' : 'End turn'}
                </button>
              </div>
            </div>
          </div>

          {showSettings && (
            <SettingsPanel
              sfxMuted={sfxMuted}
              musicMuted={musicMuted}
              musicVolume={musicVolume}
              timerSeconds={timerSeconds}
              onToggleSfx={() => {
                const next = !sfxMuted
                sound.setMuted(next)
                setSfxMuted(next)
              }}
              onToggleMusic={() => {
                const next = !musicMuted
                sound.setMusicMuted(next)
                setMusicMuted(next)
              }}
              onSetMusicVolume={(v) => {
                sound.setMusicVolume(v)
                setMusicVolumeState(v)
              }}
              onSetTimer={setTimerSeconds}
              onClose={() => setShowSettings(false)}
            />
          )}

          {phase === 'picking' ? (
            <QuestionPicker levels={ladder.map((l) => l.level)} usedLevels={usedLevels} onPick={handlePickLevel} pointsForLevel={pointsForLevel} />
          ) : (
            <div key={currentLevel} style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(22px,3.5vw,36px)', borderRadius: 30, background: 'linear-gradient(160deg,rgba(60,25,110,.9),rgba(20,8,42,.95))', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 40px 80px -40px rgba(0,0,0,.9)', animation: 'qs-reveal .6s cubic-bezier(.2,.9,.2,1) both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.16em', color: '#ffd84d' }}>
                  QUESTION {currentLevel} OF {ladder.length}
                  {currentQuestion.category ? <span style={{ color: 'rgba(236,230,250,.55)' }}> · {currentQuestion.category.toUpperCase()}</span> : null}
                  {suspense && <span style={{ marginLeft: 10, color: '#fff', animation: 'qs-blink .8s infinite' }}>LOCKING IN…</span>}
                </span>
                <span style={{ display: 'flex', gap: 4 }} title={`Level ${currentQuestion.difficulty} of 5`}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <span key={d} style={{ width: 10, height: 10, borderRadius: 3, background: d <= currentQuestion.difficulty ? '#ffd84d' : 'rgba(255,255,255,.12)' }} />
                  ))}
                </span>
              </div>
              <p style={{ margin: '16px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(28px,4vw,50px)', lineHeight: 1.08, letterSpacing: '-.025em', color: '#fff', textWrap: 'balance' }}>{currentQuestion.text}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 12, marginTop: 26 }}>
                {currentQuestion.options.map((opt, i) => {
                  const hidden = disabledOptions.has(i)
                  const isSelected = selectedIndex === i
                  const right = showResult && i === currentQuestion.correctIndex
                  const wrong = showResult && isSelected && !right
                  const held = suspense && isSelected
                  const bd = right ? '#2fe0b5' : wrong ? '#ff5b6b' : held ? '#ffd84d' : 'rgba(255,255,255,.14)'
                  const bg = right ? 'rgba(47,224,181,.2)' : wrong ? 'rgba(255,91,107,.16)' : held ? 'rgba(255,216,77,.16)' : 'rgba(255,255,255,.05)'
                  const chipBg = right ? '#2fe0b5' : wrong ? '#ff5b6b' : held ? '#ffd84d' : 'rgba(255,255,255,.12)'
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`qs-opt${held ? ' animate-drumroll' : ''}`}
                      disabled={phase !== 'question' || hidden}
                      onClick={() => handleSelect(i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 20, border: `2px solid ${bd}`, background: bg, color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 'clamp(17px,1.8vw,21px)', textAlign: 'left', cursor: phase === 'question' ? 'pointer' : 'default', visibility: hidden ? 'hidden' : 'visible', opacity: showResult && !right && !wrong ? 0.35 : 1, transform: right ? 'scale(1.03)' : 'none', boxShadow: right ? '0 0 40px rgba(47,224,181,.45)' : 'none', transition: 'all .45s cubic-bezier(.34,1.56,.64,1)' }}
                    >
                      <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: chipBg, color: right || held ? '#05261d' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontSize: 18 }}>{optionLabel(i)}</span>
                      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{opt}</span>
                      {audiencePoll && !showResult && !hidden && <span style={{ fontSize: 15, color: '#ffd84d' }}>{audiencePoll[i]}%</span>}
                    </button>
                  )
                })}
              </div>
              {friendHint && !showResult && phase !== 'feedback' && (
                <p style={{ margin: '16px 0 0', padding: '14px 18px', borderRadius: 16, background: 'rgba(79,123,255,.16)', border: '1px solid rgba(127,160,255,.35)', fontSize: 16, animation: 'qs-up .4s both' }}>
                  Your friend says: “{friendHint.line}{' '}
                  <strong style={{ color: '#ffd84d' }}>
                    {optionLabel(friendHint.index)}: {currentQuestion.options[friendHint.index]}
                  </strong>
                  ”
                </p>
              )}
              {phase === 'lifeline-audience' && <p style={{ margin: '16px 0 0', fontSize: 14, color: 'rgba(236,230,250,.7)' }}>Ask the Church says: the percentages are on each answer. The clock waits while the room looks.</p>}
              {phase === 'feedback' && lastAnswer && (
                <div style={{ margin: '16px 0 0', padding: '14px 18px', borderRadius: 16, background: lastAnswer.correct ? 'rgba(47,224,181,.14)' : 'rgba(255,91,107,.12)', border: `1px solid ${lastAnswer.correct ? 'rgba(47,224,181,.4)' : 'rgba(255,91,107,.35)'}`, animation: 'qs-up .4s both' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: '#fff' }}>
                    {timedOut
                      ? `Time's up! The answer was ${optionLabel(currentQuestion.correctIndex)}: ${currentQuestion.options[currentQuestion.correctIndex]}`
                      : lastAnswer.correct
                        ? `Correct! +${pointsForLevel(currentLevel)} points`
                        : `Not quite. The answer was ${optionLabel(currentQuestion.correctIndex)}: ${currentQuestion.options[currentQuestion.correctIndex]}`}
                  </p>
                  {currentQuestion.funFact && <p style={{ margin: '6px 0 0', fontSize: 15, color: 'rgba(236,230,250,.8)' }}>{currentQuestion.funFact}</p>}
                </div>
              )}
            </div>
          )}

          {phase !== 'picking' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {lifelines
                  .filter(([key]) => config.lifelines[key])
                  .map(([key, label, Icon, use]) => {
                    const used = lifelinesUsed[key]
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={use}
                        disabled={used || phase !== 'question'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 999, border: '1px solid rgba(255,216,77,.4)', background: 'rgba(255,216,77,.08)', color: '#ffd84d', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: used || phase !== 'question' ? 'default' : 'pointer', opacity: used ? 0.35 : 1, textDecoration: used ? 'line-through' : 'none', whiteSpace: 'nowrap' }}
                      >
                        <Icon style={{ width: 16, height: 16 }} />
                        {label}
                      </button>
                    )
                  })}
              </div>
              {inLifeline && (
                <button type="button" onClick={dismissLifelinePanel} style={{ padding: '15px 26px', borderRadius: 16, border: 'none', background: '#fff', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap', animation: 'qs-pop .4s both' }}>
                  Back to the question
                </button>
              )}
              {phase === 'feedback' && (
                <button type="button" onClick={handleNext} style={{ padding: '15px 26px', borderRadius: 16, border: 'none', background: '#fff', color: '#1a0f2e', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap', animation: 'qs-pop .4s both' }}>
                  {finalStep ? (isRotational ? 'See results' : `Finish ${teamName}'s turn`) : 'Next question →'}
                </button>
              )}
            </div>
          )}
        </div>

        <aside style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ffd84d' }}>SCOREBOARD</p>
            {config.teamNames.map((name, idx) => {
              const on = idx === activeTeamIndex
              const teamAnswers = teamAnswersFor(idx)
              const pts = teamAnswers.reduce((sum, a) => sum + (a.correct ? a.points : 0), 0)
              const own = isRotational ? ladder.filter((l) => (l.level - 1) % config.teamNames.length === idx) : ladder
              const photo = config.teamPhotos?.[idx]
              return (
                <div key={idx} style={{ padding: '10px 12px', marginTop: 6, borderRadius: 14, background: on ? 'rgba(255,255,255,.08)' : 'transparent', border: `1px solid ${on ? teamColour(idx) : 'rgba(255,255,255,.08)'}`, transition: 'all .3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {photo ? <img src={photo} alt="" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, objectFit: 'cover', border: `2px solid ${teamColour(idx)}` }} /> : <span style={{ flexShrink: 0, width: 10, height: 28, borderRadius: 4, background: teamColour(idx) }} />}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      {config.teamStudentIds?.[idx] && xpTotals[idx] !== undefined && <span style={{ display: 'block', fontSize: 11, color: 'rgba(236,230,250,.45)' }}>{xpTotals[idx].toLocaleString()} all-time points</span>}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 24, color: '#ffd84d' }}>
                      <CountUp value={pts} durationMs={500} />
                    </span>
                  </div>
                  {own.length <= 30 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {own.map((l) => {
                        const a = teamAnswers.find((rec) => rec.level === l.level)
                        return <span key={l.level} title={`Q${l.level}`} style={{ width: 9, height: 9, borderRadius: '50%', border: `1px solid ${!a ? 'rgba(255,255,255,.3)' : a.correct ? '#2fe0b5' : '#ff5b6b'}`, background: !a ? 'transparent' : a.correct ? '#2fe0b5' : '#ff5b6b' }} />
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#ffd84d' }}>THE LADDER</p>
            <div className="qs-noscroll" style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4, maxHeight: 460, overflowY: 'auto' }}>
              {ladder.map((l) => {
                const now = phase !== 'picking' && l.level === currentLevel
                const done = usedLevels.has(l.level) && !now
                return (
                  <div key={l.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 10, background: now ? '#ffd84d' : done ? 'rgba(47,224,181,.16)' : l.isMilestone ? 'rgba(193,59,255,.16)' : 'rgba(255,255,255,.04)', color: now ? '#1a0f2e' : done ? '#5cf0c8' : 'rgba(236,230,250,.6)', fontWeight: 800, fontSize: 13, animation: now ? 'qs-glow 1.6s infinite' : 'none' }}>
                    <span>{l.level}</span>
                    <span>{l.isMilestone ? (l.level === ladder.length ? 'CHAMPION' : 'MILESTONE') : `${l.level * l.points} pts`}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </QuizStage>
  )
}

/**
 * "Pick your next question" - a numbered board standing in for a physical
 * board of numbered question cards. A contestant taps any number still in
 * play; whichever one was answered already shows crossed out and disabled,
 * so the room can see at a glance what's left in the pool.
 */
function QuestionPicker({
  levels,
  usedLevels,
  onPick,
  pointsForLevel,
}: {
  levels: number[]
  usedLevels: Set<number>
  onPick: (level: number) => void
  pointsForLevel: (level: number) => number
}) {
  return (
    <div style={{ padding: 'clamp(22px,3.5vw,36px)', borderRadius: 30, background: 'linear-gradient(160deg,rgba(60,25,110,.9),rgba(20,8,42,.95))', border: '1px solid rgba(255,255,255,.14)', textAlign: 'center', animation: 'qs-up .4s both' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: '.16em', color: '#ffd84d' }}>PICK A NUMBER</p>
      <p style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(26px,3.4vw,40px)', color: '#fff' }}>Which question next?</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(76px,1fr))', gap: 10, marginTop: 22 }}>
        {levels.map((level) => {
          const used = usedLevels.has(level)
          return (
            <button
              key={level}
              type="button"
              className="qs-opt"
              disabled={used}
              onClick={() => onPick(level)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '14px 6px', borderRadius: 16, border: `2px solid ${used ? 'rgba(255,255,255,.08)' : 'rgba(255,216,77,.4)'}`, background: used ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)', color: used ? 'rgba(255,255,255,.3)' : '#fff', fontFamily: display, fontWeight: 800, fontSize: 24, cursor: used ? 'default' : 'pointer', textDecoration: used ? 'line-through' : 'none' }}
            >
              {level}
              {!used && <span style={{ fontFamily: 'inherit', fontSize: 11, color: '#ffd84d' }}>{pointsForLevel(level)} pts</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IntroCountdown({
  teamName,
  teamPhoto,
  teamNumber,
  totalTeams,
  step,
}: {
  teamName: string
  teamPhoto?: string
  teamNumber: number
  totalTeams: number
  step: 3 | 2 | 1 | 0
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {teamPhoto ? (
        <SquirclePhoto src={teamPhoto} className="h-40 w-40 sm:h-52 sm:w-52" />
      ) : (
        <img src="/children-ministry-logo-splash.png" alt="" className="h-32 w-auto object-contain drop-shadow-xl" />
      )}
      {totalTeams > 1 && (
        <p className="text-sm uppercase tracking-wide text-white/50">
          Team {teamNumber} of {totalTeams}
        </p>
      )}
      <p className="text-xl text-white/70">Get ready, {teamName}!</p>
      <div key={step} className="animate-number-pop font-display text-9xl font-extrabold text-amber-300 drop-shadow-[0_0_40px_rgba(250,204,21,0.6)]">
        {step === 0 ? 'GO!' : step}
      </div>
    </div>
  )
}

/**
 * A photo (or, with none set, a person silhouette) in a big rounded-square
 * "squircle" frame with a glowing gold ring. The superellipse-ish curve
 * comes from a large percentage border-radius, not a plain rounded-xl.
 */
function SquirclePhoto({ src, className = '', imgClassName = '' }: { src?: string; className?: string; imgClassName?: string }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[30%] bg-indigo-900/60 shadow-[0_0_60px_rgba(250,204,21,0.35)] ring-4 ring-amber-400/80 ${className}`}
    >
      {src ? (
        <img src={src} alt="" className={`h-full w-full object-cover ${imgClassName}`} />
      ) : (
        <svg viewBox="0 0 24 24" className={`h-full w-full fill-white/50 p-[12%] ${imgClassName}`} aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8v1H4z" />
        </svg>
      )}
    </div>
  )
}

/**
 * The 4-second handoff between contestants in rotational play: "NEXT UP",
 * the next contestant's photo in a big squircle sharpening out of a dark
 * blur as the drumroll builds, then their name popping in, with a bar
 * running out the remaining time before their question starts.
 */
function NextUpReveal({
  teamName,
  teamPhoto,
  teamNumber,
  totalTeams,
  questionNumber,
  totalQuestions,
}: {
  teamName: string
  teamPhoto?: string
  teamNumber: number
  totalTeams: number
  questionNumber: number
  totalQuestions: number
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
      <p className="animate-pulse font-display text-2xl font-extrabold uppercase tracking-[0.3em] text-amber-300 sm:text-3xl">
        Next up…
      </p>
      <SquirclePhoto
        src={teamPhoto}
        className="h-56 w-56 sm:h-72 sm:w-72 lg:h-80 lg:w-80"
        imgClassName="animate-next-up-focus"
      />
      <div className="animate-next-up-name">
        <p className="font-display text-4xl font-extrabold leading-tight [overflow-wrap:anywhere] sm:text-5xl">{teamName}</p>
        <p className="mt-1 text-sm uppercase tracking-wide text-white/60">
          {totalTeams > 1 ? `Team ${teamNumber} of ${totalTeams} · ` : ''}Question {questionNumber} of {totalQuestions}
        </p>
      </div>
      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10 sm:w-72">
        <div className="animate-next-up-bar h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300" />
      </div>
    </div>
  )
}

const SETTINGS_TIMER_OPTIONS = [15, 20, 30, 45, 60]

/**
 * Reachable mid-match via the ⚙️ button - sound effects, music, and the
 * per-question timer, all changeable without leaving or restarting the
 * game. The timer change only affects the next question onward (see the
 * timerSeconds comment where it's declared) so it can never shorten or
 * extend the one currently being timed.
 */
function SettingsPanel({
  sfxMuted,
  musicMuted,
  musicVolume,
  timerSeconds,
  onToggleSfx,
  onToggleMusic,
  onSetMusicVolume,
  onSetTimer,
  onClose,
}: {
  sfxMuted: boolean
  musicMuted: boolean
  musicVolume: number
  timerSeconds: number
  onToggleSfx: () => void
  onToggleMusic: () => void
  onSetMusicVolume: (value: number) => void
  onSetTimer: (seconds: number) => void
  onClose: () => void
}) {
  const [customTimer, setCustomTimer] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-[26px] border border-white/10 bg-[#1d0f33] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Quiz Settings</h3>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/80">Sound effects</span>
            <button
              onClick={onToggleSfx}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                sfxMuted ? 'bg-white/10 text-white/50' : 'bg-amber-400 text-purple-950'
              }`}
            >
              {sfxMuted ? 'Muted' : 'On'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/80">Background music</span>
            <button
              onClick={onToggleMusic}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                musicMuted ? 'bg-white/10 text-white/50' : 'bg-amber-400 text-purple-950'
              }`}
            >
              {musicMuted ? 'Muted' : 'On'}
            </button>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/80">Music volume</span>
              <span className="text-xs text-white/50">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              disabled={musicMuted}
              onChange={(e) => onSetMusicVolume(Number(e.target.value) / 100)}
              className="w-full accent-amber-400 disabled:opacity-40"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Timer per question (from next question)</p>
            <div className="flex flex-wrap items-center gap-2">
              {SETTINGS_TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => onSetTimer(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    timerSeconds === t ? 'bg-amber-400 text-purple-950' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {t}s
                </button>
              ))}
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 pl-3 pr-1.5">
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={customTimer}
                  onChange={(e) => setCustomTimer(e.target.value)}
                  placeholder="Custom"
                  className="w-16 bg-transparent py-1.5 text-sm font-semibold text-white outline-none placeholder:text-white/40"
                />
                <button
                  onClick={() => {
                    const n = Math.round(Number(customTimer))
                    if (Number.isFinite(n) && n >= 5 && n <= 600) onSetTimer(n)
                  }}
                  className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-purple-950 transition hover:scale-105"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
