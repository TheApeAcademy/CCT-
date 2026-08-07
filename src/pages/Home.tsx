import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db, ensureSeedData } from '../db/db'
import CountUp from '../components/CountUp'
import { playClick } from '../lib/sound'

export default function Home() {
  const [stats, setStats] = useState({ questions: 0, sets: 0, games: 0, kids: 0 })

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
      <div>
        <p className="mb-2 text-4xl">🏆✨👑</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Who Wants to Be a{' '}
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
            Trivia Champion?
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/70">
          A fully offline, Millionaire-style trivia game built for children's church.
          No wifi needed. Everything lives right here on this device.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Questions" value={stats.questions} delay={0} />
        <StatCard label="Question Sets" value={stats.sets} delay={80} />
        <StatCard label="Games Played" value={stats.games} delay={160} />
        <StatCard label="Kids" value={stats.kids} delay={240} />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/setup"
          onClick={() => playClick()}
          className="animate-pulse-glow rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-xl font-bold text-purple-950 shadow-lg transition hover:scale-105"
        >
          🎮 Start a Game
        </Link>
        <Link
          to="/questions"
          onClick={() => playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-white/20"
        >
          📚 Manage Questions
        </Link>
        <Link
          to="/history"
          onClick={() => playClick()}
          className="rounded-2xl bg-white/10 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-white/20"
        >
          🏆 View History
        </Link>
      </div>

      <div className="mt-6 max-w-2xl rounded-2xl border border-white/5 bg-white/5 p-5 text-left text-sm text-white/70 shadow-lg shadow-black/20">
        <p className="font-display font-semibold text-white">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Add or edit questions in the Question Bank (or use the built-in starter pack).</li>
          <li>Start a game, add each team or kid playing, pick a question set and timer.</li>
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
