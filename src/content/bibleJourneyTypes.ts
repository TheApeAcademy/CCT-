// Shared shapes for the Bible Journey curriculum (Duolingo-style micro-lessons).
// Content is authored here in code, not in the database - there's no admin
// UI for it on purpose (see BibleJourney.tsx): kids just learn, answer, and
// keep going, the same way the checkpoint questions below aren't a bank a
// teacher edits, they're baked into the lesson.

export interface JourneyContentCard {
  emoji: string
  text: string
  /** e.g. "Genesis 1:1-5" - every single card cites where it came from. */
  ref: string
}

export interface JourneyCheckCard {
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

export interface JourneyLesson {
  /** Globally unique, e.g. "genesis-noah-2". Used as the DB progress key. */
  key: string
  title: string
  /** Primary reference for this micro-lesson, linked out to Bible.com. */
  reference: string
  cards: JourneyContentCard[]
  /** A quick one-question check dropped in partway through the lesson. */
  midCheck: JourneyCheckCard
  /** A short checkpoint before the lesson can be marked complete. */
  endCheckpoint: JourneyCheckCard[]
}

export interface JourneyUnit {
  key: string
  title: string
  kind: 'story' | 'topical'
  emoji: string
  lessons: JourneyLesson[]
}

export interface JourneyBook {
  key: string
  title: string
  order: number
  units: JourneyUnit[]
}
