import { lazy, Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import BackButton from './BackButton'
import ThemeToggle from './ThemeToggle'
import { useAutoHideNav } from '../lib/useAutoHideNav'
import { useLandingTheme } from '../lib/landingTheme'
import InstallAppButton from './InstallAppButton'

// Lazy on purpose. This shell is the route element itself, so it is imported
// eagerly and anything it pulls in lands in the shared entry chunk that the
// offline quiz also has to download. The bell needs the Supabase client and a
// handful of icons; behind a lazy boundary none of that is in the entry.
const NotificationBell = lazy(() => import('./NotificationBell'))

/**
 * Chrome for the two public-facing kid screens (sign up / sign in at
 * /join, the dashboard at /student) - light, colourful, and built from
 * the same design language as the landing page (Admin and Teacher's
 * PortalShell now shares this same treatment). Sets both data-landing-theme
 * (unlocks --lp-* tokens/classes) and .site-light-theme (re-points the
 * shared .panel/.btn-solid/.eyebrow/.stat-strip system - and TabBar - at
 * the same light palette) so every component nested here, old and new
 * alike, renders consistently without needing its own theme plumbing. Kept free
 * of framer-motion/etc. on purpose: unlike JoinClass/StudentPortal this
 * shell is imported eagerly (it's the route element itself), so any heavy
 * dependency here would land in the shared entry chunk the offline quiz
 * has to download too.
 *
 * Two of those screens, one marker each, because they answer to different
 * references:
 *
 * - The dashboard is Duolingo's, so it carries data-kid-surface: the one
 *   button shape (D1) and the bigger, rounder headings (D4) in index.css
 *   key off it. PortalShell deliberately does not set it - Admin, Teacher
 *   and Parent share this light shell but keep the grown-up treatment.
 * - The sign-in page is Apple's, so it is `bare`: no chrome competing with
 *   the page, and data-apple-chrome instead (one elevation, three radii,
 *   controls quiet until hover).
 */
export default function KidsShell({ eyebrow, bare = false }: { eyebrow: string; bare?: boolean }) {
  const autoHidden = useAutoHideNav()
  const surface = bare ? { 'data-apple-chrome': '' } : { 'data-kid-surface': '' }
  // Same stored preference as the landing page and PortalShell, so a child
  // who turns the lights down on one screen gets it on all of them. These
  // screens were pinned to light and had no way to change it.
  const { theme, toggle } = useLandingTheme()
  return (
    <div
      {...surface}
      data-landing-theme={theme}
      className={`${theme === 'light' ? 'site-light-theme ' : ''}lp-page relative isolate min-h-screen`}
    >
      {/* The dot texture is the kid screens' ground. The sign-in page has a
          plain one: on Apple's own sign-in there is nothing behind the card
          at all, and that emptiness is the whole effect. */}
      {!bare && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: 'radial-gradient(var(--lp-hairline-strong) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      )}
      {bare ? (
        // Back and nothing else. The page below carries the ministry's mark
        // itself, and a header logo directly above it meant the same logo
        // twice on one screen.
        <header className="relative z-40">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <BackButton />
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </header>
      ) : (
        <header
          className={`sticky top-0 z-40 border-b border-[var(--lp-hairline)] bg-[var(--lp-bg)] transition-transform duration-300 ${
            autoHidden ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              {/* In the header's own row, not floating over it. Pinned at
                  left-3 top-3 it landed squarely on top of the logo at phone
                  width, which is the first thing a child sees here. */}
              <BackButton />
              <Link to="/" className="flex min-w-0 shrink-0 items-center">
                <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" className="h-14 w-auto object-contain sm:h-16" />
              </Link>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <InstallAppButton />
              <span className="lp-eyebrow truncate">{eyebrow}</span>
              <ThemeToggle theme={theme} onToggle={toggle} />
              <Suspense fallback={null}>
                <NotificationBell />
              </Suspense>
            </div>
          </div>
        </header>
      )}
      <main className={`relative z-10 mx-auto max-w-3xl px-4 ${bare ? 'pb-16 pt-2' : 'py-10 sm:py-14'}`}>
        <Outlet />
      </main>
      <footer className="relative mx-auto max-w-3xl px-4 pb-8 pt-4 text-center">
        <Link to="/" className="text-xs text-[var(--lp-faint)] transition hover:text-[var(--lp-muted)]">
          &larr; MFM Children&apos;s Ministry
        </Link>
        <p className="mt-1 text-[10px] text-[var(--lp-faint)]">Built by Zebraish</p>
      </footer>
    </div>
  )
}
