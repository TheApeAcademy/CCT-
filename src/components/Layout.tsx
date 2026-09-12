import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Radio } from 'lucide-react'
import { setMuted, isMuted, playToggle, playNav, playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import StageBackground from './StageBackground'
import SiteFooter from './SiteFooter'
import ThemeToggle from './ThemeToggle'
import { useLandingTheme } from '../lib/landingTheme'

const MFM_LIVE_URL = 'https://www.mountainoffire.org/live'

// Kids, Teachers, and Admin are deliberately NOT in this bar — each has its
// own separate link (see PortalShell), reached only via the CTA buttons at
// the bottom of the landing page, not via shared site navigation.
const dropdowns = [
  {
    key: 'who',
    label: 'Who We Are',
    items: [
      { to: '/#about', label: 'About the Ministry' },
      { to: '/#wuye', label: 'MFM Wuye' },
      { to: '/#leadership', label: 'Leadership' },
      { to: '/#ministry', label: "Children's Ministry" },
    ],
  },
  {
    key: 'what',
    label: 'What We Do',
    items: [
      { to: '/setup', label: 'New Match' },
      { to: '/training', label: 'Training Mode' },
      { to: '/seasons', label: 'Seasons' },
    ],
  },
  {
    key: 'resources',
    label: 'Resources',
    items: [
      { to: '/questions', label: 'Question Bank' },
      { to: '/history', label: 'History' },
      { to: '/anthem', label: 'Anthem' },
    ],
  },
] as const

export default function Layout() {
  const [muted, setMutedState] = useState(isMuted())
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const isHome = location.pathname === '/'
  // The live quiz experience (ground rules -> gameplay -> results) wants the
  // full viewport, not the site's padded max-w-6xl column, and the header
  // should stay out of the way until the player actually scrolls instead of
  // permanently eating space above a "full screen" game.
  const isFullscreenQuiz = ['/ground-rules', '/play', '/training'].includes(location.pathname) || location.pathname.startsWith('/results/') || location.pathname.startsWith('/match-results/')
  // Theme state lives here (not in Home) so the toggle can sit in the shared
  // navbar - only actually applied (via data-landing-theme below) while on
  // the landing page itself; every other route stays on the app's plain
  // dark tokens regardless of what this holds.
  const { theme, toggle: toggleTheme } = useLandingTheme()
  // Home gets a transparent header floating over the full-bleed hero photo,
  // matching mountainoffire.org — no separate solid bar pushing the image
  // down. It solidifies once scrolled so nav stays legible over page content
  // and reachable without scrolling back to top. Every other route keeps the
  // header solid immediately since there's no hero photo to float over.
  const solidHeader = scrolled || !isHome

  useEffect(() => {
    setMenuOpen(false)
    setOpenDropdown(null)
  }, [location.pathname])

  useEffect(() => {
    if (!isHome && !isFullscreenQuiz) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome, isFullscreenQuiz])

  useEffect(() => {
    if (!openDropdown) return
    const close = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [openDropdown])

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
    <div data-landing-theme={isHome ? theme : undefined} className="relative min-h-screen text-white">
      <StageBackground />
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          solidHeader ? 'site-header' : 'border-b border-transparent bg-transparent'
        } ${isFullscreenQuiz && !scrolled ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 shrink-0 items-center">
            <img
              src="/children-ministry-logo-splash.png"
              alt="MFM Children's Ministry"
              className="h-16 w-auto shrink-0 object-contain sm:h-20"
            />
          </NavLink>

          <nav ref={navRef} className="hidden flex-1 items-center gap-1 md:flex">
            <NavLink to="/" end onClick={() => playNav()} className={({ isActive }) => `site-tab px-3${isActive ? ' is-active' : ''}`}>
              Home
            </NavLink>
            {dropdowns.map((d) => (
              <div key={d.key} className="relative">
                <button
                  onClick={() => {
                    setOpenDropdown((v) => (v === d.key ? null : d.key))
                    playClick()
                  }}
                  className={`site-tab flex items-center gap-1 px-3 ${openDropdown === d.key ? 'is-active' : ''}`}
                  aria-expanded={openDropdown === d.key}
                >
                  {d.label}
                  <span className={`text-[10px] transition-transform ${openDropdown === d.key ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openDropdown === d.key && (
                  <div className="panel absolute left-0 top-full mt-2 w-60 overflow-hidden py-1.5 shadow-2xl shadow-black/50">
                    {d.items.map((item) =>
                      item.to.includes('#') ? (
                        // Same-page anchor: NavLink's isActive matches by pathname only, so
                        // every hash link on "/" would falsely show as active at once. A
                        // plain Link with a fixed style avoids that until real scroll-spy exists.
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => playNav()}
                          className="block px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5"
                        >
                          {item.label}
                        </Link>
                      ) : (
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
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            <Link to="/#contact" onClick={() => playNav()} className="site-tab px-3">
              Contact Us
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={MFM_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClick()}
              className="nav-cta-solid hidden !gap-1.5 !px-4 !py-2 text-xs uppercase sm:inline-flex"
            >
              <Radio className="h-3.5 w-3.5" strokeWidth={2.25} />
              Live
            </a>
            <NavLink to="/join" onClick={() => playNav()} className="nav-cta-outline hidden !px-4 !py-2 text-xs uppercase sm:inline-flex">
              Join
            </NavLink>

            {isHome && <ThemeToggle theme={theme} onToggle={toggleTheme} />}

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
          className={`overflow-y-auto transition-all duration-300 ease-out md:hidden ${
            menuOpen ? 'max-h-[calc(100vh-4rem)] border-t border-[var(--hairline)]' : 'max-h-0 overflow-hidden'
          }`}
        >
          <div className="flex flex-col gap-4 px-4 py-4">
            <div>
              <p className="eyebrow mb-2">Ministry</p>
              <div className="flex flex-col gap-1">
                <MobileLink to="/" end label="Home" />
                <MobileLink to="/#contact" label="Contact Us" />
              </div>
            </div>
            {dropdowns.map((d) => (
              <div key={d.key}>
                <p className="eyebrow mb-2">{d.label}</p>
                <div className="flex flex-col gap-1">
                  {d.items.map((item) => (
                    <MobileLink key={item.to} to={item.to} label={item.label} />
                  ))}
                </div>
              </div>
            ))}
            <a
              href={MFM_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClick()}
              className="nav-cta-solid inline-flex !justify-center !gap-1.5 !px-4 !py-2.5 uppercase"
            >
              <Radio className="h-3.5 w-3.5" strokeWidth={2.25} />
              Live
            </a>
          </div>
        </nav>
      </header>
      <main
        className={`relative z-10 ${
          isFullscreenQuiz
            ? 'flex min-h-[100dvh] w-full flex-col px-0 pb-0 pt-0'
            : `mx-auto max-w-6xl px-4 pb-6 ${isHome ? 'pt-0' : 'pt-24 sm:pt-28'}`
        }`}
      >
        <div key={location.pathname} className={isFullscreenQuiz ? 'animate-page-in flex-1' : 'animate-page-in'}>
          <Outlet />
        </div>
      </main>
      {/* The site footer (links, copyright) has no place on the live quiz screens -
          it was pushing "Next Question" etc. below the fold, forcing a scroll to
          reach it on a screen that's supposed to be full-screen. */}
      {!isFullscreenQuiz && <SiteFooter />
    </div>
  )
}

function MobileLink({ to, end, label }: { to: string; end?: boolean; label: string }) {
  // Same-page anchors (to contains "#") skip NavLink's isActive: it matches by
  // pathname only, so every hash link on "/" would falsely show as active at once.
  if (to.includes('#')) {
    return (
      <Link to={to} onClick={() => playNav()} className="rounded-md px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5">
        {label}
      </Link>
    )
  }
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
