/**
 * The Old Testament paintings, one per book.
 *
 * Banks commissioned 50 of these from Gemini, one prompt per book plus a
 * second take of eleven of them. Each painting shows the story that book is
 * known for and the person at the centre of it, and most of them carry the
 * book's name carved on a stone in the corner, which is how the mapping
 * below was checked file by file on 2026-09-21.
 *
 * Habakkuk is the one book with no painting: its prompt never produced a
 * file. It is left as null here rather than pointed at a stand-in, so the
 * gap shows on the journey instead of hiding behind somebody else's art.
 *
 * Only the Old Testament is covered. New Testament books fall through to
 * the placeholder art in BibleJourney.tsx.
 */
export interface BibleBookArt {
  /** Path under public/. */
  image: string
  /** The moment the painting depicts, shown under the book's name. */
  scene: string
  /** Who it is about - null where the scene has no single figure. */
  character: string | null
}

export const BIBLE_BOOK_ART: Record<string, BibleBookArt | null> = {
  'Genesis': { image: '/journey/books/genesis.jpg', scene: 'Noah\'s flood', character: 'Noah' },
  'Exodus': { image: '/journey/books/exodus.jpg', scene: 'Parting the Red Sea', character: 'Moses' },
  'Leviticus': { image: '/journey/books/leviticus.jpg', scene: 'Priestly duties', character: 'Aaron' },
  'Numbers': { image: '/journey/books/numbers.jpg', scene: 'The bronze serpent', character: 'Moses' },
  'Deuteronomy': { image: '/journey/books/deuteronomy.jpg', scene: 'Moses views Canaan', character: 'Moses' },
  'Joshua': { image: '/journey/books/joshua.jpg', scene: 'The fall of Jericho', character: 'Joshua' },
  'Judges': { image: '/journey/books/judges.jpg', scene: 'Samson\'s sacrifice', character: 'Samson' },
  'Ruth': { image: '/journey/books/ruth.jpg', scene: 'Ruth and Naomi in the field', character: 'Ruth' },
  '1 Samuel': { image: '/journey/books/1-samuel.jpg', scene: 'David and Goliath', character: 'David' },
  '2 Samuel': { image: '/journey/books/2-samuel.jpg', scene: 'David and Bathsheba', character: 'David' },
  '1 Kings': { image: '/journey/books/1-kings.jpg', scene: 'Solomon\'s dedication', character: 'Solomon' },
  '2 Kings': { image: '/journey/books/2-kings.jpg', scene: 'Elijah\'s ascension', character: 'Elijah' },
  '1 Chronicles': { image: '/journey/books/1-chronicles.jpg', scene: 'The Ark\'s entry into Jerusalem', character: 'David' },
  '2 Chronicles': { image: '/journey/books/2-chronicles.jpg', scene: 'Solomon\'s dedication', character: 'Solomon' },
  'Ezra': { image: '/journey/books/ezra.jpg', scene: 'Ezra reads the Law', character: 'Ezra' },
  'Nehemiah': { image: '/journey/books/nehemiah.jpg', scene: 'Rebuilding the walls', character: 'Nehemiah' },
  'Esther': { image: '/journey/books/esther.jpg', scene: 'Esther before the king', character: 'Esther' },
  'Job': { image: '/journey/books/job.jpg', scene: 'Job in his suffering', character: 'Job' },
  'Psalms': { image: '/journey/books/psalms.jpg', scene: 'David\'s worship', character: 'David' },
  'Proverbs': { image: '/journey/books/proverbs.jpg', scene: 'Solomon\'s teaching', character: 'Solomon' },
  'Ecclesiastes': { image: '/journey/books/ecclesiastes.jpg', scene: 'Vanity of vanities', character: 'Solomon' },
  'Song of Solomon': { image: '/journey/books/song-of-solomon.jpg', scene: 'My beloved is mine', character: 'Solomon' },
  'Isaiah': { image: '/journey/books/isaiah.jpg', scene: 'Isaiah\'s vision of God\'s glory', character: 'Isaiah' },
  'Jeremiah': { image: '/journey/books/jeremiah.jpg', scene: 'Weeping over Jerusalem', character: 'Jeremiah' },
  'Lamentations': { image: '/journey/books/lamentations.jpg', scene: 'The city in ruins', character: null },
  'Ezekiel': { image: '/journey/books/ezekiel.jpg', scene: 'The valley of dry bones', character: 'Ezekiel' },
  'Daniel': { image: '/journey/books/daniel.jpg', scene: 'Daniel in the lions\' den', character: 'Daniel' },
  'Hosea': { image: '/journey/books/hosea.jpg', scene: 'I will betroth you to me forever', character: 'Hosea' },
  'Joel': { image: '/journey/books/joel.jpg', scene: 'Return to me with all your heart', character: 'Joel' },
  'Amos': { image: '/journey/books/amos.jpg', scene: 'I will no longer spare them', character: 'Amos' },
  'Obadiah': { image: '/journey/books/obadiah.jpg', scene: 'The judgment of Edom', character: 'Obadiah' },
  'Jonah': { image: '/journey/books/jonah.jpg', scene: 'Jonah and the great fish', character: 'Jonah' },
  'Micah': { image: '/journey/books/micah.jpg', scene: 'The promise of a ruler', character: 'Micah' },
  'Nahum': { image: '/journey/books/nahum.jpg', scene: 'The fall of Nineveh', character: 'Nahum' },
  'Habakkuk': null, // no painting in the folder yet
  'Zephaniah': { image: '/journey/books/zephaniah.jpg', scene: 'Searching Jerusalem with lamps', character: 'Zephaniah' },
  'Haggai': { image: '/journey/books/haggai.jpg', scene: 'The house shall be built', character: 'Haggai' },
  'Zechariah': { image: '/journey/books/zechariah.jpg', scene: 'Visions of restoration', character: 'Zechariah' },
  'Malachi': { image: '/journey/books/malachi.jpg', scene: 'A messenger of judgment', character: 'Malachi' },
}

