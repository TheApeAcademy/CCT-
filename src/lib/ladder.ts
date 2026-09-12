import type { LadderLevel } from '../db/types'

// 10-question ladder of increasing difficulty. Every question is worth a
// flat 10 points - no exponential point scale - matching the same flat
// 10-points-per-completed-thing rule the ministry leaderboard uses for
// quiz questions, Bible readings, and assignment submissions alike. Levels
// 5 and 10 stay marked as milestones purely for visual flair in the
// sidebar (a checkpoint chime, nothing to do with points). There is no
// elimination, so nothing is actually at risk.
export const LADDER: LadderLevel[] = [
  { level: 1, points: 10, isMilestone: false, difficulty: 1 },
  { level: 2, points: 10, isMilestone: false, difficulty: 1 },
  { level: 3, points: 10, isMilestone: false, difficulty: 2 },
  { level: 4, points: 10, isMilestone: false, difficulty: 2 },
  { level: 5, points: 10, isMilestone: true, difficulty: 3 },
  { level: 6, points: 10, isMilestone: false, difficulty: 3 },
  { level: 7, points: 10, isMilestone: false, difficulty: 4 },
  { level: 8, points: 10, isMilestone: false, difficulty: 4 },
  { level: 9, points: 10, isMilestone: false, difficulty: 5 },
  { level: 10, points: 10, isMilestone: true, difficulty: 5 },
]

export function pointsForLevel(level: number): number {
  return LADDER.find((l) => l.level === level)?.points ?? 0
}

export function difficultyForLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  return LADDER.find((l) => l.level === level)?.difficulty ?? 5
}
