import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Swords,
  Dumbbell,
  BookOpen,
  Trophy,
  Music,
  School,
  type LucideIcon,
} from 'lucide-react'
import { db, ensureSeedData } from '../db/db'
import CountUp from '../components/CountUp'
import HeroCarousel, { SeasonBadge, type HeroSlide } from '../components/HeroCarousel'
import { playClick } from '../lib/sound'

export default function Home() {
  const [stats, setStats] = useState({ questions: 0, sets: 0, games: 0, kids: 0 })
  const activeSeason = useLiveQuery(() => db.seasons.filter((s) => s.isActive).first(), [])

  useEffect(() => {
    ensureSeedData().then(async () => {
      const [questions, sets, games, kids] = await Promise.all([
        db.questions.count(),
        db.questionSets.count(),
        db.gameSessions.count(),
        db.players.count(),
      ])
      setStats({ questions, sets, games, kids })
    })
  }, [])

  const slides: HeroSlide[] = [
    {
      eyebrow: 'Mountain of Fire and Miracles Ministries · Wuye',
      title: "The Children's Ministry",
      body: 'Raising children in the Word through classes, a Bible Quiz built for the ministry, and a place every child in this church can call theirs.',
      primaryCta: { label: 'Apply as a Kid', to: '/join' },
      secondaryCta: { label: 'Apply to Teach', to: '/teacher' },
      quote: { text: 'But upon mount Zion shall be deliverance, and there shall be holiness', source: 'Obadiah 1:17' },
    },
    {
      eyebrow: 'A Children’s Ministry Feature',
      title: 'Know the Word. Play the Quiz.',
      body: 'Live trivia on the shared screen, team lifelines, seasons and a leaderboard that means something — every question is a chance to know Scripture a little better.',
      primaryCta: { label: 'Host a Match', to: '/setup' },
      secondaryCta: { label: 'Practice Mode', to: '/training' },
    },
    {
      eyebrow: 'Every Child, Every Day',
      title: 'A daily reading. A streak worth keeping.',
      body: 'A shared Bible Reading Plan, achievements that mean something, and a safe place to talk to a trusted teacher — all in one dashboard built for kids.',
      primaryCta: { label: 'Apply as a Kid', to: '/join' },
      quote: { text: 'Thy word have I hid in mine heart, that I might not sin against thee', source: 'Psalm 119:11' },
    },
  ]

  return (
    <div className="space-y-16 pb-10">
      {/* ---------- hero ---------- */}
      <div>
        {activeSeason && <SeasonBadge name={activeSeason.name} />}
        <HeroCarousel slides={slides} />
      </div>

      {/* ---------- stats ---------- */}
      <div className="stat-strip grid-cols-4">
        <StatCell label="Questions" value={stats.questions} />
        <StatCell label="Question Sets" value={stats.sets} />
        <StatCell label="Matches Played" value={stats.games} />
        <StatCell label="Kids" value={stats.kids} />
      </div>

      {/* ---------- MFM worldwide ---------- */}
      <div id="about" className="stage-beams scroll-mt-20 overflow-hidden rounded-xl border border-[var(--hairline)] px-6 py-12 sm:px-14 sm:py-20">
        <p className="eyebrow text-sm">About the Ministry</p>
        <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
          Mountain of Fire and Miracles Ministries
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ink-muted)]">
          A full-gospel ministry devoted to revival, holiness, prayer, and deliverance, founded and led by
          Dr.&nbsp;Daniel Kolawole Olukoya as General Overseer. From its beginnings, MFM has grown into a worldwide
          ministry with branches across nations, all carrying the same call to prayer and holy living.
        </p>
      </div>

      {/* ---------- MFM Wuye branch ---------- */}
      <InfoSection id="wuye" eyebrow="Our Branch" title="MFM Wuye">
        <div className="grid gap-6 sm:grid-cols-[1.1fr_1fr]">
          <p className="text-[15px] leading-relaxed text-[var(--ink-muted)]">
            MFM Wuye is a branch of Mountain of Fire and Miracles Ministries, carrying the same call to prayer,
            holiness, and deliverance to its community. Full branch details, service times, and photos are being
            finalized with the ministry and will appear here soon.
          </p>
          <div className="crest-badge aspect-[4/3]" />
        </div>
      </InfoSection>

      {/* ---------- SRO ---------- */}
      <InfoSection id="leadership" eyebrow="Leadership" title="Pastor Edwin Etomi">
        <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr] sm:[&>*:first-child]:order-2">
          <p className="eyebrow !mt-0 text-[var(--gold)]">Senior Regional Overseer, MFM International Headquarters Annex, Wuye</p>
          <div className="crest-badge aspect-[4/3] sm:order-1" />
        </div>
      </InfoSection>

      {/* ---------- Children's Ministry ---------- */}
      <InfoSection id="ministry" eyebrow="This Platform" title="The Children's Ministry">
        <div className="grid gap-6 sm:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <p className="eyebrow !mt-0 text-[var(--gold)]">Head of Children&apos;s Department &mdash; Olusanu Olukunle</p>
            <p className="text-[15px] leading-relaxed text-[var(--ink-muted)]">
              This platform exists to serve the Children&apos;s Ministry directly &mdash; giving teachers real
              classrooms to run and children a place of their own to learn, play, and grow in the Word.
            </p>
          </div>
          <div className="crest-badge aspect-[4/3]" />
        </div>
      </InfoSection>

      {/* ---------- quiz ---------- */}
      <div>
        <p className="eyebrow">A Children&apos;s Ministry Feature</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">Bible Quiz</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SectionCard to="/setup" icon={Swords} title="Compete" description="Host a live trivia match on the shared screen with teams and lifelines." featured />
          <SectionCard to="/training" icon={Dumbbell} title="Training Mode" description="Unlimited solo practice. No teams, no timer, no pressure." />
          <SectionCard to="/transition" icon={School} title="Transition Class" description="Lectures, Bible citations, checkpoint quizzes, and mock exams." />
          <SectionCard to="/questions" icon={BookOpen} title="Question Bank" description="Add, edit, import, and export trivia questions and sets." />
          <SectionCard to="/history" icon={Trophy} title="History" description="Every completed match, team score, and full recap." />
          <SectionCard to="/anthem" icon={Music} title="Anthem" description="Our children's ministry anthem, with lyrics and a read-aloud." />
        </div>
      </div>

      {/* ---------- how it works ---------- */}
      <div className="panel p-6">
        <p className="eyebrow">How It Works</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'Teachers apply for an account; the admin approves them from the Control Centre.',
            'A teacher creates a class and shares its join code or link with their kids.',
            'Kids sign up with just their name and a passcode — no email needed.',
            "From their dashboard, kids play the Bible Quiz, climb the leaderboard, and message their teacher.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] font-display text-xs font-bold text-[var(--gold)]">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- final CTA: apply as a kid or teacher, only here ---------- */}
      <div className="stage-beams overflow-hidden rounded-xl border border-[var(--hairline)] p-8 text-center sm:p-12">
        <p className="eyebrow justify-center">Get Started</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Ready to join?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-muted)]">
          Kids join a class in under a minute. Teachers apply and the admin reviews it from the Control Centre.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/join" onClick={() => playClick()} className="btn-solid">
            Apply as a Kid
          </Link>
          <Link to="/teacher" onClick={() => playClick()} className="btn-outline">
            Apply to Teach
          </Link>
        </div>
      </div>

      <div className="text-center">
        <Link to="/admin" className="text-xs text-[var(--ink-faint)] transition hover:text-[var(--ink-muted)]">
          Admin sign in
        </Link>
      </div>
    </div>
  )
}

function InfoSection({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-cell">
      <div className="stat-cell-value">
        <CountUp value={value} durationMs={900} />
      </div>
      <div className="stat-cell-label">{label}</div>
    </div>
  )
}

function SectionCard({
  to,
  icon: Icon,
  title,
  description,
  featured,
}: {
  to: string
  icon: LucideIcon
  title: string
  description: string
  featured?: boolean
}) {
  return (
    <Link
      to={to}
      onClick={() => playClick()}
      className={`flex items-start gap-4 p-5 ${featured ? 'panel border-[var(--gold)]/40' : 'panel panel-interactive'}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
          featured ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'border border-[var(--hairline-strong)] text-[var(--gold)]'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
      </div>
    </Link>
  )
}