export function bookArt(title: string): BibleBookArt | null {
  return BIBLE_BOOK_ART[title] ?? null
}

/**
 * Stories a lesson title is likely to name without naming the book. Each one
 * points at the painting that actually depicts it: some are the standalone
 * files in public/journey, the rest are the book painting whose scene is that
 * story. Checked against the scene each file shows, not guessed from the name.
 */
const STORY_ART: { match: RegExp; image: string; scene: string }[] = [
  { match: /\bark\b(?!.*covenant)|\bflood\b/i, image: '/journey/noah-building-ark.jpg', scene: 'Building the ark' },
  { match: /\bdove\b|olive branch/i, image: '/journey/noah-dove-olive-branch.jpg', scene: 'The dove returns' },
  { match: /\bgarden\b|\beden\b/i, image: '/journey/adam-eve-garden-home.jpg', scene: 'The garden' },
  { match: /first sin|forbidden|\bserpent\b.*\bgarden\b/i, image: '/journey/adam-eve-first-sin.jpg', scene: 'The first sin' },
  { match: /\bcain\b|\babel\b/i, image: '/journey/cain-abel-offerings.jpg', scene: 'The two offerings' },
  { match: /\bbabel\b|\btower\b/i, image: '/journey/tower-of-babel.jpg', scene: 'The tower' },
  { match: /\bladder\b/i, image: '/journey/jacob-ladder-dream.jpg', scene: "Jacob's dream" },
  { match: /\bram\b|\bisaac\b|\babraham\b/i, image: '/journey/abraham-isaac-ram-provided.jpg', scene: 'The ram provided' },
  { match: /red sea|parting the sea|\bmoses\b/i, image: '/journey/books/exodus.jpg', scene: 'Parting the Red Sea' },
  { match: /\bgoliath\b|\bsling\b|five (smooth )?stones/i, image: '/journey/books/1-samuel.jpg', scene: 'David and Goliath' },
  { match: /\bjericho\b/i, image: '/journey/books/joshua.jpg', scene: 'The fall of Jericho' },
  { match: /\bsamson\b|\bgideon\b/i, image: '/journey/books/judges.jpg', scene: "Samson's sacrifice" },
  { match: /\bnaomi\b|\bboaz\b/i, image: '/journey/books/ruth.jpg', scene: 'Ruth and Naomi in the field' },
  { match: /\bbathsheba\b/i, image: '/journey/books/2-samuel.jpg', scene: 'David and Bathsheba' },
  { match: /\belijah\b|\bchariot of fire\b/i, image: '/journey/books/2-kings.jpg', scene: "Elijah's chariot" },
  { match: /\bdry bones\b/i, image: '/journey/books/ezekiel.jpg', scene: 'The valley of dry bones' },
  { match: /lions.? den|fiery furnace|shadrach|meshach|abednego/i, image: '/journey/books/daniel.jpg', scene: "Daniel in the lions' den" },
  { match: /great fish|\bwhale\b|\bnineveh\b/i, image: '/journey/books/jonah.jpg', scene: 'Jonah and the great fish' },
  { match: /\bqueen esther\b|\bmordecai\b/i, image: '/journey/books/esther.jpg', scene: 'Esther before the king' },
  { match: /bronze serpent/i, image: '/journey/books/numbers.jpg', scene: 'The bronze serpent' },
  { match: /rebuilding the wall|\bwalls of jerusalem\b/i, image: '/journey/books/nehemiah.jpg', scene: 'Rebuilding the walls' },
]

/**
 * The painting for a teacher-written lesson title, or null.
 *
 * A lesson is free text, so this only answers when the title actually names a
 * book or a story we have art for - "Daniel in the lions' den" finds Daniel,
 * "Week 3 catch-up" finds nothing. Book names are checked first so "Song of
 * Solomon" is never read as a Solomon story and "1 Samuel" beats "Samuel".
 * Deliberately no fallback picture: a painting that has nothing to do with the
 * lesson is worse than no painting at all.
 */
export function lessonArt(title: string): { image: string; scene: string } | null {
  const books = Object.keys(BIBLE_BOOK_ART).sort((a, b) => b.length - a.length)
  for (const book of books) {
    const art = BIBLE_BOOK_ART[book]
    if (!art) continue
    const needle = book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`(^|[^a-z])${needle}([^a-z]|$)`, 'i').test(title)) return { image: art.image, scene: art.scene }
  }
  const story = STORY_ART.find((s) => s.match.test(title))
  return story ? { image: story.image, scene: story.scene } : null
}
