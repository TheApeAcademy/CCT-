import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, Volume2, VolumeX, ChevronDown } from 'lucide-react'
import { setMuted, isMuted, playToggle, playNav, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import StageBackground from './StageBackground'
import SiteFooter from './SiteFooter'

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
  const isLight = location.pathname === '/'

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

  if (isLight) {
    return (
      <div className="mfm-root relative min-h-screen">
        <header className="mfm-header sticky top-0 z-40">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <NavLink to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
              <img src="/church-logo.png" alt="" className="crest h-9 w-9 shrink-0 object-cover" />
              <span className="hidden truncate font-display text-[0.95rem] font-extrabold leading-tight tracking-tight text-[var(--mfm-purple-900)] sm:block">
                MFM Children&apos;s
                <br />
                Ministry
              </span>
            </NavLink>

            <nav className="hidden flex-1 items-center gap-7 lg:flex">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => playNav()}
                  className={({ isActive }) => `mfm-nav-link${isActive ? ' is-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => {
                    setMoreOpen((v) => !v)
                    playClick()
                  }}
                  className="mfm-nav-link flex items-center gap-1"
                  aria-expanded={moreOpen}
                >
                  Bible Quiz
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} />
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-[var(--mfm-hairline)] bg-white py-1.5 shadow-2xl shadow-black/10">
                    {quizNav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => playNav()}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm font-semibold transition ${
                            isActive ? 'text-[var(--mfm-purple-800)]' : 'text-[var(--mfm-ink-soft)] hover:bg-[var(--mfm-purple-50)]'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <NavLink to="/join" onClick={() => playClick()} className="mfm-btn-primary hidden !px-4 !py-2 text-sm sm:inline-flex">
                Join as a Kid
              </NavLink>
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--mfm-ink-soft)] transition hover:bg-[var(--mfm-purple-50)]"
                title={muted ? 'Unmute sounds' : 'Mute sounds'}
                aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              >
                {muted ? <VolumeX className="h-4.5 w-4.5" strokeWidth={1.9} /> : <Volume2 className="h-4.5 w-4.5" strokeWidth={1.9} />}
              </button>
              <button
                onClick={toggleMenu}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--mfm-purple-900)] transition hover:bg-[var(--mfm-purple-50)] lg:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
              </button>
            </div>
          </div>

          <nav
            className={`overflow-hidden border-[var(--mfm-hairline)] transition-all duration-300 ease-out lg:hidden ${
              menuOpen ? 'max-h-[36rem] border-t' : 'max-h-0'
            }`}
          >
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
              <div>
                <p className="mfm-eyebrow mb-2 text-[var(--mfm-purple-700)]">Ministry</p>
                <div className="flex flex-col gap-1">
                  {primaryNav.map((item) => (
                    <MobileLink key={item.to} to={item.to} end={item.to === '/'} label={item.label} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mfm-eyebrow mb-2 text-[var(--mfm-purple-700)]">Bible Quiz</p>
                <div className="flex flex-col gap-1">
                  {quizNav.map((item) => (
                    <MobileLink key={item.to} to={item.to} label={item.label} />
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </header>

        <main>
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>

        <SiteFooter />
      </div>
    )
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
                  <MobileLink key={item.to} to={item.to} end={item.to === '/'} label={item.label} dark />
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Bible Quiz</p>
              <div className="flex flex-col gap-1">
                {quizNav.map((item) => (
                  <MobileLink key={item.to} to={item.to} label={item.label} dark />
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

function MobileLink({ to, end, label, dark }: { to: string; end?: boolean; label: string; dark?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => playNav()}
      className={({ isActive }) =>
        dark
          ? `rounded-md px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/85 hover:bg-white/5'
            }`
          : `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-[var(--mfm-purple-800)] text-white' : 'text-[var(--mfm-ink-soft)] hover:bg-[var(--mfm-purple-50)]'
            }`
      }
    >
      {label}
    </NavLink>
  )
}
