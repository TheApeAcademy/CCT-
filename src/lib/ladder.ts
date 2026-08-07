import type { LadderLevel } from '../db/types'

// 10-question ladder of increasing difficulty and point value. Levels 5 and
// 10 are marked as milestones purely for visual flair in the sidebar — there
// is no elimination, so nothing is actually at risk.
export const LADDER: LadderLevel[] = [
  { level: 1, points: 100, isMilestone: false, difficulty: 1 },
  { level: 2, points: 200, isMilestone: false, difficulty: 1 },
  { level: 3, points: 300, isMilestone: false, difficulty: 2 },
  { level: 4, points: 500, isMilestone: false, difficulty: 2 },
  { level: 5, points: 1000, isMilestone: true, difficulty: 3 },
  { level: 6, points: 2000, isMilestone: false, difficulty: 3 },
  { level: 7, points: 4000, isMilestone: false, difficulty: 4 },
  { level: 8, points: 8000, isMilestone: false, difficulty: 4 },
  { level: 9, points: 16000, isMilestone: false, difficulty: 5 },
  { level: 10, points: 32000, isMilestone: true, difficulty: 5 },
]

export function pointsForLevel(level: number): number {
  return LADDER.find((l) => l.level === level)?.points ?? 0
}

export function difficultyForLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  return LADDER.find((l) => l.level === level)?.difficulty ?? 5
}
