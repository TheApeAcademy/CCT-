import type { LucideIcon } from 'lucide-react'
import { playClick } from '../../lib/sound'

export interface TabBarItem<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

export default function TabBar<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (v: T) => void
  items: TabBarItem<T>[]
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--hairline)]">
      {items.map((item) => {
        const active = item.value === value
        const Icon = item.icon
        return (
          <button
            key={item.value}
            onClick={() => {
              onChange(item.value)
              playClick()
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-bold transition ${
              active ? 'border-[var(--gold)] text-[var(--gold)]' : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
