export interface Question {
  id?: number
  setId: number
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  funFact?: string
}

export interface QuestionSet {
  id?: number
  name: string
  description?: string
  createdAt: number
  isStarter?: boolean
}

export interface Player {
  id?: number
  name: string
  createdAt: number
}

export interface LifelinesUsed {
  fiftyFifty: boolean
  askChurch: boolean
  phoneFriend: boolean
}

export interface AnswerRecord {
  questionId: number
  questionText: string
  options: [string, string, string, string]
  selectedIndex: number | null
  correctIndex: number
  correct: boolean
  timedOut: boolean
  timeTakenSec: number
  level: number
  points: number
  funFact?: string
}

export type GameOutcome = 'completed' | 'ended_early'

export interface GameSession {
  id?: number
  matchId?: number
  teamIndex?: number
  playerName: string
  setId: number
  setName: string
  startedAt: number
  finishedAt: number
  outcome: GameOutcome
  levelReached: number
  pointsWon: number
  totalLevels: number
  correctCount: number
  wrongCount: number
  lifelinesUsed: LifelinesUsed
  answers: AnswerRecord[]
  timerSecondsPerQuestion: number
}

export interface Match {
  id?: number
  setId: number
  setName: string
  questionIds: number[]
  timerSecondsPerQuestion: number
  lifelines: LifelinesUsed
  teamNames: string[]
  createdAt: number
  completedAt?: number
}

export interface LadderLevel {
  level: number
  points: number
  isMilestone: boolean
  difficulty: 1 | 2 | 3 | 4 | 5
}

export interface GameConfig {
  matchId: number
  teamNames: string[]
  teamIndex: number
  setId: number
  setName: string
  timerSecondsPerQuestion: number
  lifelines: {
    fiftyFifty: boolean
    askChurch: boolean
    phoneFriend: boolean
  }
}

export interface PracticeSession {
  id?: number
  playerName: string
  setId: number
  setName: string
  startedAt: number
  finishedAt: number
  questionsAnswered: number
  correctCount: number
  bestStreak: number
}

export interface TransitionLecture {
  id?: number
  title: string
  body: string
  citations: string[]
  order: number
  createdAt: number
}

export interface TransitionQuestion {
  id?: number
  lectureId: number
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  funFact?: string
}

export interface TransitionCheckpointResult {
  id?: number
  playerName: string
  lectureId: number
  score: number
  total: number
  passedAt: number
}

export interface MockExamAttempt {
  id?: number
  playerName: string
  startedAt: number
  finishedAt: number
  totalQuestions: number
  correctCount: number
  scorePct: number
}
