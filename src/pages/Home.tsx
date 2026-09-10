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
  type LucideIcon,
} from 'lucide-react'
import { db, ensureSeedData } from '../db/db'
import CountUp from '../components/CountUp'
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

  return (
    <div className="space-y-10 pb-10">
      {/* ---------- hero ---------- */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--hairline)]">
        <img src="/cover.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/85 to-[var(--ink)]/30" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="eyebrow">Children&apos;s Ministry</p>
          <h1 className="mt-2 max-w-xl font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Classes, teachers, and kids &mdash; all in one place.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--ink-muted)]">
            Accounts for teachers and students, a class leaderboard, messaging, and the Bible Quiz your kids already
            love &mdash; built for the ministry, run by the ministry.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/join" onClick={() => playClick()} className="btn-solid">
              Join as a Kid
            </Link>
            <Link to="/teacher" onClick={() => playClick()} className="btn-outline">
              Teacher Portal
            </Link>
            {activeSeason && (
              <Link
                to="/seasons"
                onClick={() => playClick()}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[var(--gold)]"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                {activeSeason.name} active
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ---------- portals ---------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PortalCard to="/join" icon={Users} title="Kids Dashboard" description="Join a class with a code, no email needed. Points, ID card, messages." />
        <PortalCard to="/teacher" icon={GraduationCap} title="Teacher Portal" description="Create classes, manage your roster, message and support your students." />
        <PortalCard to="/admin" icon={ShieldCheck} title="Admin Control Centre" description="Senior pastor only. Approve teachers, manage seasons and classes." />
      </div>

      {/* ---------- stats ---------- */}
      <div className="stat-strip grid-cols-4">
        <StatCell label="Questions" value={stats.questions} />
        <StatCell label="Question Sets" value={stats.sets} />
        <StatCell label="Matches Played" value={stats.games} />
        <StatCell label="Kids" value={stats.kids} />
      </div>

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
            'Kids join with the code, pick their name, and set a PIN, no email needed.',
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

function PortalCard({ to, icon: Icon, title, description }: { to: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Link to={to} onClick={() => playClick()} className="panel panel-interactive flex flex-col gap-3 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
      </div>
    </Link>
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
