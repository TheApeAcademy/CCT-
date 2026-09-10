import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { setMuted, isMuted, playToggle, playNav, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import StageBackground from './StageBackground'

const primaryNav = [
  { to: '/', label: 'Home' },
  { to: '/join', label: 'Kids' },
  { to: '/teacher', label: 'Teachers' },
  { to: '/admin', label: 'Admin' },
]

const quizNav = [
  { to: '/setup', label: 'New Match' },
  { to: '/training', label: 'Training' },
  { to: '/questions', label: 'Question Bank' },
  { to: '/history', label: 'History' },
  { to: '/seasons', label: 'Seasons' },
  { to: '/transition', label: 'Transition Class' },
  { to: '/anthem', label: 'Anthem' },
]

export default function Layout() {
  const [muted, setMutedState] = useState(isMuted())
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [moreOpen])

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
      <header className="site-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <img src="/church-logo.png" alt="" className="crest h-9 w-9 shrink-0 object-cover" />
            <span className="hidden truncate font-display text-[0.95rem] font-extrabold leading-tight tracking-tight sm:block">
              MFM Children&apos;s
              <br />
              Ministry
            </span>
          </NavLink>

          <nav className="hidden flex-1 items-center gap-6 md:flex">
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => playNav()}
                className={({ isActive }) => `site-tab${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative hidden md:block" ref={moreRef}>
              <button
                onClick={() => {
                  setMoreOpen((v) => !v)
                  playClick()
                }}
                className="btn-outline !border-0 !bg-transparent px-3 py-2 text-sm"
                aria-expanded={moreOpen}
              >
                Bible Quiz ▾
              </button>
              {moreOpen && (
                <div className="panel absolute right-0 top-full mt-2 w-56 overflow-hidden py-1.5 shadow-2xl shadow-black/50">
                  {quizNav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => playNav()}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 text-sm font-semibold transition ${
                          isActive ? 'text-[var(--gold)]' : 'text-white/85 hover:bg-white/5'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleMute}
              className="btn-outline !border-0 !bg-transparent p-2 text-base"
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {muted ? '🔇' : '🔊'}
            </button>

            <button
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-md border border-[var(--hairline-strong)] md:hidden"
            >
              <span
                className={`h-0.5 w-4 rounded-full bg-white transition-transform duration-300 ${
                  menuOpen ? 'translate-y-[6px] rotate-45' : ''
                }`}
              />
              <span className={`h-0.5 w-4 rounded-full bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span
                className={`h-0.5 w-4 rounded-full bg-white transition-transform duration-300 ${
                  menuOpen ? '-translate-y-[6px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <nav
          className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${
            menuOpen ? 'max-h-[32rem] border-t border-[var(--hairline)]' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col gap-4 px-4 py-4">
            <div>
              <p className="eyebrow mb-2">Ministry</p>
              <div className="flex flex-col gap-1">
                {primaryNav.map((item) => (
                  <MobileLink key={item.to} to={item.to} end={item.to === '/'} label={item.label} />
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Bible Quiz</p>
              <div className="flex flex-col gap-1">
                {quizNav.map((item) => (
                  <MobileLink key={item.to} to={item.to} label={item.label} />
                ))}
              </div>
            </div>
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

function MobileLink({ to, end, label }: { to: string; end?: boolean; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => playNav()}
      className={({ isActive }) =>
        `rounded-md px-3 py-2.5 text-sm font-semibold transition ${
          isActive ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/85 hover:bg-white/5'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
