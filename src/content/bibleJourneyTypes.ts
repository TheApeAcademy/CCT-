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
  /** Shown as the correction when a mastery-round question is answered wrong, before it's asked again. */
  explanation?: string
}

export interface JourneyLesson {
  /** Globally unique, e.g. "genesis-noah-2". Used as the DB progress key. */
  key: string
  title: string
  /** Primary reference for this micro-lesson, linked out to Bible.com. */
  reference: string
  /** Path under /journey/ for a real illustration; falls back to each card's emoji when absent. */
  image?: string
  /** The "pages" of learning - read straight through, then groupCheck tests them as a set. */
  cards: JourneyContentCard[]
  /** Asked once all of this lesson's pages have been read. */
  groupCheck: JourneyCheckCard
  /**
   * The end-of-lesson mastery round (10 questions covering everything in the
   * lesson). Every one must eventually be answered correctly - a wrong
   * answer shows its explanation and the question is requeued rather than
   * skipped, so the lesson can't complete until all of them are right.
   */
  masteryQuestions: JourneyCheckCard[]
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
