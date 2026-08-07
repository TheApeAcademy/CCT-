import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { setMuted, isMuted, playToggle, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import StageBackground from './StageBackground'

const navItems = [
  { to: '/', label: '🏠 Home' },
  { to: '/questions', label: '📚 Question Bank' },
  { to: '/setup', label: '🎮 New Game' },
  { to: '/history', label: '🏆 History' },
]

export default function Layout() {
  const [muted, setMutedState] = useState(isMuted())
  const location = useLocation()

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
    if (!next) playToggle(true)
    haptics.tap()
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <StageBackground />
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight font-display">
          <span className="animate-gentle-bob inline-block text-2xl">✨</span>
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
            Children's Church Trivia
          </span>
        </NavLink>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => playNav()}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-amber-400 text-purple-950 shadow-lg shadow-amber-400/30'
                    : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={toggleMute}
            className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 hover:scale-105"
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
