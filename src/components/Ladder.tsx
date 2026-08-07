import { LADDER } from '../lib/ladder'

export default function Ladder({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="flex flex-col-reverse gap-1 rounded-2xl bg-black/30 p-3">
      {LADDER.map((l) => {
        const isCurrent = l.level === currentLevel
        const isPast = l.level < currentLevel
        return (
          <div
            key={l.level}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-all duration-300 ${
              isCurrent
                ? 'animate-pulse-glow scale-105 bg-amber-400 font-extrabold text-purple-950 shadow-lg'
                : isPast
                  ? 'text-white/40 line-through'
                  : l.isCheckpoint
                    ? 'bg-white/10 font-bold text-amber-300'
                    : 'text-white/70'
            }`}
          >
            <span>{l.level}</span>
            <span>{l.points.toLocaleString()} 👑</span>
          </div>
        )
      })}
    </div>
  )
}
