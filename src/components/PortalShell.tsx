import { lazy, Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import BackButton from './BackButton'
import ThemeToggle from './ThemeToggle'
import { useAutoHideNav } from '../lib/useAutoHideNav'
import { useLandingTheme } from '../lib/landingTheme'

// Lazy on purpose. This shell is the route element itself, so it is imported
// eagerly and anything it pulls in lands in the shared entry chunk that the
// offline quiz also has to download. The bell needs the Supabase client and a
// handful of icons; behind a lazy boundary none of that is in the entry.
const NotificationBell = lazy(() => import('./NotificationBell'))

/**
 * Chrome for Admin, Teacher and Parent - built from the same light design
 * language as the landing page and the kids' own KidsShell (see its comment
 * for how .site-light-theme/data-landing-theme work). Each portal still has
 * no shared nav bar with the others or with the public site: this just
 * means Admin, Teacher, and Kids now all speak the same visual language
 * instead of Admin/Teacher being stuck on the app's plain dark default.
 *
 * data-apple-chrome is the iCloud treatment (see the design reference
 * mapping): one soft elevation instead of a border on every block, three
 * radii, and controls that stay quiet until you reach for them. Structure
 * only - the palette is still this app's own. Deliberately not
 * data-kid-surface: the Duolingo button and heading rules belong to the
 * screens a child taps, not to a teacher's register.
 */
export default function PortalShell({ eyebrow }: { eyebrow: string }) {
  const autoHidden = useAutoHideNav()
  // This shell used to be pinned to light, so an admin or a teacher had no
  // dark mode at all, on the portal or on the sign in page it wraps. It reads
  // the same stored preference the landing page's toggle writes, so one
  // choice follows the person across the whole site.
  const { theme, toggle } = useLandingTheme()
  return (
    <div
      data-apple-chrome=""
      data-landing-theme={theme}
      className={`${theme === 'light' ? 'site-light-theme ' : ''}lp-page relative isolate min-h-screen`}
    >
      <header
        className={`sticky top-0 z-40 border-b border-[var(--lp-hairline)] bg-[var(--lp-bg)] transition-transform duration-300 ${
          autoHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
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
            <span className="lp-eyebrow truncate">{eyebrow}</span>
            <ThemeToggle theme={theme} onToggle={toggle} />
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="relative mx-auto max-w-5xl px-4 pb-8 pt-4 text-center">
        <Link to="/" className="text-xs text-[var(--lp-faint)] transition hover:text-[var(--lp-muted)]">
          &larr; MFM Children&apos;s Ministry
        </Link>
        <p className="mt-1 text-[10px] text-[var(--lp-faint)]">Built by Zebraish</p>
      </footer>
    </div>
  )
}
