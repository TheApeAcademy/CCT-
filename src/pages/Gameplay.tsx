import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db, getOrCreatePlayer, completeMatch } from '../db/db'
import { LADDER, pointsForLevel, difficultyForLevel } from '../lib/ladder'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'
import Ladder from '../components/Ladder'
import CountUp from '../components/CountUp'
import type { AnswerRecord, GameConfig, GameOutcome, LifelinesUsed, Question } from '../db/types'

type Phase = 'loading' | 'intro' | 'question' | 'locked' | 'feedback' | 'lifeline-audience' | 'lifeline-friend' | 'finishing'

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
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

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
      setTimeLeft(config.timerSecondsPerQuestion)
      setPhase('intro')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const currentQuestion = questions?.[currentLevel - 1]
  const teamName = config?.teamNames[config.teamIndex] ?? ''
  const isLastTeam = config ? config.teamIndex >= config.teamNames.length - 1 : false
  const runningScore = answers.reduce((sum, a) => sum + (a.correct ? a.points : 0), 0)

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

      // If this team is linked to a registered Student Code, queue the
      // result for the ministry leaderboard. Always succeeds locally first
      // — the sync itself (and its Supabase bundle) only loads afterward.
      const linkedStudentId = config.teamStudentIds?.[config.teamIndex]
      if (linkedStudentId) {
        await db.pendingLeaderboardSync.add({
          studentId: linkedStudentId,
          studentName: teamName,
          classId: config.teamStudentClassIds?.[config.teamIndex] ?? null,
          setName: config.setName,
          seasonName: config.seasonName,
          points: pointsWon,
          correctCount,
          totalQuestions: LADDER.length,
          createdAt: Date.now(),
          synced: 0,
        })
        import('../lib/leaderboardSync').then((m) => m.syncPendingLeaderboard())
      }

      navigate(`/results/${id}`, { replace: true })
    },
    [config, lifelinesUsed, navigate, teamName, isLastTeam]
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
      const nextAnswers = [...answers, record]
      setAnswers(nextAnswers)

      sound.playDrumroll(0.85)

      window.setTimeout(() => {
        setRevealed(true)
        const isMilestone = LADDER.find((l) => l.level === currentLevel)?.isMilestone
        if (correct) {
          sound.playCorrect()
          haptics.success()
          setFlash('green')
          setShowConfetti(true)
          if (isMilestone) sound.playCheckpoint()
          window.setTimeout(() => setFlash(null), 700)
          window.setTimeout(() => setShowConfetti(false), 1800)
        } else {
          sound.playWrong()
          haptics.error()
          setFlash('red')
          setShake(true)
          window.setTimeout(() => setFlash(null), 700)
          window.setTimeout(() => setShake(false), 550)
        }
        window.setTimeout(() => setPhase('feedback'), 300)
      }, 850)
    },
    [answers, currentLevel, currentQuestion]
  )

  // Timer: ticks every second, getting faster and more alarming as it nears zero.
  useEffect(() => {
    if (phase !== 'question') return
    if (timeLeft <= 0) {
      reveal(null, true)
      return
    }
    sound.playTimerTick(timeLeft, config?.timerSecondsPerQuestion ?? 30)
    if (timeLeft <= 3) haptics.tap()
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  if (!config) return null
  if (!questions || phase === 'loading' || !currentQuestion) {
    return <div className="py-20 text-center text-xl">Loading game…</div>
  }

  if (phase === 'intro') {
    return (
      <IntroCountdown
        teamName={teamName}
        teamPhoto={config.teamPhotos?.[config.teamIndex]}
        teamNumber={config.teamIndex + 1}
        totalTeams={config.teamNames.length}
        step={introStep}
      />
    )
  }

  const handleSelect = (index: number) => {
    if (phase !== 'question' || disabledOptions.has(index)) return
    reveal(index, false)
  }

  const handleNext = () => {
    if (currentLevel >= LADDER.length) {
      finishTurn('completed', answers)
      return
    }
    sound.playWhoosh()
    haptics.tap()
    setCurrentLevel((l) => l + 1)
    setSelectedIndex(null)
    setDisabledOptions(new Set())
    setAudiencePoll(null)
    setFriendHint(null)
    setTimedOut(false)
    setRevealed(false)
    setTimeLeft(config.timerSecondsPerQuestion)
    questionStartRef.current = Date.now()
    setPhase('question')
  }

  const handleQuit = () => {
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

  return (
    <div className={`relative grid gap-4 lg:grid-cols-[1fr_220px] ${shake ? 'animate-screen-shake' : ''}`}>
      <Confetti active={showConfetti} />
      {flash && (
        <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {config.teamPhotos?.[config.teamIndex] && (
              <img
                src={config.teamPhotos[config.teamIndex]}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover shadow-lg shadow-black/40 ring-2 ring-amber-400/60"
              />
            )}
            <div>
              <p className="text-sm text-white/60">
                Team {config.teamIndex + 1} of {config.teamNames.length}
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
            <button onClick={handleQuit} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              End Turn
            </button>
          </div>
        </div>

        {phase === 'question' && <TimerBar timeLeft={timeLeft} total={config.timerSecondsPerQuestion} />}

        <div className="mt-8 flex justify-center">
          <img
            src="/church-logo.png"
            alt=""
            aria-hidden="true"
            className="relative z-10 -mb-8 h-16 w-16 rounded-full shadow-lg shadow-black/40 ring-2 ring-amber-400/60 sm:h-20 sm:w-20"
          />
        </div>
        <div className="hex-frame mx-auto w-full max-w-3xl">
          <div className="hex-fill flex min-h-[110px] flex-col items-center justify-center gap-2 px-10 py-6 text-center sm:min-h-[130px]">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-black/30 px-3 py-1 font-bold">
                Q{currentLevel} of {LADDER.length}
              </span>
              <span className="rounded-full bg-black/30 px-3 py-1">{currentQuestion.category}</span>
              {suspense && <span className="animate-pulse text-amber-300">● locking in…</span>}
            </div>
            <p className="font-display text-xl font-bold leading-snug sm:text-2xl">{currentQuestion.text}</p>
          </div>
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
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
                className={`hex-pill flex items-center gap-3 border-2 bg-gradient-to-br px-6 py-4 text-left text-lg font-semibold text-white transition-all duration-300 ${fillClasses} ${borderClass} ${
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

        <div className="flex flex-wrap gap-3">
          <LifelineButton label="50/50" icon="✂️" used={lifelinesUsed.fiftyFifty} available={config.lifelines.fiftyFifty} onClick={useFiftyFifty} />
          <LifelineButton
            label="Ask the Church"
            icon="🙋"
            used={lifelinesUsed.askChurch}
            available={config.lifelines.askChurch}
            onClick={useAskChurch}
          />
          <LifelineButton
            label="Phone a Friend"
            icon="📞"
            used={lifelinesUsed.phoneFriend}
            available={config.lifelines.phoneFriend}
            onClick={usePhoneFriend}
          />
        </div>

        {phase === 'feedback' && (
          <div
            className={`animate-page-in rounded-2xl p-5 text-center ring-1 ${
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
              {currentLevel >= LADDER.length ? `Finish ${teamName}'s Turn →` : `Next Question →`}
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
          <LifelinePanel onDismiss={dismissLifelinePanel} title="📞 Phone a Friend">
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

      <div className="hidden lg:block">
        <Ladder currentLevel={currentLevel} />
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
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      {teamPhoto ? (
        <img src={teamPhoto} alt="" className="h-24 w-24 rounded-full object-cover shadow-xl shadow-black/40 ring-4 ring-amber-400/60" />
      ) : (
        <img src="/church-logo.png" alt="" className="h-20 w-20 rounded-full shadow-xl shadow-black/40 ring-2 ring-amber-400/50" />
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

function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, (timeLeft / total) * 100)
  const urgent = timeLeft <= 6
  const alarming = timeLeft <= 3
  return (
    <div key={alarming ? timeLeft : 'calm'} className={`space-y-1 ${alarming ? 'animate-screen-shake' : ''}`}>
      <div className="h-4 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? 'bg-red-500' : 'bg-amber-400'} ${
            alarming ? 'animate-pulse' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-center text-sm font-bold ${alarming ? 'animate-bounce text-red-400' : urgent ? 'animate-pulse text-red-400' : 'text-white/60'}`}>
        {timeLeft}s
      </p>
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
