import { playClick } from '../../lib/sound'
import { haptics } from '../../lib/haptics'

export interface SegmentedItem<T extends string> {
  value: T
  label: string
}

/**
 * One switch between two or three views of the same thing.
 *
 * Every copy of this in the app used to be hand-rolled, and each one got the
 * same detail wrong: the selected pill carried the same corner radius as the
 * track it sits in, so it bulged out of its own container. An inner radius
 * has to be the outer radius minus the padding between them, or the two
 * curves fight and the control reads as two pieces that were not made for
 * each other. Here that is one subtraction in one place: 14px track, 4px
 * padding, 10px pill.
 *
 * The pill also slides rather than teleports. It is the cheapest possible
 * way to say "same surface, different view" instead of "new screen", and it
 * costs one transform - no animation library, which matters because this
 * component is reachable from the entry chunk the offline quiz downloads.
 */
export default function SegmentedControl<T extends string>({
  value,
  onChange,
  items,
  className = '',
}: {
  value: T
  onChange: (v: T) => void
  items: SegmentedItem<T>[]
  className?: string
}) {
  const index = Math.max(0, items.findIndex((i) => i.value === value))
  const width = `calc((100% - 8px) / ${items.length})`

  return (
    <div
      role="tablist"
      className={`relative isolate flex rounded-[14px] border border-[var(--hairline)] bg-[var(--ink-panel)] p-1 ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 -z-10 rounded-[10px] bg-[var(--gold)] shadow-[var(--elev-1)]"
        style={{
          width,
          transform: `translateX(calc(${index} * 100%))`,
          transition: 'transform var(--dur-control) var(--ease-pop)',
        }}
      />
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (active) return
              onChange(item.value)
              playClick()
              haptics.tap()
            }}
            className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-bold transition-colors ${
              active ? 'text-[var(--gold-ink)]' : 'text-[var(--ink-muted)] hover:text-[var(--fg)]'
            }`}
            style={{ transitionDuration: 'var(--dur-control)' }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
