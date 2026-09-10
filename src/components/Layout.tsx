import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { setMuted, isMuted, playToggle, playNav, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import StageBackground from './StageBackground'

const navItems = [
  { to: '/', label: '🏠 Home' },
  { to: '/join', label: '🔑 Join / My Dashboard' },
  { to: '/questions', label: '📚 Question Bank' },
  { to: '/setup', label: '🎮 New Game' },
  { to: '/seasons', label: '🗓️ Seasons' },
  { to: '/training', label: '🏋️ Training' },
  { to: '/transition', label: '🎓 Transition Class' },
  { to: '/history', label: '🏆 History' },
  { to: '/anthem', label: '🎶 Anthem' },
  { to: '/teacher', label: '👩‍🏫 Teacher Portal' },
  { to: '/admin', label: '🛡️ Admin' },
]

export default function Layout() {
  const [muted, setMutedState] = useState(isMuted())
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
    if (!next) playToggle(true)
    haptics.tap()
  }

  const toggleMenu = () => {
    setMenuOpen((v) => !v)
    playClick()
    haptics.tap()
  }

  return (
    <div className="relative min-h-screen text-white">
      <StageBackground />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight font-display">
            <span className="animate-gentle-bob inline-block shrink-0 text-2xl">✨</span>
            <span className="truncate bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent animate-shimmer">
              MFM Children's Ministry Bible Quiz
            </span>
          </NavLink>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleMute}
              className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold transition hover:scale-105 hover:bg-white/20"
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <span
                className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-300 ${
                  menuOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-300 ${
                  menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <nav
          className={`overflow-hidden border-white/10 transition-all duration-300 ease-out ${
            menuOpen ? 'max-h-[32rem] border-t' : 'max-h-0 border-t-0'
          }`}
        >
          <div className="flex flex-col gap-1.5 px-4 py-3">
            {navItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => playNav()}
                style={{ transitionDelay: menuOpen ? `${i * 25}ms` : '0ms' }}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-semibold transition-colors duration-200 ${
                    isActive
                      ? 'bg-amber-400 text-purple-950 shadow-lg shadow-amber-400/30'
                      : 'bg-white/5 text-white hover:bg-white/15'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
