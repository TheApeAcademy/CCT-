import { Link, Outlet } from 'react-router-dom'

/**
 * Chrome for the two public-facing kid screens (sign up / sign in at
 * /join, the dashboard at /student) - light, colourful, and built from
 * the same design language as the landing page, in deliberate contrast
 * to Admin/Teacher's plain dark PortalShell. Sets both data-landing-theme
 * (unlocks --lp-* tokens/classes) and .kids-theme (re-points the shared
 * .panel/.btn-solid/.eyebrow/.stat-strip system - and TabBar - at the
 * same light palette) so every component nested here, old and new alike,
 * renders consistently without needing its own theme plumbing. Kept free
 * of framer-motion/etc. on purpose: unlike JoinClass/StudentPortal this
 * shell is imported eagerly (it's the route element itself), so any heavy
 * dependency here would land in the shared entry chunk the offline quiz
 * has to download too.
 */
export default function KidsShell({ eyebrow }: { eyebrow: string }) {
  return (
    <div data-landing-theme="light" className="kids-theme lp-page relative isolate min-h-screen">
      <header className="relative z-10 border-b border-[var(--lp-hairline)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 shrink-0 items-center">
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" className="h-14 w-auto object-contain sm:h-16" />
          </Link>
          <span className="lp-eyebrow">{eyebrow}</span>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Outlet />
      </main>
      <footer className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-4 text-center">
        <Link to="/" className="text-xs text-[var(--lp-faint)] transition hover:text-[var(--lp-muted)]">
          &larr; MFM Children&apos;s Ministry
        </Link>
      </footer>
    </div>
  )
}
