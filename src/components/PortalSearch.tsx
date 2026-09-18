import { useEffect, useRef, useState } from 'react'
import { Search, X, User, School, ClipboardList, BookOpen, GraduationCap, type LucideIcon } from 'lucide-react'
import { ministrySearch, type SearchResult, type SearchKind } from '../lib/ministry'
import { playClick } from '../lib/sound'

const ICONS: Record<SearchKind, LucideIcon> = {
  student: User,
  class: School,
  assignment: ClipboardList,
  lecture: BookOpen,
  teacher: GraduationCap,
}

const GROUP_LABEL: Record<SearchKind, string> = {
  student: 'Children',
  class: 'Classes',
  assignment: 'Class work',
  lecture: 'Lessons',
  teacher: 'Teachers',
}

// The order results are grouped in, rather than whatever order the database
// happened to return. A person searching a children's ministry is nearly
// always looking for a child.
const GROUP_ORDER: SearchKind[] = ['student', 'class', 'assignment', 'lecture', 'teacher']

/**
 * One search box for a whole portal.
 *
 * Only the box and the list live here. What can be found is decided by the
 * database, and what happens when a result is tapped is decided by whichever
 * portal mounted this, since only that portal knows where its own screens
 * are.
 */
export default function PortalSearch({ placeholder, onPick }: { placeholder: string; onPick: (result: SearchResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Waits for a pause in typing rather than firing on every keystroke. A
  // teacher typing a six letter name would otherwise send six queries and
  // watch the list rearrange under their thumb five times.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = window.setTimeout(() => {
      ministrySearch(q)
        .then((r) => {
          setResults(r)
          setOpen(true)
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', escape)
    }
  }, [open])

  const pick = (r: SearchResult) => {
    playClick()
    setOpen(false)
    setQuery('')
    onPick(r)
  }

  const grouped = GROUP_ORDER.map((kind) => ({ kind, rows: results.filter((r) => r.kind === kind) })).filter((g) => g.rows.length > 0)

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-[var(--hairline-strong)] px-3 py-2 focus-within:border-[var(--gold)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" strokeWidth={1.75} />
        <input
          id="portal-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search" className="shrink-0 text-[var(--ink-muted)] hover:text-[var(--fg)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[22rem] overflow-y-auto rounded-md border border-[var(--hairline-strong)] bg-[var(--ink-panel)] shadow-xl">
          {searching && results.length === 0 && <p className="px-4 py-5 text-center text-sm text-[var(--ink-muted)]">Looking…</p>}
          {!searching && results.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-[var(--ink-muted)]">Nothing matches “{query.trim()}”.</p>
          )}
          {grouped.map((group) => {
            const Icon = ICONS[group.kind]
            return (
              <div key={group.kind}>
                <p className="border-b border-[var(--hairline)] bg-[var(--fg)]/[0.03] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                  {GROUP_LABEL[group.kind]}
                </p>
                {group.rows.map((r) => (
                  <button
                    key={`${r.kind}-${r.id}`}
                    onClick={() => pick(r)}
                    className="flex w-full items-center gap-3 border-b border-[var(--hairline)] px-4 py-2.5 text-left transition last:border-b-0 hover:bg-[var(--fg)]/5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--gold)]" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.title}</span>
                      <span className="block truncate text-xs text-[var(--ink-muted)]">{r.subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
