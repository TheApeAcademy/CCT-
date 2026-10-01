/**
 * The single source of truth for the "Everything Inside" showcase page.
 *
 * Every entry here is a feature that actually exists in this app today, with
 * an honest note about where it lives. `to` is set only when a visitor who is
 * not signed in can actually open that screen - everything else says which
 * portal it sits inside instead of dangling a link that would just bounce
 * them to a sign-in wall.
 *
 * Anything genuinely unfinished belongs in COMING_SOON, never in a group
 * above it. A showcase that oversells is worse than no showcase.
 */

export interface ShowcaseFeature {
  /** Lucide icon name, resolved by the page against its own icon map. */
  icon: string
  title: string
  description: string
  /** A real public route, when the feature is reachable without signing in. */
  to?: string
  /** Where it lives when it is not publicly reachable, e.g. "Inside the Children's Dashboard". */
  where?: string
}

export interface ShowcaseGroup {
  key: string
  eyebrow: string
  title: string
  intro: string
  accent: string
  /** Portal entry point this group is about. */
  cta?: { label: string; to: string }
  features: ShowcaseFeature[]
}

export const SHOWCASE_GROUPS: ShowcaseGroup[] = [
  {
    key: 'children',
    eyebrow: 'For the Children',
    title: 'A dashboard that is actually theirs',
    intro:
      'A child signs up with a name and a passcode, no email needed, and lands in their own village. Every building on the map opens something different.',
    accent: 'var(--lp-accent-class)',
    cta: { label: 'Sign Up as a Child', to: '/join' },
    features: [
      {
        icon: 'Map',
        title: 'Village Map',
        description:
          'The whole dashboard is a map, not a menu. Tap a building to open it, and your own avatar hops across to wherever you are.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'BookOpen',
        title: 'Bible Journey',
        description:
          'A step-by-step path through Scripture, one lesson at a time, starting in Genesis. Finish a lesson and the next one opens up.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'Flame',
        title: 'Streaks, XP and Badges',
        description:
          'Come back tomorrow and the streak grows. Points, badges and milestones collect on your own profile as you go.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'Sparkles',
        title: 'Bible Character Collection',
        description:
          'Earn points and finish lessons and Bible characters unlock at random, each with a full-screen reveal and a spot in your gallery.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'Gamepad2',
        title: 'Bible Quiz',
        description:
          'The live quiz-show match a teacher runs on the big screen, plus unlimited solo practice whenever you want it.',
        to: '/training',
      },
      {
        icon: 'Trophy',
        title: 'Leaderboard',
        description:
          'Where you stand across the whole ministry, and how your class is doing against the other classes.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'Globe',
        title: 'Pray for the World',
        description:
          'A spinning globe with a different country to pray for every day of the year. Drag it, spin it, find where you are praying today.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'MessageCircleHeart',
        title: 'Ears for You',
        description:
          'A private line to your own teacher for anything on your mind. Send it anonymously and your name is removed from the message itself, not just hidden on screen.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'Bot',
        title: 'Bible Buddy',
        description:
          'Ask a Bible question and get a kid-safe answer, with an "ask your teacher instead" button always one tap away.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'PenLine',
        title: 'Prayer Journal and Diary',
        description: 'A private place to write down prayers, thoughts and what you are learning. Only you can see it.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'IdCard',
        title: 'Digital ID Card',
        description: 'Your photo, your favourite verse and your points on a card you can save and share.',
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'CalendarDays',
        title: 'Ministry Calendar',
        description: "Every ministry event, on the same shared calendar the teachers and admins follow.",
        where: "Inside the Children's Dashboard",
      },
      {
        icon: 'Music',
        title: 'Anthem',
        description: "Our children's ministry anthem, with the lyrics and a read-aloud.",
        to: '/anthem',
      },
    ],
  },
  {
    key: 'teachers',
    eyebrow: 'For the Teachers',
    title: 'Everything a Sunday School class needs',
    intro:
      'Apply to teach, get approved by a ministry admin, and run your class from one place. A teacher only ever sees their own class, enforced at the database.',
    accent: 'var(--lp-accent-training)',
    cta: { label: 'Apply to Teach', to: '/teacher' },
    features: [
      {
        icon: 'Users',
        title: 'Class Roster',
        description:
          'Create a class, add children by their Student Code, and move or remove them as your groups change.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'ClipboardCheck',
        title: 'Attendance',
        description: 'Mark who is in today on a date-by-date register, and it feeds straight into every parent report.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'Award',
        title: 'Printable Certificates',
        description: 'Generate a Certificate of Achievement for any child in your class and download it ready to print.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'BookOpen',
        title: 'Sunday School Lessons',
        description:
          'Write a lesson, keep it as a draft, publish it when you are ready, and unlock each Sunday on the calendar for your own class.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'FileText',
        title: 'Assignments and Grading',
        description: 'Set work with a due date, read what each child submitted, and send back a grade with feedback.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'HeartHandshake',
        title: 'Ears for You Inbox',
        description:
          'Safeguarding messages from your own class, with replies, staff-only internal notes, and a one-tap escalation to ministry leadership.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'ShieldCheck',
        title: 'Bible Buddy Log',
        description: 'Every question your students asked the AI companion, for safeguarding review.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'Smartphone',
        title: 'Messaging',
        description: 'A direct thread with each child in your class. Children can never message each other, only you.',
        where: 'Inside the Teacher Portal',
      },
      {
        icon: 'Gamepad2',
        title: 'Host a Quiz Match',
        description:
          'Run a live match on the shared screen with teams, lifelines and a countdown, from a question bank you build yourself.',
        to: '/setup',
      },
    ],
  },
  {
    key: 'admins',
    eyebrow: 'For the Ministry',
    title: 'Oversight across the whole department',
    intro:
      'The Control Centre is where the ministry sees everything at once: who is teaching, what is being taught, and a real record of every safeguarding action.',
    accent: 'var(--lp-accent-achievements)',
    cta: { label: 'Open the Control Centre', to: '/admin' },
    features: [
      {
        icon: 'FileCheck',
        title: 'Teacher Applications',
        description: 'Review and approve every teacher before they can ever see a child. Access is never self-service.',
        where: 'Inside the Control Centre',
      },
      {
        icon: 'School',
        title: 'Every Class at a Glance',
        description: 'Every class in the ministry, who teaches it, and its join code, in one list.',
        where: 'Inside the Control Centre',
      },
      {
        icon: 'CalendarRange',
        title: 'Seasons',
        description: 'Run the quiz in terms. Question sets and matches are tagged to the season that was active.',
        to: '/seasons',
      },
      {
        icon: 'BookMarked',
        title: 'Bible Reading Plans',
        description: 'Build a reading plan day by day and make it the one every child reads from.',
        where: 'Inside the Control Centre',
      },
      {
        icon: 'CalendarDays',
        title: 'Ministry Calendar',
        description: 'Add the events everyone follows. Teachers and children see the same calendar, read-only.',
        where: 'Inside the Control Centre',
      },
      {
        icon: 'ShieldCheck',
        title: 'Safety and Privacy',
        description:
          'The real audit trail: every acknowledge, reply and escalation on a safeguarding message, with a timestamp.',
        to: '/safety',
      },
      {
        icon: 'Database',
        title: 'Digital Bank',
        description: 'Songs, videos and documents for the ministry, kept together and playable in the browser.',
        where: 'Inside the Control Centre',
      },
    ],
  },
  {
    key: 'parents',
    eyebrow: 'For the Parents',
    title: 'See how your child is growing',
    intro:
      'A parent makes their own account and links to their child with a code only the child can see and choose to share. Nothing is ever auto-created.',
    accent: 'var(--lp-accent-ears)',
    cta: { label: 'Open the Parent Dashboard', to: '/parent' },
    features: [
      {
        icon: 'KeyRound',
        title: 'Link by Code',
        description: 'Your child gives you their Parent Link Code. That code, and only that code, connects the two accounts.',
        to: '/parent',
      },
      {
        icon: 'TrendingUp',
        title: 'Per-Child Progress',
        description: 'Bible streak, lessons finished, badges earned and attendance, per child, all on one card.',
        where: 'Inside the Parent Dashboard',
      },
      {
        icon: 'Star',
        title: 'Monthly Star Rating',
        description:
          'A simple, transparent monthly rating built from lessons, quizzes and days present. No hidden formula.',
        where: 'Inside the Parent Dashboard',
      },
    ],
  },
]

export interface ComingSoonFeature {
  icon: string
  title: string
  description: string
}

export const COMING_SOON: ComingSoonFeature[] = [
  {
    icon: 'Globe',
    title: 'Bible World Map',
    description: 'Walk the places the Bible actually happened, marked on a real map. Its spot is already on the village map.',
  },
  {
    icon: 'Grid3x3',
    title: 'Mini-Games',
    description: 'Word search, memory match, verse scramble and more, alongside the main quiz.',
  },
  {
    icon: 'Phone',
    title: 'Contact Details',
    description: 'A branch phone number, email and service times, being finalised with the ministry.',
  },
]
