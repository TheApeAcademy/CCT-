import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Swords,
  Dumbbell,
  BookOpen,
  Trophy,
  CalendarRange,
  Music,
  School,
  ArrowRight,
  ScrollText,
  ClipboardCheck,
  FileCheck2,
  type LucideIcon,
} from 'lucide-react'
import { db, ensureSeedData } from '../db/db'
import CountUp from '../components/CountUp'
import HeroCarousel, { type HeroSlide } from '../components/HeroCarousel'
import Reveal from '../components/Reveal'
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
      id: 'welcome',
      eyebrow: "MFM Children's Ministry · Wuye",
      title: (
        <>
          Learn. Compete.
          <br />
          Belong.
        </>
      ),
      description:
        "A digital home for MFM Wuye kids — accounts for teachers and students, a class leaderboard, messaging, and the Bible Quiz your kids already love, built for the ministry and run by the ministry.",
      primaryCta: { label: 'Join as a Kid', to: '/join' },
      secondaryCta: { label: 'Teacher Portal', to: '/teacher' },
      footnote: (
        <blockquote className="max-w-md border-l-2 border-[var(--mfm-gold)]/60 pl-4 text-[15px] italic leading-relaxed text-white/60">
          &ldquo;Train up a child in the way he should go: and when he is old, he will not depart from it.&rdquo;
          <footer className="mt-1.5 not-italic text-xs font-bold uppercase tracking-wide text-white/40">Proverbs 22:6</footer>
        </blockquote>
      ),
    },
    {
      id: 'quiz',
      eyebrow: "A Children's Ministry Feature",
      title: (
        <>
          Bible Quiz Night,
          <br />
          Every Night.
        </>
      ),
      description:
        "A Who Wants to Be a Millionaire-style trivia match with teams, lifelines and a big-screen countdown — fully offline, so nothing depends on the Wi-Fi in the hall.",
      primaryCta: { label: 'Play Quiz', to: '/setup' },
      secondaryCta: { label: 'Train Solo', to: '/training' },
    },
    {
      id: 'transition',
      eyebrow: 'Level Up',
      title: (
        <>
          Transition Class:
          <br />
          Ready For The Next Step.
        </>
      ),
      description:
        'Lectures, Bible citations, checkpoint quizzes and a mock exam — the guided path for kids getting ready to graduate into the next ministry.',
      primaryCta: { label: 'Start Learning', to: '/transition' },
    },
    ...(activeSeason
      ? [
          {
            id: 'season',
            eyebrow: 'Live Now',
            title: <>{activeSeason.name} Is Live.</>,
            description: 'This season is active across the ministry — host a match, keep practicing, and climb the ladder before it ends.',
            primaryCta: { label: 'View Season', to: '/seasons' },
            secondaryCta: { label: 'Host a Match', to: '/setup' },
          } satisfies HeroSlide,
        ]
      : []),
  ]

  return (
    <div className="pb-10">
      <HeroCarousel slides={slides} />

      {/* ---------- stats ---------- */}
      <section className="mfm-section-tint">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Reveal>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--mfm-hairline)] bg-[var(--mfm-hairline)] sm:grid-cols-4">
              <StatCell label="Questions" value={stats.questions} />
              <StatCell label="Question Sets" value={stats.sets} />
              <StatCell label="Matches Played" value={stats.games} />
              <StatCell label="Kids" value={stats.kids} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- compete: bible quiz ---------- */}
      <section className="mfm-section-purple">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <p className="mfm-eyebrow text-[var(--mfm-gold)]">Compete</p>
            <h2 className="mt-2 max-w-lg font-display text-3xl font-extrabold leading-tight sm:text-4xl">Bible Quiz</h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/65">
              Host a live trivia match on the shared screen, train solo at your own pace, or manage the question bank behind
              the scenes.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal>
              <PurpleFeatureCard to="/setup" icon={Swords} title="New Match" description="Teams, lifelines and a live scoreboard on the big screen." featured />
            </Reveal>
            <Reveal delayMs={80}>
              <PurpleFeatureCard to="/training" icon={Dumbbell} title="Training Mode" description="Unlimited solo practice. No teams, no timer, no pressure." />
            </Reveal>
            <Reveal delayMs={160}>
              <PurpleFeatureCard to="/questions" icon={BookOpen} title="Question Bank" description="Add, edit, import and export trivia questions and sets." />
            </Reveal>
            <Reveal delayMs={240}>
              <PurpleFeatureCard to="/history" icon={Trophy} title="History" description="Every completed match, team score, and full recap." />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- learn: transition class ---------- */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <p className="mfm-eyebrow text-[var(--mfm-purple-700)]">Learn</p>
            <h2 className="mt-2 max-w-lg font-display text-3xl font-extrabold leading-tight text-[var(--mfm-ink)] sm:text-4xl">
              Transition Class
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--mfm-ink-soft)]">
              The guided path for kids getting ready to graduate into the next ministry &mdash; one lecture, one checkpoint at
              a time.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Reveal>
              <StepCard step={1} icon={ScrollText} title="Lectures" description="Bible citations and teaching, laid out lecture by lecture." />
            </Reveal>
            <Reveal delayMs={100}>
              <StepCard step={2} icon={ClipboardCheck} title="Checkpoints" description="A short quiz after every lecture to lock in what was taught." />
            </Reveal>
            <Reveal delayMs={200}>
              <StepCard step={3} icon={FileCheck2} title="Mock Exam" description="A full practice exam before the real transition assessment." />
            </Reveal>
          </div>
          <Reveal delayMs={280}>
            <Link
              to="/transition"
              onClick={() => playClick()}
              className="mt-8 inline-flex items-center gap-2 font-display text-sm font-extrabold text-[var(--mfm-purple-800)]"
            >
              Start Transition Class
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- belong: portals ---------- */}
      <section className="mfm-section-tint">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <p className="mfm-eyebrow text-[var(--mfm-purple-700)]">Belong</p>
            <h2 className="mt-2 max-w-lg font-display text-3xl font-extrabold leading-tight text-[var(--mfm-ink)] sm:text-4xl">
              Your Class. Your People.
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--mfm-ink-soft)]">
              Every part of the ministry has a home &mdash; pick the one that&apos;s yours.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Reveal>
              <PortalCard to="/join" icon={Users} title="Kids Dashboard" description="Join a class with a code, no email needed. Points, ID card, messages." />
            </Reveal>
            <Reveal delayMs={100}>
              <PortalCard to="/teacher" icon={GraduationCap} title="Teacher Portal" description="Create classes, manage your roster, message and support your students." />
            </Reveal>
            <Reveal delayMs={200}>
              <PortalCard to="/admin" icon={ShieldCheck} title="Admin Control Centre" description="Senior pastor only. Approve teachers, manage seasons and classes." />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- explore ---------- */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <p className="mfm-eyebrow text-[var(--mfm-purple-700)]">Explore</p>
            <h2 className="mt-2 max-w-lg font-display text-3xl font-extrabold leading-tight text-[var(--mfm-ink)] sm:text-4xl">
              More To Discover
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Reveal>
              <PortalCard to="/seasons" icon={CalendarRange} title="Seasons" description="Every competition season, past and present, in one place." />
            </Reveal>
            <Reveal delayMs={100}>
              <PortalCard to="/history" icon={Trophy} title="History" description="Browse every completed match and see how each team scored." />
            </Reveal>
            <Reveal delayMs={200}>
              <PortalCard to="/anthem" icon={Music} title="Anthem" description="Our children's ministry anthem, with lyrics and a read-aloud." />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="mfm-section-tint">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <p className="mfm-eyebrow text-[var(--mfm-purple-700)]">How It Works</p>
            <h2 className="mt-2 max-w-lg font-display text-3xl font-extrabold leading-tight text-[var(--mfm-ink)] sm:text-4xl">
              Four Steps To Get Started
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, text: 'Teachers apply for an account; the admin approves them from the Control Centre.' },
              { icon: School, text: 'A teacher creates a class and shares its join code or link with their kids.' },
              { icon: Users, text: 'Kids join with the code, pick their name, and set a PIN, no email needed.' },
              { icon: Trophy, text: "From their dashboard, kids play the Bible Quiz, climb the leaderboard, and message their teacher." },
            ].map((step, i) => (
              <Reveal key={i} delayMs={i * 90}>
                <div className="mfm-card flex h-full flex-col gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mfm-purple-100)] font-display text-sm font-extrabold text-[var(--mfm-purple-800)]">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--mfm-ink-soft)]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-3 py-6 text-center">
      <div className="font-display text-2xl font-extrabold text-[var(--mfm-purple-900)] sm:text-3xl">
        <CountUp value={value} durationMs={900} />
      </div>
      <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--mfm-ink-faint)]">{label}</div>
    </div>
  )
}

