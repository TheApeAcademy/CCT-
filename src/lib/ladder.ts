import type { LadderLevel } from '../db/types'

// Classic 10-step "Millionaire" style ladder, using Crowns instead of money.
// Checkpoints at level 5 and level 10 (final) act as safe havens.
export const LADDER: LadderLevel[] = [
  { level: 1, points: 100, isCheckpoint: false, difficulty: 1 },
  { level: 2, points: 200, isCheckpoint: false, difficulty: 1 },
  { level: 3, points: 300, isCheckpoint: false, difficulty: 2 },
  { level: 4, points: 500, isCheckpoint: false, difficulty: 2 },
  { level: 5, points: 1000, isCheckpoint: true, difficulty: 3 },
  { level: 6, points: 2000, isCheckpoint: false, difficulty: 3 },
  { level: 7, points: 4000, isCheckpoint: false, difficulty: 4 },
  { level: 8, points: 8000, isCheckpoint: false, difficulty: 4 },
  { level: 9, points: 16000, isCheckpoint: false, difficulty: 5 },
  { level: 10, points: 32000, isCheckpoint: true, difficulty: 5 },
]

export function pointsForLevel(level: number): number {
  return LADDER.find((l) => l.level === level)?.points ?? 0
}

export function lastCheckpointPoints(level: number): number {
  // Points guaranteed if the player misses a question while ON `level`
  // (i.e. they had already banked everything up to the checkpoint before it).
  const checkpointsBelow = LADDER.filter((l) => l.isCheckpoint && l.level < level)
  if (checkpointsBelow.length === 0) return 0
  return checkpointsBelow[checkpointsBelow.length - 1].points
}

export function difficultyForLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  return LADDER.find((l) => l.level === level)?.difficulty ?? 5
}
