import { Link, Outlet } from 'react-router-dom'
import BackButton from './BackButton'

/**
 * Chrome for Admin and Teacher - built from the same light, colourful design
 * language as the landing page and the kids' own KidsShell (see its comment
 * for how .site-light-theme/data-landing-theme work). Each portal still has
 * no shared nav bar with the others or with the public site: this just
 * means Admin, Teacher, and Kids now all speak the same visual language
 * instead of Admin/Teacher being stuck on the app's plain dark default.
 */
export default function PortalShell({ eyebrow }: { eyebrow: string }) {
  return (
    <div data-landing-theme="light" className="site-light-theme lp-page relative isolate min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(var(--lp-hairline-strong) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <header className="relative z-10 border-b border-[var(--lp-hairline)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <BackButton />
            <Link to="/" className="flex min-w-0 shrink-0 items-center">
              <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" className="h-14 w-auto object-contain sm:h-16" />
            </Link>
          </div>
          <span className="lp-eyebrow">{eyebrow}</span>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="relative z-10 mx-auto max-w-5xl px-4 pb-8 pt-4 text-center">
        <Link to="/" className="text-xs text-[var(--lp-faint)] transition hover:text-[var(--lp-muted)]">
          &larr; MFM Children&apos;s Ministry
        </Link>
      </footer>
    </div>
  )
}
