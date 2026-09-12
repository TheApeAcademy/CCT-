import Dexie, { type Table } from 'dexie'
import type {
  Question,
  QuestionSet,
  Player,
  GameSession,
  Match,
  PracticeSession,
  TransitionLecture,
  TransitionQuestion,
  TransitionCheckpointResult,
  MockExamAttempt,
  Season,
  PendingLeaderboardSync,
} from './types'
import { starterQuestions } from './seedQuestions'
import { expansionQuestions } from './seedQuestionsExpansion'

export class TriviaDB extends Dexie {
  questions!: Table<Question, number>
  questionSets!: Table<QuestionSet, number>
  players!: Table<Player, number>
  gameSessions!: Table<GameSession, number>
  matches!: Table<Match, number>
  practiceSessions!: Table<PracticeSession, number>
  transitionLectures!: Table<TransitionLecture, number>
  transitionQuestions!: Table<TransitionQuestion, number>
  transitionCheckpointResults!: Table<TransitionCheckpointResult, number>
  mockExamAttempts!: Table<MockExamAttempt, number>
  seasons!: Table<Season, number>
  pendingLeaderboardSync!: Table<PendingLeaderboardSync, number>

  constructor() {
    super('cct-trivia')
    this.version(2).stores({
      questions: '++id, setId, category, difficulty',
      questionSets: '++id, name',
      players: '++id, name, createdAt',
      gameSessions: '++id, playerName, setId, finishedAt, matchId',
      matches: '++id, setId, createdAt',
    })
    this.version(3).stores({
      practiceSessions: '++id, playerName, setId, finishedAt',
      transitionLectures: '++id, order',
      transitionQuestions: '++id, lectureId',
      transitionCheckpointResults: '++id, playerName, lectureId',
      mockExamAttempts: '++id, playerName, finishedAt',
    })
    this.version(4).stores({
      seasons: '++id, name, isActive, createdAt',
      questionSets: '++id, name, seasonId',
      matches: '++id, setId, createdAt, seasonId',
    })
    this.version(5).stores({
      pendingLeaderboardSync: '++id, studentId, synced, createdAt',
    })
    this.version(6).stores({
      questions: '++id, setId, category, difficulty, *groups',
    })
  }
}

export const db = new TriviaDB()

// Several components (App's seed effect, GameSetup, QuestionBank...) can all
// call ensureActiveSeason() within the same tick on first load. IndexedDB
// reads aren't atomic across separate calls, so without this cache each one
// would independently see "no active season" and insert its own duplicate
// "Season 1". Caching the in-flight promise makes concurrent callers within
// this tab share a single read-then-write instead of racing.
let activeSeasonPromise: Promise<Season> | null = null

/** Returns the active season, creating a "Season 1" default the first time the app runs. */
export function ensureActiveSeason(): Promise<Season> {
  if (!activeSeasonPromise) {
    activeSeasonPromise = (async () => {
      const active = await db.seasons.filter((s) => s.isActive).first()
      if (active) return active
      const existing = await db.seasons.orderBy('createdAt').first()
      if (existing) {
        await db.seasons.update(existing.id!, { isActive: true })
        return { ...existing, isActive: true }
      }
      const id = await db.seasons.add({ name: 'Season 1', isActive: true, createdAt: Date.now() })
      return { id: id as number, name: 'Season 1', isActive: true, createdAt: Date.now() }
    })()
  }
  return activeSeasonPromise
}

export async function createSeason(name: string): Promise<number> {
  return (await db.seasons.add({ name: name.trim(), isActive: false, createdAt: Date.now() })) as number
}

export async function setActiveSeason(id: number) {
  const all = await db.seasons.toArray()
  await Promise.all(all.map((s) => db.seasons.update(s.id!, { isActive: s.id === id })))
  activeSeasonPromise = null
}

export async function ensureSeedData() {
  const season = await ensureActiveSeason()

  const count = await db.questionSets.count()
  if (count === 0) {
    const setId = await db.questionSets.add({
      name: 'Bible Basics Starter Pack',
      description: 'A ready-to-go mix of Old & New Testament questions across all difficulty levels.',
      createdAt: Date.now(),
      isStarter: true,
      seasonId: season.id,
    })

    await db.questions.bulkAdd(
      starterQuestions.map((q) => ({ ...q, setId: setId as number }))
    )
  }

  // Seeded separately (checked by name, not just "any set exists") so this
  // second, much bigger wave of questions reaches devices that already had
  // the starter pack from before this was added, not only brand-new installs.
  const expansionName = 'Bible Trivia Expansion Pack'
  const hasExpansion = await db.questionSets.where('name').equals(expansionName).count()
  if (hasExpansion === 0) {
    const expansionSetId = await db.questionSets.add({
      name: expansionName,
      description: '300 more questions spanning Old & New Testament, miracles, parables, kings & prophets, and the books of the Bible.',
      createdAt: Date.now(),
      isStarter: true,
      seasonId: season.id,
    })

    await db.questions.bulkAdd(
      expansionQuestions.map((q) => ({ ...q, setId: expansionSetId as number }))
    )
  }
}

export async function createMatch(match: Omit<Match, 'id' | 'createdAt'>): Promise<number> {
  return (await db.matches.add({ ...match, createdAt: Date.now() })) as number
}

export async function completeMatch(matchId: number) {
  await db.matches.update(matchId, { completedAt: Date.now() })
}

export async function getMatchSessions(matchId: number): Promise<GameSession[]> {
  return db.gameSessions.where('matchId').equals(matchId).sortBy('teamIndex')
}

export async function getOrCreatePlayer(name: string, className?: string): Promise<Player> {
  const trimmed = name.trim()
  const existing = await db.players.where('name').equalsIgnoreCase(trimmed).first()
  if (existing) {
    if (className && !existing.className) {
      await db.players.update(existing.id!, { className })
      return { ...existing, className }
    }
    return existing
  }
  const id = await db.players.add({ name: trimmed, className, createdAt: Date.now() })
  return { id: id as number, name: trimmed, className, createdAt: Date.now() }
}

export interface ExportBundle {
  version: 1
  exportedAt: number
  questionSets: QuestionSet[]
  questions: Question[]
}

export async function exportQuestionSet(setId: number): Promise<ExportBundle> {
  const set = await db.questionSets.get(setId)
  if (!set) throw new Error('Set not found')
  const questions = await db.questions.where('setId').equals(setId).toArray()
  return {
    version: 1,
    exportedAt: Date.now(),
    questionSets: [set],
    questions,
  }
}

export async function importQuestionBundle(bundle: ExportBundle): Promise<number> {
  let newSetId = 0
  for (const set of bundle.questionSets) {
    const { id: _oldId, ...rest } = set
    const createdId = await db.questionSets.add({ ...rest, createdAt: Date.now(), isStarter: false })
    newSetId = createdId as number
    const relatedQuestions = bundle.questions.filter((q) => q.setId === _oldId)
    await db.questions.bulkAdd(
      relatedQuestions.map((q) => {
        const { id: _qid, ...qrest } = q
        return { ...qrest, setId: newSetId }
      })
    )
  }
  return newSetId
}
