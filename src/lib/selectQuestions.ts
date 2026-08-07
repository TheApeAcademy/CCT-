import type { Question } from '../db/types'
import { LADDER, difficultyForLevel } from './ladder'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Picks one question per ladder level, preferring the level's target difficulty. */
export function selectQuestionsForGame(allQuestions: Question[]): Question[] {
  const remaining = shuffle(allQuestions)
  const result: Question[] = []

  for (const level of LADDER) {
    const target = difficultyForLevel(level.level)
    let bestIndex = -1
    let bestDiff = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const diff = Math.abs(remaining[i].difficulty - target)
      if (diff < bestDiff) {
        bestDiff = diff
        bestIndex = i
        if (diff === 0) break
      }
    }
    if (bestIndex === -1) break
    result.push(remaining[bestIndex])
    remaining.splice(bestIndex, 1)
  }

  return result
}
