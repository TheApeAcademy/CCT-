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

export interface JourneySection {
  /** A run of pages read straight through - however many the material actually needs, not a fixed count. */
  cards: JourneyContentCard[]
  /** Asked right after this section's cards, testing just what was read here. A single pass, not a retry loop. */
  checkQuestions: JourneyCheckCard[]
  /** Path under /journey/ for this section's illustration; falls back to each card's emoji when absent. */
  image?: string
}

export interface JourneyLesson {
  /** Globally unique, e.g. "genesis-noah". Used as the DB progress key. */
  key: string
  title: string
  /** Primary reference for this lesson, linked out to Bible.com. */
  reference: string
  /** Path under /journey/ for a real illustration; falls back to each card's emoji when absent. */
  image?: string
  /** As many read-then-check sections as the lesson's material actually calls for - no fixed shape. */
  sections: JourneySection[]
  /**
   * The end-of-lesson mastery round covering everything in the lesson - its
   * length varies with how much the lesson actually covers (never more than
   * 10, never forced up to 10 either). Every question must eventually be
   * answered correctly: a wrong answer shows its explanation and the
   * question is requeued rather than skipped, so the lesson can't complete
   * until all of them are right.
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
