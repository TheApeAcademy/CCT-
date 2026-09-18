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

/**
 * Every seeded question stores its correct answer at index 0, and the
 * Question Bank's add form starts there too. Rendering them as stored means
 * "A" is always right, which any child works out in one game. So the four
 * options are re-ordered every time a question is drawn, and correctIndex is
 * remapped to follow the answer to wherever it landed.
 */
export function shuffleOptions(q: Question): Question {
  const order = shuffle([0, 1, 2, 3])
  return {
    ...q,
    options: order.map((i) => q.options[i]) as [string, string, string, string],
    correctIndex: order.indexOf(q.correctIndex) as 0 | 1 | 2 | 3,
  }
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
