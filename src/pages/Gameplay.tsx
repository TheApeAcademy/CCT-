import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db, getOrCreatePlayer } from '../db/db'
import { LADDER, pointsForLevel, lastCheckpointPoints, difficultyForLevel } from '../lib/ladder'
import { selectQuestionsForGame } from '../lib/selectQuestions'
import * as sound from '../lib/sound'
import { haptics } from '../lib/haptics'
import Confetti from '../components/Confetti'
import Ladder from '../components/Ladder'
import CountUp from '../components/CountUp'
import type { AnswerRecord, GameConfig, GameOutcome, LifelinesUsed, Question } from '../db/types'

type Phase = 'loading' | 'intro' | 'question' | 'locked' | 'correct-prompt' | 'lifeline-audience' | 'lifeline-friend' | 'finishing'

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
  const [justCheckpoint, setJustCheckpoint] = useState(false)

  const questionStartRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!config) {
      navigate('/setup', { replace: true })
      return
    }
    db.questions
      .where('setId')
      .equals(config.setId)
      .toArray()
      .then((qs) => {
        setQuestions(selectQuestionsForGame(qs))
        setTimeLeft(config.timerSecondsPerQuestion)
        setPhase('intro')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 3-2-1-GO intro sequence before the first question
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

  const finishGame = useCallback(
    async (outcome: GameOutcome, pointsWon: number, levelReached: number, finalAnswers: AnswerRecord[]) => {
      if (!config) return
      setPhase('finishing')
      await getOrCreatePlayer(config.playerName)
      const correctCount = finalAnswers.filter((a) => a.correct).length
      const id = await db.gameSessions.add({
        playerName: config.playerName,
        setId: config.setId,
        setName: config.setName,
        startedAt: questionStartRef.current,
        finishedAt: Date.now(),
        outcome,
        levelReached,
        pointsWon,
        totalLevels: LADDER.length,
        correctCount,
        wrongCount: finalAnswers.length - correctCount,
        lifelinesUsed,
        answers: finalAnswers,
        timerSecondsPerQuestion: config.timerSecondsPerQuestion,
      })
      navigate(`/results/${id}`, { replace: true })
    },
    [config, lifelinesUsed, navigate]
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
        selectedIndex: index,
        correctIndex: currentQuestion.correctIndex,
        correct,
        timedOut: wasTimeout,
        timeTakenSec: timeTaken,
        level: currentLevel,
        points: correct ? pointsForLevel(currentLevel) : lastCheckpointPoints(currentLevel),
      }
      const nextAnswers = [...answers, record]
      setAnswers(nextAnswers)

      sound.playDrumroll(0.85)

      window.setTimeout(() => {
        setRevealed(true)
        if (correct) {
          sound.playCorrect()
          haptics.success()
          setFlash('green')
          setShowConfetti(true)
          window.setTimeout(() => setFlash(null), 700)
          window.setTimeout(() => setShowConfetti(false), 1800)
          if (currentLevel >= LADDER.length) {
            window.setTimeout(() => finishGame('won', pointsForLevel(currentLevel), currentLevel, nextAnswers), 1500)
          } else {
            const isCheckpoint = LADDER.find((l) => l.level === currentLevel)?.isCheckpoint
            if (isCheckpoint) {
              sound.playCheckpoint()
              setJustCheckpoint(true)
            }
            window.setTimeout(() => setPhase('correct-prompt'), 250)
          }
        } else {
          sound.playWrong()
          haptics.error()
          setFlash('red')
          setShake(true)
          window.setTimeout(() => setFlash(null), 700)
          window.setTimeout(() => setShake(false), 550)
          window.setTimeout(
            () => finishGame('lost', lastCheckpointPoints(currentLevel), currentLevel - 1, nextAnswers),
            1700
          )
        }
      }, 850)
    },
    [answers, currentLevel, currentQuestion, finishGame]
  )

  // Timer
  useEffect(() => {
    if (phase !== 'question') return
    if (timeLeft <= 0) {
      reveal(null, true)
      return
    }
    const t = window.setTimeout(() => {
      setTimeLeft((s) => s - 1)
      if (timeLeft <= 6) {
        sound.playCountdownBeep(6 - timeLeft)
        if (timeLeft <= 3) haptics.tap()
      }
    }, 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  if (!config) return null
  if (!questions || phase === 'loading' || !currentQuestion) {
    return <div className="py-20 text-center text-xl">Loading game…</div>
  }

  if (phase === 'intro') {
    return <IntroCountdown playerName={config.playerName} step={introStep} />
  }

  const handleSelect = (index: number) => {
    if (phase !== 'question' || disabledOptions.has(index)) return
    reveal(index, false)
  }

  const handleContinue = () => {
    sound.playWhoosh()
    haptics.tap()
    setCurrentLevel((l) => l + 1)
    setSelectedIndex(null)
    setDisabledOptions(new Set())
    setAudiencePoll(null)
    setFriendHint(null)
    setTimedOut(false)
    setRevealed(false)
    setJustCheckpoint(false)
    setTimeLeft(config.timerSecondsPerQuestion)
    questionStartRef.current = Date.now()
    setPhase('question')
  }

  const handleWalkAwayAfterCorrect = () => {
    sound.playWalkAway()
    haptics.tap()
    finishGame('walked_away', pointsForLevel(currentLevel), currentLevel, answers)
  }

  const handleQuit = () => {
    if (!confirm(`End the game now? ${config.playerName} will keep the points already secured.`)) return
    const banked = currentLevel === 1 ? 0 : pointsForLevel(currentLevel - 1)
    sound.playWalkAway()
    finishGame('walked_away', banked, currentLevel - 1, answers)
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
  const secured = currentLevel === 1 ? 0 : pointsForLevel(currentLevel - 1)
  const showResult = revealed && (phase === 'locked' || phase === 'correct-prompt')
  const suspense = phase === 'locked' && !revealed

  return (
    <div className={`relative grid gap-4 lg:grid-cols-[1fr_220px] ${shake ? 'animate-screen-shake' : ''}`}>
      <Confetti active={showConfetti} />
      {flash && (
        <div className={`pointer-events-none fixed inset-0 z-40 ${flash === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`} />
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-white/60">Playing as</p>
            <p className="font-display text-xl font-bold">{config.playerName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-white/60">Secured</p>
              <p className="text-lg font-bold text-amber-300">
                <CountUp value={secured} durationMs={500} /> 👑
              </p>
            </div>
            <button onClick={handleQuit} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              End Game
            </button>
          </div>
        </div>

        {phase === 'question' && <TimerBar timeLeft={timeLeft} total={config.timerSecondsPerQuestion} />}

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-6 shadow-xl">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-black/30 px-3 py-1 font-bold">
              Level {currentLevel} of {LADDER.length}
            </span>
            <span className="rounded-full bg-black/30 px-3 py-1">{currentQuestion.category}</span>
            {suspense && <span className="animate-pulse text-amber-300">● locking in…</span>}
          </div>
          <p className="font-display text-2xl font-bold leading-snug sm:text-3xl">{currentQuestion.text}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((opt, i) => {
            const isDisabled = disabledOptions.has(i)
            const isSelected = selectedIndex === i
            const isCorrectAnswer = i === currentQuestion.correctIndex

            let stateClasses = 'bg-white/10 hover:bg-white/20'
            if (isDisabled) stateClasses = 'bg-white/5 opacity-30 line-through'
            if (suspense && isSelected) stateClasses = 'bg-amber-400/60 animate-drumroll'
            if (showResult) {
              if (isCorrectAnswer) stateClasses = 'bg-green-500/80 ring-4 ring-green-300 scale-[1.02]'
              else if (isSelected) stateClasses = 'bg-red-500/80 ring-4 ring-red-300'
              else stateClasses = 'bg-white/5 opacity-50'
            }

            return (
              <button
                key={i}
                disabled={phase !== 'question' || isDisabled}
                onClick={() => handleSelect(i)}
                className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-left text-lg font-semibold transition-all duration-300 ${stateClasses} ${
                  phase === 'question' && !isDisabled ? 'cursor-pointer hover:scale-[1.015]' : ''
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/30 font-bold">
                  {optionLabel(i)}
                </span>
                <span>{opt}</span>
                {showResult && isCorrectAnswer && <span className="ml-auto text-xl">✅</span>}
                {showResult && isSelected && !isCorrectAnswer && <span className="ml-auto text-xl">❌</span>}
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

        {phase === 'locked' && revealed && timedOut && (
          <p className="animate-page-in text-center text-lg font-bold text-red-300">⏰ Time's up!</p>
        )}
        {phase === 'locked' && revealed && currentQuestion.funFact && (
          <p className="animate-page-in rounded-xl bg-black/20 p-3 text-sm text-white/70">💡 {currentQuestion.funFact}</p>
        )}

        {phase === 'correct-prompt' && (
          <div className="animate-page-in rounded-2xl bg-green-900/40 p-5 text-center ring-1 ring-green-400/30">
            <p className="mb-3 font-display text-lg font-bold">
              {justCheckpoint ? '🔒 Checkpoint secured! ' : '✅ Correct! '}
              {config.playerName} has banked{' '}
              <span className="text-amber-300">
                <CountUp value={pointsForLevel(currentLevel)} durationMs={800} /> 👑
              </span>
            </p>
            {currentQuestion.funFact && <p className="mb-3 text-sm text-white/70">💡 {currentQuestion.funFact}</p>}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleContinue}
                className="animate-pulse-glow rounded-xl bg-amber-400 px-6 py-3 font-bold text-purple-950 transition hover:scale-105"
              >
                Continue to Level {currentLevel + 1} →
              </button>
              <button onClick={handleWalkAwayAfterCorrect} className="rounded-xl bg-white/10 px-6 py-3 font-bold transition hover:scale-105 hover:bg-white/20">
                Walk Away with {pointsForLevel(currentLevel).toLocaleString()} 👑
              </button>
            </div>
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
                {optionLabel(friendHint.index)} — {currentQuestion.options[friendHint.index]}
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

function IntroCountdown({ playerName, step }: { playerName: string; step: 3 | 2 | 1 | 0 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="text-xl text-white/70">Get ready, {playerName}!</p>
      <div key={step} className="animate-number-pop font-display text-9xl font-extrabold text-amber-300 drop-shadow-[0_0_40px_rgba(250,204,21,0.6)]">
        {step === 0 ? 'GO!' : step}
      </div>
    </div>
  )
}

function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, (timeLeft / total) * 100)
  const urgent = timeLeft <= 6
  return (
    <div className="space-y-1">
      <div className="h-4 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? 'bg-red-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-center text-sm font-bold ${urgent ? 'animate-pulse text-red-400' : 'text-white/60'}`}>{timeLeft}s</p>
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
