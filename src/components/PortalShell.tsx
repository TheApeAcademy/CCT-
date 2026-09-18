import { lazy, Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import BackButton from './BackButton'
import { useAutoHideNav } from '../lib/useAutoHideNav'

// Lazy on purpose. This shell is the route element itself, so it is imported
// eagerly and anything it pulls in lands in the shared entry chunk that the
// offline quiz also has to download. The bell needs the Supabase client and a
// handful of icons; behind a lazy boundary none of that is in the entry.
const NotificationBell = lazy(() => import('./NotificationBell'))

/**
 * Chrome for Admin and Teacher - built from the same light, colourful design
 * language as the landing page and the kids' own KidsShell (see its comment
 * for how .site-light-theme/data-landing-theme work). Each portal still has
 * no shared nav bar with the others or with the public site: this just
 * means Admin, Teacher, and Kids now all speak the same visual language
 * instead of Admin/Teacher being stuck on the app's plain dark default.
 */
export default function PortalShell({ eyebrow }: { eyebrow: string }) {
  const autoHidden = useAutoHideNav()
  return (
    <div data-landing-theme="light" className="site-light-theme lp-page relative isolate flex min-h-screen flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          // Texture, not pattern. At the stronger hairline and 22px spacing
          // the dots read as a surface of their own competing with the cards
          // on top of them; at the quieter hairline and 28px they do what
          // paper grain does, which is be felt rather than seen.
          backgroundImage: 'radial-gradient(var(--lp-hairline) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
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
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8">
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
