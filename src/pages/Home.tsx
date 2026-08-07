import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db, ensureSeedData } from '../db/db'

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
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Who Wants to Be a{' '}
          <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
            Trivia Champion?
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/70">
          A fully offline, Millionaire-style trivia game built for children's church.
          No wifi needed — everything lives right here on this device.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Questions" value={stats.questions} />
        <StatCard label="Question Sets" value={stats.sets} />
        <StatCard label="Games Played" value={stats.games} />
        <StatCard label="Kids" value={stats.kids} />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/setup"
          className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-4 text-xl font-bold text-purple-950 shadow-lg transition hover:scale-105"
        >
          🎮 Start a Game
        </Link>
        <Link
          to="/questions"
          className="rounded-2xl bg-white/10 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-white/20"
        >
          📚 Manage Questions
        </Link>
        <Link
          to="/history"
          className="rounded-2xl bg-white/10 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-white/20"
        >
          🏆 View History
        </Link>
      </div>

      <div className="mt-6 max-w-2xl rounded-2xl bg-white/5 p-5 text-left text-sm text-white/70">
        <p className="font-semibold text-white">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Add or edit questions in the Question Bank (or use the built-in starter pack).</li>
          <li>Start a game, type in the kid's or team's name, pick a question set and timer.</li>
          <li>Play through 10 levels of questions with lifelines — 50/50, Ask the Church, and Phone a Friend.</li>
          <li>Every completed game is automatically saved to History with the score and answers.</li>
        </ol>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-3xl font-extrabold text-amber-300">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}
