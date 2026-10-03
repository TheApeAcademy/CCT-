import { createNote, deleteNote, listMyNotes, updateNote, type PrivateNoteRow } from './ministry'

// The Prayer Journal keeps each prayer as one of the child's private notes
// (kind 'prayer'), so it stays as private as it always was: only the child
// can read it. The note's title carries the journal's own bookkeeping, the
// category, how many times they prayed it and when God answered, so the
// journal needs no new table. Prayers written before the redesign have a
// plain title and still show, as "Me" prayers prayed once.

export type PrayerCategory = 'family' | 'friends' | 'school' | 'me' | 'world' | 'thanks'

export interface Prayer {
  id: string
  cat: PrayerCategory
  text: string
  at: string
  prayed: number
  answered: string | null
}

const TAG = 'prayer:v1:'
const CATS: PrayerCategory[] = ['family', 'friends', 'school', 'me', 'world', 'thanks']

type Meta = { c: PrayerCategory; n: number; a: string | null }

function encode(p: Pick<Prayer, 'cat' | 'prayed' | 'answered'>) {
  const meta: Meta = { c: p.cat, n: p.prayed, a: p.answered }
  return TAG + JSON.stringify(meta)
}

function decode(row: PrivateNoteRow): Prayer {
  if (row.title.startsWith(TAG)) {
    try {
      const m = JSON.parse(row.title.slice(TAG.length)) as Partial<Meta>
      return {
        id: row.id,
        cat: CATS.includes(m.c as PrayerCategory) ? (m.c as PrayerCategory) : 'me',
        text: row.body,
        at: row.created_at,
        prayed: Math.max(1, Number(m.n) || 1),
        answered: typeof m.a === 'string' ? m.a : null,
      }
    } catch {
      // A damaged tag reads as an older prayer below.
    }
  }
  const title = row.title.startsWith(TAG) ? '' : row.title.trim()
  return { id: row.id, cat: 'me', text: title ? `${title}\n${row.body}` : row.body, at: row.created_at, prayed: 1, answered: null }
}

export async function listMyPrayers(): Promise<{ prayers: Prayer[]; days: number }> {
  const rows = await listMyNotes('prayer')
  // A day counts when the child wrote a prayer or came back to one.
  const days = new Set<string>()
  for (const r of rows) {
    days.add(new Date(r.created_at).toDateString())
    days.add(new Date(r.updated_at).toDateString())
  }
  return { prayers: rows.map(decode), days: days.size }
}

export async function addPrayer(cat: PrayerCategory, text: string): Promise<Prayer> {
  const row = await createNote('prayer', encode({ cat, prayed: 1, answered: null }), text)
  return decode(row)
}

export async function savePrayer(p: Prayer) {
  await updateNote(p.id, encode(p), p.text)
}

export async function removePrayer(id: string) {
  await deleteNote(id)
}
