import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
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
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <img
        src="/cover.svg"
        alt="MFM Children's Ministry Bible Quiz cover art: kids celebrating on stage"
        className="animate-page-in h-56 w-full max-w-3xl rounded-3xl object-cover shadow-2xl shadow-black/40 ring-1 ring-white/10 sm:h-72"
      />

      <div>
        <p className="mb-2 text-4xl">🏆✨👑</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Who Wants to Be a{' '}
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
            Trivia Champion?
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/70">
          The MFM Children's Ministry Bible Quiz: built for Sunday school teachers and students. Compete in
          seasons, train, prepare for Transition Class, and share what's on your mind, all in one place.
        </p>
        {activeSeason && (
          <Link
            to="/seasons"
            onClick={() => playClick()}
            className="mt-3 inline-block rounded-full bg-amber-400/15 px-4 py-1.5 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:scale-105 hover:bg-amber-400/25"
          >
            🗓️ {activeSeason.name} is active
          </Link>
        )}
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Questions" value={stats.questions} delay={0} />
        <StatCard label="Question Sets" value={stats.sets} delay={80} />
        <StatCard label="Matches Played" value={stats.games} delay={160} />
        <StatCard label="Kids" value={stats.kids} delay={240} />
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        <SectionCard
          to="/setup"
          emoji="🎮"
          title="Compete"
          description="Host a live trivia match. Add teams, take turns on the shared screen, and see who tops the leaderboard."
          featured
        />
        <SectionCard
          to="/training"
          emoji="🏋️"
          title="Training Mode"
          description="Unlimited solo practice. No teams, no timer, no pressure. Train, train, train, and train some more."
        />
        <SectionCard
          to="/transition"
          emoji="🎓"
          title="Transition Class"
          description="Getting ready for teenage church: lectures, bible citations, checkpoint quizzes, and mock exams."
        />
        <SectionCard
          to="/ask"
          emoji="💌"
          title="Ask & Share"
          description="A safe space to drop a question or a worry, anonymously or not, and get a reply from your teacher."
        />
        <SectionCard to="/questions" emoji="📚" title="Question Bank" description="Add, edit, import, and export trivia questions and sets." />
        <SectionCard to="/history" emoji="🏆" title="History" description="Every completed match, team score, and full recap." />
        <SectionCard to="/seasons" emoji="🗓️" title="Seasons" description="Run the quiz in seasons, e.g. one per term, and group matches by season." />
        <SectionCard to="/anthem" emoji="🎶" title="Anthem" description="Our children's ministry anthem, with lyrics and a read-aloud." />
      </div>

      <div className="mt-2 max-w-2xl rounded-2xl border border-white/5 bg-white/5 p-5 text-left text-sm text-white/70 shadow-lg shadow-black/20">
        <p className="font-display font-semibold text-white">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Add or edit questions in the Question Bank (or use the built-in starter pack).</li>
          <li>Start a match, add each team or kid playing, pick a question set and timer.</li>
          <li>Teams take turns answering 10 questions each, with lifelines: 50/50, Ask the Church, and Phone a Friend.</li>
          <li>Every completed match is saved to History with each team's score and full recap.</li>
        </ol>
      </div>
    </div>
  )
}

function StatCard({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div
      className="animate-page-in rounded-2xl border border-white/5 bg-white/5 p-4 shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-white/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="font-display text-3xl font-extrabold text-amber-300">
        <CountUp value={value} durationMs={900} />
      </div>
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}

function SectionCard({
  to,
  emoji,
  title,
  description,
  featured,
}: {
  to: string
  emoji: string
  title: string
  description: string
  featured?: boolean
}) {
  return (
    <Link
      to={to}
      onClick={() => playClick()}
      className={`flex flex-col items-start gap-2 rounded-2xl p-6 text-left shadow-lg transition hover:scale-[1.02] ${
        featured
          ? 'animate-pulse-glow bg-gradient-to-br from-amber-400 to-yellow-500 text-purple-950'
          : 'border border-white/5 bg-white/5 text-white shadow-black/20 hover:bg-white/10'
      }`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="font-display text-xl font-bold">{title}</span>
      <span className={featured ? 'text-purple-950/80' : 'text-white/60'}>{description}</span>
    </Link>
  )
}
