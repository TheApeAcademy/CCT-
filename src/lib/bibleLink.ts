// A best-effort deep link into bible.com (YouVersion) for a reference like
// "John 3:16-21" or "Genesis 1:3" - goes through their public search rather
// than trying to hand-build an exact passage URL, which would need a full
// book-name-to-code mapping and chapter/verse-range parsing to get right
// for every reference format teachers and admins actually type in. Search
// reliably lands on the right passage without any of that.
export function bibleComUrl(reference: string): string {
  return `https://www.bible.com/search/bible?q=${encodeURIComponent(reference)}&version_id=111`
}
