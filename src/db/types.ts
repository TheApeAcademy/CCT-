/**
 * The Digital Bank: any file related to the ministry (songs, videos, docs)
 * that doesn't belong in a question set or a Bible reading plan. Stored
 * locally in this browser's IndexedDB for now, not Supabase Storage - so
 * it works fully offline like the rest of the quiz, at the cost of not
 * being shared across devices yet.
 */
export interface DigitalBankFile {
  id?: number
  name: string
  category: 'song' | 'video' | 'doc' | 'other'
  mimeType: string
  size: number
  blob: Blob
  uploadedAt: number
}

export interface Question {
  id?: number
  setId: number
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  funFact?: string
  /** e.g. "Genesis 1:3" - where this question's answer comes from. */
  reference?: string
  /** Freeform custom labels cutting across category/set, e.g. "10-11 years", "Transition Class". */
  groups?: string[]
}

/** One question picked into the Question Bank's scratch "quiz builder" cart - see db.ts's quizBuilder table. */
export interface QuizBuilderItem {
  id?: number
  questionId: number
  addedAt: number
}

export interface QuestionSet {
  id?: number
  name: string
  description?: string
  createdAt: number
  isStarter?: boolean
  seasonId?: number
}

export interface Season {
  id?: number
  name: string
  isActive: boolean
  createdAt: number
}

export interface Player {
  id?: number
  name: string
  className?: string
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
  playerPhoto?: string
  setId: number
  setName: string
  seasonName?: string
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
  /** Registered Student Code this team was linked to at setup, if any - carried onto the session so a synced full-history row can be tied back to a real student. */
  studentId?: string | null
  /**
   * Full-history sync state, separate from the ministry leaderboard's own
   * PendingLeaderboardSync queue - this pushes the *entire* session (every
   * question, not just the aggregate points) to Supabase so History is
   * visible across devices/browsers, not just on the one that played it.
   * 0 until synced, then 1 with remoteId set to the inserted row's id.
   */
  synced?: 0 | 1
  remoteId?: string
}

export interface Match {
  id?: number
  setId: number
  setName: string
  seasonId?: number
  seasonName?: string
  questionIds: number[]
  timerSecondsPerQuestion: number
  lifelines: LifelinesUsed
  teamNames: string[]
  teamPhotos?: (string | undefined)[]
  // Optional link from a team to a registered Student Code, resolved once
  // at setup time (needs a connection). Lets a completed match's result
  // queue for the real ministry leaderboard without gameplay itself ever
  // needing network.
  teamStudentIds?: (string | undefined)[]
  teamStudentClassIds?: (string | undefined)[]
  createdAt: number
  completedAt?: number
  /**
   * "marathon" (default when absent): each team plays the whole ladder in
   * its own turn, one after another. "rotational": the ladder is shared -
   * turns alternate who answers the next question as play moves through
   * it. With exactly two team names, rotational mode is what the setup
   * screen presents as "1v1" - same engine, just a head-to-head display.
   */
  mode?: 'marathon' | 'rotational'
}

// A quiz result waiting to be pushed to the ministry leaderboard. Written
// immediately when a linked team finishes a match (always works offline),
// then flushed to Supabase automatically once there's a connection.
export interface PendingLeaderboardSync {
  id?: number
  studentId: string
  studentName: string
  classId: string | null
  setName: string
  seasonName?: string
  points: number
  correctCount: number
  totalQuestions: number
  createdAt: number
  synced: 0 | 1
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
  teamPhotos?: (string | undefined)[]
  teamStudentIds?: (string | undefined)[]
  teamStudentClassIds?: (string | undefined)[]
  teamIndex: number
  setId: number
  setName: string
  seasonName?: string
  timerSecondsPerQuestion: number
  lifelines: {
    fiftyFifty: boolean
    askChurch: boolean
    phoneFriend: boolean
  }
  mode?: 'marathon' | 'rotational'
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
