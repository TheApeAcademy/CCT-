import { ShieldCheck, Lock, Eye, Users, Heart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const GUARANTEES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Lock,
    title: 'No public profiles, no random messaging',
    body: 'Children never appear on a public leaderboard visible outside the ministry, and there is no way for a child to message another child directly. Every conversation a child has is with their own assigned teacher.',
  },
  {
    icon: Eye,
    title: 'Role separation, enforced at the database, not just the screen',
    body: "A teacher can only ever see their own class. An admin can see across the ministry. A child can only see their own data. These aren't just hidden buttons - they're enforced by database security rules (row-level security) that hold even if someone tried to call the system directly, bypassing the app entirely.",
  },
  {
    icon: Heart,
    title: '"Ears for You" protects a child’s identity when they ask it to',
    body: 'When a child sends a message anonymously, the real identity is never returned to a teacher or admin by any path - not just hidden by the screen, removed from the data itself before it ever reaches them. Only the message is visible.',
  },
  {
    icon: Users,
    title: 'Parents opt in - nothing is created without them',
    body: "A parent account is never auto-created when a child signs up. A parent creates their own account, on their own device, and links to their child using a code only the child can see and choose to share. There's no unclaimed account sitting around waiting for anyone to \"discover\" it.",
  },
  {
    icon: ShieldCheck,
    title: 'Sensitive actions are logged',
    body: 'Actions around a safeguarding conversation (a message being read, acknowledged, replied to, or escalated) are recorded with who did it and when, so there is always a real record - not just a promise - of who saw what.',
  },
]

export default function Safety() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Safety &amp; Privacy</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--ink-muted)] sm:text-base">
          Here is exactly how this platform protects the children who use it - not a marketing summary, but the actual guarantees built into
          the system.
        </p>
      </div>

      <div className="space-y-4">
        {GUARANTEES.map((g) => (
          <div key={g.title} className="panel flex gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
              <g.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-display font-bold">{g.title}</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{g.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-6 text-center">
        <p className="font-display text-lg font-bold">Have a concern?</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          If you ever have a safeguarding concern about a child on this platform, contact the ministry directly - do not wait on an app
          feature to raise it.
        </p>
      </div>
    </div>
  )
}
