import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { setMuted, isMuted } from '../lib/sound'

const navItems = [
  { to: '/', label: '🏠 Home' },
  { to: '/questions', label: '📚 Question Bank' },
  { to: '/setup', label: '🎮 New Game' },
  { to: '/history', label: '🏆 History' },
]

export default function Layout() {
  const [muted, setMutedState] = useState(isMuted())

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="text-2xl">✨</span>
          <span>Children's Church Trivia</span>
        </NavLink>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-amber-400 text-purple-950 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={toggleMute}
            className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
