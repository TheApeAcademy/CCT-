import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * C3, from the iCloud reference: a sheet, not a page jump, and one shape for
 * every one of them.
 *
 * The portals had these written out by hand wherever they were needed - the
 * same scrim, the same centred box, the same close button, copied each time
 * and drifting apart. None of them closed on Escape, and none moved focus,
 * so a keyboard was stuck behind the scrim.
 *
 * This is the one: a scrim, the panel rising from the bottom edge on a phone
 * the way a system sheet does and centring on a laptop, Escape to close, the
 * page behind held still, and focus moved into the sheet on open and back on
 * close.
 */
export default function Sheet({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  /** For a sheet carrying an image or a table rather than a question. */
  wide?: boolean
}) {
  const panel = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // The page behind a sheet must not scroll under it.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      returnTo?.focus?.()
    }
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={`sheet-panel ${wide ? 'sheet-panel-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="font-display text-lg font-bold">{title}</p>
          <button onClick={onClose} aria-label="Close" className="shrink-0 text-[var(--ink-muted)] transition hover:text-[var(--fg)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
