import type { Question } from '../db/types'
import { buildLadder, DEFAULT_QUESTION_COUNT } from './ladder'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Shuffles a single question's own options (and moves correctIndex to
 * match) - whoever wrote the question chose where the right answer sits
 * in the list, and that tends to cluster on option A far more than chance
 * would, letting kids learn to just guess the first option. Called once
 * per question as it's loaded into an actual playthrough, never touching
 * the stored data itself, so the same question gets an independently
 * random position every time it's played.
 */
export function shuffleQuestionOptions(q: Question): Question {
  const order = shuffle([0, 1, 2, 3])
  const options = order.map((i) => q.options[i]) as Question['options']
  const correctIndex = order.indexOf(q.correctIndex) as Question['correctIndex']
  return { ...q, options, correctIndex }
}

/**
 * Picks `count` questions (capped at however many the pool has), one per
 * ladder level, preferring each level's target difficulty. The pool can
 * be drawn from any number of question sets at once.
 */
export function selectQuestionsForGame(allQuestions: Question[], count: number = DEFAULT_QUESTION_COUNT): Question[] {
  const remaining = shuffle(allQuestions)
  const result: Question[] = []

  for (const level of buildLadder(Math.min(count, allQuestions.length))) {
    const target = level.difficulty
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
