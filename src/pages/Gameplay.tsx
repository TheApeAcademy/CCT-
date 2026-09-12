import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db, getOrCreatePlayer, completeMatch, getMatchSessions } from '../db/db'
import { LADDER, pointsForLevel, difficultyForLevel } from '../lib/ladder'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'
import Ladder from '../components/Ladder'
import CountUp from '../components/CountUp'
import type { AnswerRecord, GameConfig, GameOutcome, GameSession, LifelinesUsed, Question } from '../db/types'

type Phase = 'loading' | 'intro' | 'switching' | 'question' | 'locked' | 'feedback' | 'lifeline-audience' | 'lifeline-friend' | 'finishing'

const FRIEND_LINES = [
  "Hmm, I'm pretty sure it's...",
  "Ooh, I remember this one! I think it's...",
  "Let me think... I'll guess...",
  "I'm not 100% sure, but my best guess is...",
]

const COUNT_IN_STEPS: (3 | 2 | 1 | 0)[] = [3, 2, 1, 0]

export default function Gameplay() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state as GameConfig | undefined

  const [questions, setQuestions] = useState<Question[] | null>(null)
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
  const [showLadder, setShowLadder] = useState(false)
  // All-time ministry leaderboard total per team index, for teams linked to
  // a registered Student Code - best-effort only. The quiz itself must keep
  // working fully offline, so this is a silent, non-blocking fetch: no
  // network (or no linked teams at all) just means the secondary line never
  // appears, never a loading state gameplay waits on.
  const [xpTotals, setXpTotals] = useState<Record<number, number>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [sfxMuted, setSfxMuted] = useState(() => sound.isMuted())
  const [musicMuted, setMusicMuted] = useState(() => sound.isMusicMuted())
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
      setQuestions(qs.filter((q): q is NonNullable<typeof q> => !!q))
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
    sound.setMusicIntensity(currentLevel >= LADDER.length - 2 ? 'intense' : 'calm')
  }, [currentLevel])

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
          setPhase('question')
          questionStartRef.current = Date.now()
        }, 550)
        return
      }
      setIntroStep(COUNT_IN_STEPS[i])
      sound.playCountIn(COUNT_IN_STEPS[i])
      haptics.tap()
    }, 700)
    return () => window.clearInterval(interval)
  }, [phase])

  const isRotational = config?.mode === 'rotational'
  const activeTeamIndex = config ? (isRotational ? (currentLevel - 1) % config.teamNames.length : config.teamIndex) : 0
  const currentQuestion = questions?.[currentLevel - 1]
  const teamName = config?.teamNames[activeTeamIndex] ?? ''
  const isLastTeam = config ? config.teamIndex >= config.teamNames.length - 1 : false
  const answers = answersByTeam[activeTeamIndex] ?? []
  const runningScore = answers.reduce((sum, a) => sum + (a.correct ? a.points : 0), 0)

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
        totalQuestions: LADDER.length,
        createdAt: Date.now(),
        synced: 0,
      })
      import('../lib/leaderboardSync').then((m) => m.syncPendingLeaderboard())
    },
    [config]
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
        totalLevels: LADDER.length,
        correctCount,
        wrongCount: finalAnswers.length - correctCount,
        lifelinesUsed,
        answers: finalAnswers,
        timerSecondsPerQuestion: config.timerSecondsPerQuestion,
      })
      if (isLastTeam) await completeMatch(config.matchId)
      await queueLeaderboardSync(config.teamIndex, teamName, pointsWon, correctCount)
      navigate(`/results/${id}`, { replace: true })
    },
    [config, lifelinesUsed, navigate, teamName, isLastTeam, queueLeaderboardSync]
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
          totalLevels: LADDER.length,
          correctCount,
          wrongCount: teamAnswers.length - correctCount,
          lifelinesUsed,
          answers: teamAnswers,
          timerSecondsPerQuestion: config.timerSecondsPerQuestion,
        })
        await queueLeaderboardSync(idx, name, pointsWon, correctCount)
      }
      await completeMatch(config.matchId)
      navigate(`/match-results/${config.matchId}`, { replace: true })
    },
    [config, lifelinesUsed, navigate, queueLeaderboardSync]
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
        const isMilestone = LADDER.find((l) => l.level === currentLevel)?.isMilestone
        if (correct) {
          sound.playCorrect()
          sound.playApplause(1.4, 0.35)
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
    [activeTeamIndex, currentLevel, currentQuestion]
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

  if (!config) return null
  if (!questions || phase === 'loading' || !currentQuestion) {
    return <div className="py-20 text-center text-xl">Loading game…</div>
  }

  if (phase === 'intro' || phase === 'switching') {
    return (
      <IntroCountdown
        teamName={teamName}
        teamPhoto={config.teamPhotos?.[activeTeamIndex]}
        teamNumber={activeTeamIndex + 1}
        totalTeams={config.teamNames.length}
        step={phase === 'intro' ? introStep : null}
      />
    )
  }

  const handleSelect = (index: number) => {
    if (phase !== 'question' || disabledOptions.has(index)) return
    reveal(index, false)
  }

  const handleNext = () => {
    if (currentLevel >= LADDER.length) {
      if (isRotational) finishRotationalMatch('completed', answersByTeam)
      else finishTurn('completed', answers)
      return
    }
    sound.playWhoosh()
    haptics.tap()
    const wasTeamIndex = activeTeamIndex
    setCurrentLevel((l) => l + 1)
    setSelectedIndex(null)
    setDisabledOptions(new Set())
    setAudiencePoll(null)
    setFriendHint(null)
    setTimedOut(false)
    setRevealed(false)
    // In rotational mode, the next question may belong to a different
    // team - a quick "get ready" beat instead of jumping straight into it.
    const nextTeamIndex = isRotational ? (currentLevel % config.teamNames.length) : wasTeamIndex
    if (isRotational && nextTeamIndex !== wasTeamIndex) {
      setPhase('switching')
      window.setTimeout(() => {
        setPhase('question')
        questionStartRef.current = Date.now()
      }, 1400)
      setTimeLeft(timerSeconds)
      return
    }
    setTimeLeft(timerSeconds)
    questionStartRef.current = Date.now()
    setPhase('question')
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
    const difficulty = difficultyForLevel(currentLevel)
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
    const difficulty = difficultyForLevel(currentLevel)
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
  const isHeadToHead = config.teamNames.length === 2

  return (
    <div
      className={`relative flex flex-1 gap-1 px-1 py-2 sm:gap-3 sm:px-3 sm:py-3 ${shake ? 'animate-screen-shake' : ''} ${
        isHeadToHead ? 'w-full' : 'mx-auto w-full max-w-6xl'
      }`}
    >
      <Confetti active={showConfetti} />
      {flash && (
        <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />
      )}

      <div className="fixed right-3 top-3 z-50">
        <button
          onClick={() => setShowLadder((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          👑 Leaderboard
        </button>
        {showLadder && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-indigo-950 p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-white/80">Point Ladder</span>
              <button onClick={() => setShowLadder(false)} className="rounded-full bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20">
                ✕
              </button>
            </div>
            <Ladder currentLevel={currentLevel} />
          </div>
        )}
      </div>

      {isHeadToHead && (
        <SideStrip
          config={config}
          teamIdx={0}
          activeTeamIndex={activeTeamIndex}
          answersByTeam={answersByTeam}
          pastSessions={pastSessions}
          xpTotals={xpTotals}
        />
      )}

      <div className={`flex flex-1 flex-col justify-center gap-2 ${isHeadToHead ? 'mx-auto w-full max-w-2xl' : ''}`}>
        {phase === 'question' && <TimerBar timeLeft={timeLeft} total={timerSeconds} />}

        {isHeadToHead ? (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
              aria-label="Quiz settings"
            >
              ⚙️
            </button>
            <button onClick={handleQuit} className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              {isRotational ? 'End Match' : 'End Turn'}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {config.teamPhotos?.[activeTeamIndex] && (
                <img
                  src={config.teamPhotos[activeTeamIndex]}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover shadow-lg shadow-black/40 ring-2 ring-amber-400/60"
                />
              )}
              <div>
                <p className="text-sm text-white/60">
                  Team {activeTeamIndex + 1} of {config.teamNames.length}
                </p>
                <p className="font-display text-xl font-bold">{teamName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-white/60">Score</p>
                <p className="text-lg font-bold text-amber-300">
                  <CountUp value={runningScore} durationMs={500} /> 👑
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                aria-label="Quiz settings"
              >
                ⚙️
              </button>
              <button onClick={handleQuit} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                {isRotational ? 'End Match' : 'End Turn'}
              </button>
            </div>
          </div>
        )}

        {showSettings && (
          <SettingsPanel
            sfxMuted={sfxMuted}
            musicMuted={musicMuted}
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
            onSetTimer={setTimerSeconds}
            onClose={() => setShowSettings(false)}
          />
        )}

        <div className="hex-frame mx-auto w-full max-w-3xl">
          <div className="hex-fill flex min-h-[80px] flex-col items-center justify-center gap-1.5 px-6 py-3 text-center sm:min-h-[100px]">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-black/30 px-3 py-1 font-bold">
                Q{currentLevel} of {LADDER.length}
              </span>
              <span className="rounded-full bg-black/30 px-3 py-1">{currentQuestion.category}</span>
              {suspense && <span className="animate-pulse text-amber-300">● locking in…</span>}
            </div>
            <p className="font-display text-lg font-bold leading-snug sm:text-xl">{currentQuestion.text}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {currentQuestion.options.map((opt, i) => {
            const isDisabled = disabledOptions.has(i)
            const isSelected = selectedIndex === i
            const isCorrectAnswer = i === currentQuestion.correctIndex

            let fillClasses = 'from-indigo-800/80 to-indigo-950/80'
            let borderClass = 'border-white/20'
            if (isDisabled) fillClasses = 'from-slate-800/40 to-slate-900/40'
            if (suspense && isSelected) {
              fillClasses = 'from-amber-500/70 to-amber-600/70'
              borderClass = 'border-amber-200'
            }
            if (showResult) {
              if (isCorrectAnswer) {
                fillClasses = 'from-green-600/90 to-green-800/90'
                borderClass = 'border-green-200'
              } else if (isSelected) {
                fillClasses = 'from-red-600/90 to-red-800/90'
                borderClass = 'border-red-200'
              } else {
                fillClasses = 'from-slate-800/40 to-slate-900/40'
                borderClass = 'border-white/10'
              }
            }

            return (
              <button
                key={i}
                disabled={phase !== 'question' || isDisabled}
                onClick={() => handleSelect(i)}
                className={`hex-pill flex items-center gap-3 border-2 bg-gradient-to-br px-5 py-2.5 text-left text-base font-semibold text-white transition-all duration-300 ${fillClasses} ${borderClass} ${
                  isDisabled ? 'opacity-30' : ''
                } ${phase === 'question' && !isDisabled ? 'cursor-pointer hover:scale-[1.02] hover:brightness-110' : ''} ${
                  suspense && isSelected ? 'animate-drumroll' : ''
                }`}
              >
                <span className="shrink-0 text-amber-300">◆</span>
                <span className="shrink-0 font-bold">{optionLabel(i)}:</span>
                <span className="truncate">{opt}</span>
                {showResult && isCorrectAnswer && <span className="ml-auto shrink-0 text-xl">✅</span>}
                {showResult && isSelected && !isCorrectAnswer && <span className="ml-auto shrink-0 text-xl">❌</span>}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <LifelineButton label="50/50" icon="✂️" used={lifelinesUsed.fiftyFifty} available={config.lifelines.fiftyFifty} onClick={useFiftyFifty} />
          <LifelineButton
            label="Ask the Church"
            icon="🙋"
            used={lifelinesUsed.askChurch}
            available={config.lifelines.askChurch}
            onClick={useAskChurch}
          />
          <LifelineButton
            label="Ask a Friend"
            icon="📞"
            used={lifelinesUsed.phoneFriend}
            available={config.lifelines.phoneFriend}
            onClick={usePhoneFriend}
          />
        </div>

        {phase === 'feedback' && (
          <div
            className={`animate-page-in rounded-2xl p-3 text-center ring-1 ${
              answers[answers.length - 1]?.correct ? 'bg-green-900/40 ring-green-400/30' : 'bg-red-900/30 ring-red-400/30'
            }`}
          >
            <p className="mb-2 font-display text-lg font-bold">
              {timedOut
                ? "⏰ Time's up!"
                : answers[answers.length - 1]?.correct
                  ? `✅ Correct! +${pointsForLevel(currentLevel).toLocaleString()} points`
                  : `❌ Not quite. The correct answer was ${optionLabel(currentQuestion.correctIndex)}: ${currentQuestion.options[currentQuestion.correctIndex]}`}
            </p>
            {currentQuestion.funFact && <p className="mb-3 text-sm text-white/70">💡 {currentQuestion.funFact}</p>}
            <button
              onClick={handleNext}
              className="animate-pulse-glow rounded-xl bg-amber-400 px-6 py-3 font-bold text-purple-950 transition hover:scale-105"
            >
              {currentLevel >= LADDER.length ? (isRotational ? 'Finish Match →' : `Finish ${teamName}'s Turn →`) : `Next Question →`}
            </button>
          </div>
        )}

        {phase === 'lifeline-audience' && audiencePoll && (
          <LifelinePanel onDismiss={dismissLifelinePanel} title="🙋 Ask the Church says...">
            <div className="space-y-2">
              {currentQuestion.options.map((_opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 font-bold">{optionLabel(i)}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-700"
                      style={{ width: `${audiencePoll[i]}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-sm">{audiencePoll[i]}%</span>
                </div>
              ))}
            </div>
          </LifelinePanel>
        )}

        {phase === 'lifeline-friend' && friendHint && (
          <LifelinePanel onDismiss={dismissLifelinePanel} title="📞 Ask a Friend">
            <p className="text-lg">
              "{friendHint.line}{' '}
              <span className="font-bold text-amber-300">
                {optionLabel(friendHint.index)}: {currentQuestion.options[friendHint.index]}
              </span>
              "
            </p>
          </LifelinePanel>
        )}
      </div>

      {isHeadToHead ? (
        <SideStrip
          config={config}
          teamIdx={1}
          activeTeamIndex={activeTeamIndex}
          answersByTeam={answersByTeam}
          pastSessions={pastSessions}
          xpTotals={xpTotals}
        />
      ) : (
        <div className="hidden shrink-0 lg:flex lg:w-[220px] lg:flex-col lg:justify-center lg:gap-2">
          <LiveScoreboard
            config={config}
            answersByTeam={answersByTeam}
            activeTeamIndex={activeTeamIndex}
            pastSessions={pastSessions}
            xpTotals={xpTotals}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Every contestant in the match, live: name, running points, and a row of
 * small circles - one per question - filled green/red as they're answered
 * and left hollow/transparent for whatever hasn't been reached yet. Looks
 * answers up by their recorded ladder level (not array position), since in
 * rotational mode a team's own answers are a sparse subset of the shared
 * ladder rather than one-per-level in order like marathon mode. Teams that
 * already finished their turn (marathon only) show their final completed
 * row from pastSessions; everyone else shows their live answersByTeam.
 */
function LiveScoreboard({
  config,
  answersByTeam,
  activeTeamIndex,
  pastSessions,
  xpTotals,
}: {
  config: GameConfig
  answersByTeam: Record<number, AnswerRecord[]>
  activeTeamIndex: number
  pastSessions: GameSession[]
  xpTotals: Record<number, number>
}) {
  return (
    <div className="space-y-2">
      {config.teamNames.map((name, idx) => {
        const isCurrent = idx === activeTeamIndex
        const finished = pastSessions.find((s) => s.teamIndex === idx)
        const teamAnswers = answersByTeam[idx] ?? finished?.answers ?? []
        const correctCount = teamAnswers.filter((a) => a.correct).length
        const isLinked = !!config.teamStudentIds?.[idx]
        return (
          <div key={idx} className={`rounded-xl p-3 ${isCurrent ? 'bg-amber-400/10 ring-1 ring-amber-400/40' : 'bg-white/5'}`}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className={`truncate font-bold ${isCurrent ? 'text-amber-300' : 'text-white/80'}`}>{name}</span>
              <span className="shrink-0 font-bold text-amber-300">
                {correctCount}/{LADDER.length} ✓
              </span>
            </div>
            {isLinked && xpTotals[idx] !== undefined && (
              <p className="text-right text-xs text-white/40">🏆 {xpTotals[idx].toLocaleString()} all-time</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {LADDER.map((l) => {
                const a = teamAnswers.find((rec) => rec.level === l.level)
                const state = !a ? 'pending' : a.correct ? 'correct' : 'wrong'
                return (
                  <span
                    key={l.level}
                    title={`Q${l.level}`}
                    className={`h-3 w-3 rounded-full border ${
                      state === 'correct'
                        ? 'border-green-300 bg-green-500'
                        : state === 'wrong'
                          ? 'border-red-300 bg-red-500'
                          : 'border-white/30 bg-transparent'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
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
  /** null for the brief "up next" beat between rotational turns - no numeric countdown, just the handoff. */
  step: 3 | 2 | 1 | 0 | null
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      {teamPhoto ? (
        <img src={teamPhoto} alt="" className="h-24 w-24 rounded-full object-cover shadow-xl shadow-black/40 ring-4 ring-amber-400/60" />
      ) : (
        <img src="/children-ministry-logo-splash.png" alt="" className="h-32 w-auto object-contain drop-shadow-xl" />
      )}
      {totalTeams > 1 && (
        <p className="text-sm uppercase tracking-wide text-white/50">
          Team {teamNumber} of {totalTeams}
        </p>
      )}
      <p className="text-xl text-white/70">{step === null ? `Up next, ${teamName}!` : `Get ready, ${teamName}!`}</p>
      {step !== null && (
        <div key={step} className="animate-number-pop font-display text-9xl font-extrabold text-amber-300 drop-shadow-[0_0_40px_rgba(250,204,21,0.6)]">
          {step === 0 ? 'GO!' : step}
        </div>
      )}
    </div>
  )
}

/**
 * The prominent, always-visible (including on mobile) head-to-head display
 * for a 2-contestant rotational match: both names/photos, running points,
 * and each one's row of pending/correct/wrong circles side by side, live.
 */
/**
 * One contestant's own vertical strip for a 2-player head-to-head match -
 * not boxed in a card, just laid directly against the side of the screen:
 * their all-time XP at the very top, name and photo (falling back to the
 * ministry logo, never blank, if no photo was set), then their per-question
 * circles stretching down the full height of the strip (a real flex-1
 * column, not a fixed-size cluster) to match the question+options block
 * beside it, and their correct-answer total at the very bottom.
 */
function SideStrip({
  config,
  teamIdx,
  activeTeamIndex,
  answersByTeam,
  pastSessions,
  xpTotals,
}: {
  config: GameConfig
  teamIdx: number
  activeTeamIndex: number
  answersByTeam: Record<number, AnswerRecord[]>
  pastSessions: GameSession[]
  xpTotals: Record<number, number>
}) {
  const name = config.teamNames[teamIdx]
  const isActive = teamIdx === activeTeamIndex
  const finished = pastSessions.find((s) => s.teamIndex === teamIdx)
  const teamAnswers = answersByTeam[teamIdx] ?? finished?.answers ?? []
  const correctCount = teamAnswers.filter((a) => a.correct).length
  const isLinked = !!config.teamStudentIds?.[teamIdx]
  const photo = config.teamPhotos?.[teamIdx]

  return (
    <div className="flex w-16 shrink-0 flex-col items-center text-center sm:w-24">
      {isLinked && xpTotals[teamIdx] !== undefined && (
        <p className="text-[10px] font-bold text-white/40">🏆 {xpTotals[teamIdx].toLocaleString()}</p>
      )}
      {photo ? (
        <img
          src={photo}
          alt=""
          className={`mt-1 h-14 w-14 rounded-full object-cover ring-2 sm:h-20 sm:w-20 ${isActive ? 'ring-amber-400' : 'ring-amber-400/40'}`}
        />
      ) : (
        <PersonSilhouette active={isActive} />
      )}
      <p className={`mt-1.5 truncate px-1 text-base font-extrabold sm:text-lg ${isActive ? 'text-amber-300' : 'text-white/90'}`}>
        {name}
      </p>

      {/* Capped to roughly half the strip's height, not stretched to match
          the whole center column - tight, fixed gaps between circles rather
          than justify-evenly spreading them across all available space. */}
      <div className="my-2 flex max-h-[46vh] flex-1 flex-col items-center justify-center gap-2.5 overflow-y-auto">
        {LADDER.map((l) => {
          const a = teamAnswers.find((rec) => rec.level === l.level)
          const state = !a ? 'pending' : a.correct ? 'correct' : 'wrong'
          return (
            <span
              key={l.level}
              title={`Q${l.level}`}
              className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                state === 'correct'
                  ? 'border-green-200 bg-green-500'
                  : state === 'wrong'
                    ? 'border-red-200 bg-red-500'
                    : 'border-white/40 bg-transparent'
              } ${isActive ? 'shadow-[0_0_10px_rgba(250,204,21,0.6)]' : ''}`}
            />
          )
        })}
      </div>

      <p className="text-sm font-extrabold text-amber-300">
        TOTAL: <CountUp value={correctCount} durationMs={400} />
      </p>
    </div>
  )
}

/** No-photo fallback: a plain person silhouette rather than the ministry logo, so an empty slot reads as "no photo set" not as a branding mark. */
function PersonSilhouette({ active }: { active: boolean }) {
  return (
    <div
      className={`mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 sm:h-20 sm:w-20 ${
        active ? 'ring-amber-400' : 'ring-white/20'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3/4 w-3/4 fill-white/50" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8v1H4z" />
      </svg>
    </div>
  )
}

function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  void total
  const urgent = timeLeft <= 6
  const alarming = timeLeft <= 3
  const mm = Math.floor(timeLeft / 60)
  const ss = timeLeft % 60
  const display = timeLeft >= 60 ? `${mm}:${ss.toString().padStart(2, '0')}` : ss.toString().padStart(2, '0')

  // Purely cosmetic fast-ticking milliseconds, decoupled from the real
  // once-a-second countdown above (which is what actually times the
  // question out) - just makes the clock read as live rather than static.
  const [ms, setMs] = useState(999)
  useEffect(() => {
    const id = window.setInterval(() => {
      setMs((m) => (m <= 0 ? 999 : m - 33))
    }, 33)
    return () => window.clearInterval(id)
  }, [])

  const colorClass = alarming ? 'text-red-500' : urgent ? 'text-red-400' : 'text-amber-300'

  return (
    <div key={alarming ? timeLeft : 'calm'} className={`flex justify-center ${alarming ? 'animate-screen-shake' : ''}`}>
      <div
        className={`rounded-2xl border-2 bg-black px-8 py-4 shadow-inner shadow-black/80 transition-colors ${
          urgent ? 'border-red-500/70' : 'border-amber-400/50'
        }`}
      >
        <div className={`flex items-end gap-2 ${alarming ? 'animate-bounce' : urgent ? 'animate-pulse' : ''} ${colorClass}`}>
          <SevenSegmentClock text={display} size={1.5} />
          <SevenSegmentClock text={`.${ms.toString().padStart(3, '0')}`} size={0.6} />
        </div>
      </div>
    </div>
  )
}

const SEVEN_SEG_MAP: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgecd',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

/**
 * A genuine seven-segment LCD-style readout - each digit built from real
 * segment bars (lit vs unlit, both rendered so the "unlit" segments show
 * faintly like a real display) rather than just a bold monospace font.
 * `:` renders as two stacked dots and `.` as a single one, both baseline-
 * aligned with the digits beside them.
 */
function SevenSegmentClock({ text, size = 1 }: { text: string; size?: number }) {
  return (
    <div className="flex items-end gap-[3px]">
      {text.split('').map((ch, i) => {
        if (ch === ':') return <SevenSegColon key={i} size={size} />
        if (ch === '.') return <SevenSegDot key={i} size={size} />
        return <SevenSegDigit key={i} lit={SEVEN_SEG_MAP[ch] ?? ''} size={size} />
      })}
    </div>
  )
}

function SevenSegDigit({ lit, size }: { lit: string; size: number }) {
  const w = 26 * size
  const h = 46 * size
  const t = 5.5 * size
  const half = h / 2
  const vH = half - t
  const has = (s: string) => lit.includes(s)
  const bar = (on: boolean, style: React.CSSProperties) => (
    <div
      style={{ position: 'absolute', borderRadius: t / 2, ...style, background: on ? 'currentColor' : 'rgba(255,255,255,0.07)' }}
    />
  )
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      {bar(has('a'), { top: 0, left: t / 2, width: w - t, height: t })}
      {bar(has('g'), { top: half - t / 2, left: t / 2, width: w - t, height: t })}
      {bar(has('d'), { top: h - t, left: t / 2, width: w - t, height: t })}
      {bar(has('f'), { top: t, left: 0, width: t, height: vH })}
      {bar(has('b'), { top: t, left: w - t, width: t, height: vH })}
      {bar(has('e'), { top: half, left: 0, width: t, height: vH })}
      {bar(has('c'), { top: half, left: w - t, width: t, height: vH })}
    </div>
  )
}

function SevenSegColon({ size }: { size: number }) {
  const d = 6 * size
  const h = 46 * size
  return (
    <div style={{ position: 'relative', width: d, height: h }}>
      <div style={{ position: 'absolute', top: h * 0.28, left: 0, width: d, height: d, borderRadius: 999, background: 'currentColor' }} />
      <div style={{ position: 'absolute', top: h * 0.62, left: 0, width: d, height: d, borderRadius: 999, background: 'currentColor' }} />
    </div>
  )
}

function SevenSegDot({ size }: { size: number }) {
  const d = 6 * size
  const h = 46 * size
  return (
    <div style={{ position: 'relative', width: d, height: h }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: d, height: d, borderRadius: 999, background: 'currentColor' }} />
    </div>
  )
}

function LifelineButton({
  label,
  icon,
  used,
  available,
  onClick,
}: {
  label: string
  icon: string
  used: boolean
  available: boolean
  onClick: () => void
}) {
  if (!available) return null
  return (
    <button
      onClick={onClick}
      disabled={used}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        used ? 'bg-white/5 text-white/30 line-through' : 'bg-white/10 hover:bg-white/20 hover:scale-105'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
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
  timerSeconds,
  onToggleSfx,
  onToggleMusic,
  onSetTimer,
  onClose,
}: {
  sfxMuted: boolean
  musicMuted: boolean
  timerSeconds: number
  onToggleSfx: () => void
  onToggleMusic: () => void
  onSetTimer: (seconds: number) => void
  onClose: () => void
}) {
  const [customTimer, setCustomTimer] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-indigo-950 p-5 shadow-2xl"
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

function LifelinePanel({ title, children, onDismiss }: { title: string; children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div className="animate-page-in rounded-2xl bg-indigo-950/60 p-5">
      <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
      {children}
      <button onClick={onDismiss} className="mt-4 w-full rounded-xl bg-amber-400 py-2 font-bold text-purple-950 transition hover:scale-[1.02]">
        Got it, back to the question
      </button>
    </div>
  )
}
