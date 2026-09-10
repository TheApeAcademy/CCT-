import { Link, Outlet } from 'react-router-dom'
import StageBackground from './StageBackground'

// Admin, Teacher, and Kids each live behind their own link with their own
// chrome — no shared nav bar between them, and no nav bar back to the
// public quiz site. This is deliberate: the three portals should feel
// like three separate applications, not tabs inside one app.
export default function PortalShell({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="relative min-h-screen text-white">
      <StageBackground />
      <header className="relative z-10 border-b border-[var(--hairline)]">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3.5">
          <img src="/church-logo.png" alt="" className="crest h-8 w-8 shrink-0 object-cover" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{eyebrow}</span>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="relative z-10 mx-auto max-w-5xl px-4 pb-8 pt-4">
        <Link to="/" className="text-xs text-[var(--ink-faint)] transition hover:text-[var(--ink-muted)]">
          &larr; MFM Children&apos;s Ministry
        </Link>
      </footer>
    </div>
  )
}
