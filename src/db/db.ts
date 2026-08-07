import Dexie, { type Table } from 'dexie'
import type { Question, QuestionSet, Player, GameSession } from './types'
import { starterQuestions } from './seedQuestions'

export class TriviaDB extends Dexie {
  questions!: Table<Question, number>
  questionSets!: Table<QuestionSet, number>
  players!: Table<Player, number>
  gameSessions!: Table<GameSession, number>

  constructor() {
    super('cct-trivia')
    this.version(1).stores({
      questions: '++id, setId, category, difficulty',
      questionSets: '++id, name',
      players: '++id, name, createdAt',
      gameSessions: '++id, playerName, setId, finishedAt',
    })
  }
}

export const db = new TriviaDB()

export async function ensureSeedData() {
  const count = await db.questionSets.count()
  if (count > 0) return

  const setId = await db.questionSets.add({
    name: 'Bible Basics Starter Pack',
    description: 'A ready-to-go mix of Old & New Testament questions across all difficulty levels.',
    createdAt: Date.now(),
    isStarter: true,
  })

  await db.questions.bulkAdd(
    starterQuestions.map((q) => ({ ...q, setId: setId as number }))
  )
}

export async function getOrCreatePlayer(name: string): Promise<Player> {
  const trimmed = name.trim()
  const existing = await db.players.where('name').equalsIgnoreCase(trimmed).first()
  if (existing) return existing
  const id = await db.players.add({ name: trimmed, createdAt: Date.now() })
  return { id: id as number, name: trimmed, createdAt: Date.now() }
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
