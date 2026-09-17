// The Sunday School tab's calendar of themed weekly lessons for 2026 -
// shared between the kids' Sunday School tab (which shows locked/unlocked
// cards) and the Teacher Portal's class calendar (where a teacher decides
// which Sundays are unlocked for their own class).

export const SUNDAY_LESSON_THEMES: { title: string; image: string }[] = [
  { title: "Creation & God's Love", image: '/journey/adam-eve-garden-home.jpg' },
  { title: 'Adam and Eve', image: '/journey/adam-eve-first-sin.jpg' },
  { title: 'Cain and Abel', image: '/journey/cain-abel-offerings.jpg' },
  { title: "Noah's Ark", image: '/journey/noah-building-ark.jpg' },
  { title: "God's Promise", image: '/journey/noah-dove-olive-branch.jpg' },
  { title: 'The Tower of Babel', image: '/journey/tower-of-babel.jpg' },
  { title: "Abraham's Faith", image: '/journey/abraham-isaac-ram-provided.jpg' },
  { title: "Jacob's Ladder", image: '/journey/jacob-ladder-dream.jpg' },
  { title: "Learning God's Word", image: '/feature-bible.png' },
  { title: 'Sunday Worship', image: '/hero-bible.jpg' },
  { title: 'Our Church Family', image: '/mfm-wuye-building.jpg' },
  { title: 'A Message From Pastor', image: '/children-pastor.jpg' },
  { title: 'Fun in Sunday School', image: '/feature-class.png' },
  { title: 'Growing Together', image: '/hero-kids.jpg' },
]

function getSundaysIn2026(): Date[] {
  const sundays: Date[] = []
  const d = new Date(2026, 0, 1)
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  while (d.getFullYear() === 2026) {
    sundays.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return sundays
}

export const SUNDAYS_2026 = getSundaysIn2026()

/** Local (not UTC) YYYY-MM-DD key - matches the `date` column in class_sunday_unlocks. */
export function sundayDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
