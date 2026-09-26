import type { LadderLevel } from '../db/types'

/** How many questions a quiz has when nobody picks a different number. */
export const DEFAULT_QUESTION_COUNT = 10

/**
 * Builds a question ladder of any length, difficulty rising evenly from 1
 * up to 5 across it. Every question is worth a flat 10 points - no
 * exponential point scale - matching the same flat 10-points-per-completed-
 * thing rule the ministry leaderboard uses for quiz questions, Bible
 * readings, and assignment submissions alike. The halfway point and the
 * final question are marked as milestones purely for visual flair in the
 * sidebar (a checkpoint chime, nothing to do with points). There is no
 * elimination, so nothing is actually at risk.
 */
export function buildLadder(count: number): LadderLevel[] {
  const n = Math.max(1, Math.floor(count))
  const half = Math.ceil(n / 2)
  return Array.from({ length: n }, (_, i) => ({
    level: i + 1,
    points: 10,
    isMilestone: n > 1 && (i + 1 === half || i + 1 === n),
    difficulty: (n === 1 ? 1 : Math.min(5, Math.floor((i * 5) / n) + 1)) as LadderLevel['difficulty'],
  }))
}

/** The classic 10-question ladder. */
export const LADDER: LadderLevel[] = buildLadder(DEFAULT_QUESTION_COUNT)

export function pointsForLevel(level: number, ladder: LadderLevel[] = LADDER): number {
  return ladder.find((l) => l.level === level)?.points ?? 10
}

export function difficultyForLevel(level: number, ladder: LadderLevel[] = LADDER): 1 | 2 | 3 | 4 | 5 {
  return ladder.find((l) => l.level === level)?.difficulty ?? 5
}
