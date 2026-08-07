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
  selectedIndex: number | null
  correctIndex: number
  correct: boolean
  timedOut: boolean
  timeTakenSec: number
  level: number
  points: number
}

export type GameOutcome = 'won' | 'walked_away' | 'lost'

export interface GameSession {
  id?: number
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

export interface LadderLevel {
  level: number
  points: number
  isCheckpoint: boolean
  difficulty: 1 | 2 | 3 | 4 | 5
}

export interface GameConfig {
  playerName: string
  setId: number
  setName: string
  timerSecondsPerQuestion: number
  lifelines: {
    fiftyFifty: boolean
    askChurch: boolean
    phoneFriend: boolean
  }
}
