// Bible Journey progress - thin wrapper over Supabase, same shape as the
// rest of ministry.ts. Lesson content itself is static app code
// (src/content/bibleJourney*.ts); this only tracks what's been completed.
import { supabase } from './supabase'

export interface JourneyProgressRow {
  lesson_key: string
  book: string
  score: number | null
  completed_at: string
}

/** Every lesson the signed-in student has completed, across every book. */
export async function getMyJourneyProgress(): Promise<JourneyProgressRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase.from('journey_progress').select('lesson_key, book, score, completed_at')
  if (error) throw error
  return (data ?? []) as JourneyProgressRow[]
}

/** Marks a micro-lesson complete. Safe to call more than once - it no-ops on a replay, so points/achievements never double-fire. */
export async function completeJourneyLesson(book: string, lessonKey: string, score?: number) {
  const { error } = await supabase.rpc('complete_journey_lesson', { p_book: book, p_lesson_key: lessonKey, p_score: score ?? null })
  if (error) throw error
}
