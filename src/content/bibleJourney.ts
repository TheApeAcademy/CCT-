import type { JourneyBook } from './bibleJourneyTypes'
import { genesis } from './bibleJourneyGenesis'

export * from './bibleJourneyTypes'

// The full 66-book canonical order. Only books with content built (see
// BOOKS_WITH_CONTENT below) are playable - the rest render as "coming
// soon" on the book map so kids can see the whole road ahead. New books
// get added here one at a time (Exodus next), each in its own content
// file like bibleJourneyGenesis.ts.
export const BIBLE_BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
] as const

export const JOURNEY_BOOKS: JourneyBook[] = [genesis]

export function getJourneyBook(key: string): JourneyBook | undefined {
  return JOURNEY_BOOKS.find((b) => b.key === key)
}

export function slugifyBookTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-')
}

export function findLesson(lessonKey: string) {
  for (const book of JOURNEY_BOOKS) {
    for (const unit of book.units) {
      const lesson = unit.lessons.find((l) => l.key === lessonKey)
      if (lesson) return { book, unit, lesson }
    }
  }
  return undefined
}

/** Every lesson key in a book, in play order - used to work out what's next/locked. */
export function lessonKeysInOrder(book: JourneyBook): string[] {
  return book.units.flatMap((u) => u.lessons.map((l) => l.key))
}

export function totalLessonCount(): number {
  return JOURNEY_BOOKS.reduce((sum, b) => sum + lessonKeysInOrder(b).length, 0)
}
