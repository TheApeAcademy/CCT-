import type { LadderLevel } from '../db/types'

export const DEFAULT_QUESTION_COUNT = 10
export const MIN_QUESTION_COUNT = 3
export const MAX_QUESTION_COUNT = 50

/**
 * Builds a ladder of the given length, difficulty ramping from 1 to 5 across
 * it (level 3 of 10 lands on difficulty 2, same spot a fixed 10-question
 * ladder always put it, so the classic quiz's feel doesn't shift just
 * because this function replaced its hardcoded array). Every question is
 * worth a flat 10 points - no exponential point scale - matching the same
 * flat 10-points-per-completed-thing rule the ministry leaderboard uses for
 * quiz questions, Bible readings, and assignment submissions alike. The
 * final level, and the midpoint on anything long enough to have a real one,
 * are marked as milestones purely for visual flair in the sidebar (a
 * checkpoint chime, nothing to do with points). There is no elimination, so
 * nothing is actually at risk.
 */
export function buildLadder(questionCount: number): LadderLevel[] {
  const count = Math.max(1, Math.round(questionCount))
  return Array.from({ length: count }, (_, i) => {
    const level = i + 1
    const difficulty = Math.min(5, Math.max(1, Math.ceil((level / count) * 5))) as 1 | 2 | 3 | 4 | 5
    const isMilestone = level === count || (count >= 4 && level === Math.round(count / 2))
    return { level, points: 10, isMilestone, difficulty }
  })
}

export const LADDER: LadderLevel[] = buildLadder(DEFAULT_QUESTION_COUNT)

export function pointsForLevel(_level: number): number {
  return 10
}
