import type { ReactNode } from 'react'

/**
 * L3, from the Premier League reference: the teacher and admin lists are
 * built from one list, not twenty.
 *
 * Every roster, register, application queue and class list in the two
 * portals used to be a stack of separate .panel cards, each with its own
 * padding (p-4 here, p-5 there), its own border, and a height that changed
 * with whatever was inside it. Twenty lists, twenty slightly different
 * rhythms, and a page that reads as a pile of boxes rather than a table.
 *
 * Here they are one surface: a single panel, rows divided by hairlines, the
 * same row height and the same gutters throughout, a small-caps head, and
 * numbers set in tabular figures so the right-hand edge is a straight line
 * down the page. A row grows only when it genuinely carries more (a message
 * on an application, a set of actions), and it grows downward from the same
 * top gutter, so the left edge never moves.
 */
export function DataList({
  head,
  empty,
  children,
  count,
}: {
  /**
   * What the list is of, drawn small-caps above the first column. Kept to
   * the one label: a row's trailing cells are actions of varying width, so
   * a right-hand column heading cannot be made to sit over its own numbers,
   * and a heading that does not line up is worse than no heading.
   */
  head?: ReactNode
  /** Shown instead of the surface when there is nothing to list. */
  empty?: string
  children: ReactNode
  /** When 0, `empty` is shown. */
  count: number
}) {
  if (count === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">{empty ?? 'Nothing here yet.'}</p>
  }
  return (
    <div className="panel overflow-hidden p-0">
      {head && (
        <div className="flex items-center gap-3 border-b border-[var(--hairline-strong)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {head}
        </div>
      )}
      <div className="divide-y divide-[var(--hairline)]">{children}</div>
    </div>
  )
}

export function DataRow({
  children,
  highlight = false,
  innerRef,
}: {
  children: ReactNode
  highlight?: boolean
  innerRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={innerRef}
      className="flex flex-wrap items-center gap-3 px-4 py-3"
      style={{ minHeight: 60, background: highlight ? 'color-mix(in srgb, var(--gold) 12%, transparent)' : undefined }}
    >
      {children}
    </div>
  )
}

/** The one thing a row is about: a photo at a fixed crop, a name, a caption. */
export function DataIdentity({
  avatarUrl,
  fallback,
  title,
  subtitle,
}: {
  avatarUrl?: string | null
  fallback?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {(avatarUrl || fallback) &&
        (avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
            {fallback}
          </span>
        ))}
      <div className="min-w-0">
        <p className="truncate font-semibold">{title}</p>
        {subtitle && <p className="truncate text-xs text-[var(--ink-faint)]">{subtitle}</p>}
      </div>
    </div>
  )
}

/** A figure. Right-aligned and tabular, so a column of them lines up. */
export function DataNum({ children, width = 84 }: { children: ReactNode; width?: number }) {
  return (
    <span className="shrink-0 text-right text-sm tabular-nums text-[var(--ink-muted)]" style={{ width }}>
      {children}
    </span>
  )
}

export function DataActions({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 flex-wrap justify-end gap-2">{children}</div>
}

/** A state word, in the row's own colour language. */
export function DataBadge({ tone, children }: { tone: 'good' | 'bad' | 'wait'; children: ReactNode }) {
  const style =
    tone === 'good'
      ? 'bg-emerald-500/15 text-emerald-700'
      : tone === 'bad'
        ? 'bg-red-500/15 text-red-700'
        : 'bg-[var(--gold)]/15 text-[var(--gold)]'
  return (
    <span className={`shrink-0 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${style}`}>{children}</span>
  )
}