function PortalCard({ to, icon: Icon, title, description }: { to: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Link to={to} onClick={() => playClick()} className="mfm-card flex h-full flex-col gap-3 p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mfm-purple-100)] text-[var(--mfm-purple-800)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-lg font-bold text-[var(--mfm-ink)]">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--mfm-ink-soft)]">{description}</p>
      </div>
    </Link>
  )
}

function PurpleFeatureCard({
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
      className={`flex h-full flex-col gap-3 rounded-2xl p-6 transition hover:-translate-y-1 ${
        featured ? 'bg-[var(--mfm-gold)] text-[var(--mfm-gold-ink)] shadow-[var(--mfm-shadow-lift)]' : 'bg-white/95 text-[var(--mfm-ink)]'
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          featured ? 'bg-black/10' : 'bg-[var(--mfm-purple-100)] text-[var(--mfm-purple-800)]'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className={`mt-1 text-sm leading-relaxed ${featured ? 'text-[var(--mfm-gold-ink)]/75' : 'text-[var(--mfm-ink-soft)]'}`}>
          {description}
        </p>
      </div>
    </Link>
  )
}

function StepCard({ step, icon: Icon, title, description }: { step: number; icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mfm-card relative flex h-full flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mfm-purple-100)] text-[var(--mfm-purple-800)]">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="font-display text-2xl font-extrabold text-[var(--mfm-hairline-strong)]">{step}</span>
      </div>
      <div>
        <p className="font-display text-lg font-bold text-[var(--mfm-ink)]">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--mfm-ink-soft)]">{description}</p>
      </div>
    </div>
  )
}
