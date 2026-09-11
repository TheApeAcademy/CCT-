import { Flame, Trophy, Award, MessageCircle, User } from 'lucide-react'
import { RevealItem } from './Reveal'

const tiles = [
  {
    key: 'bible',
    icon: Flame,
    accent: 'var(--lp-accent-bible)',
    title: 'Bible & Streak',
    body: "A short daily reading with a streak that keeps count — come back tomorrow and it grows.",
    preview: (
      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className="h-6 flex-1 rounded-md"
            style={{ background: i < 4 ? 'color-mix(in srgb, var(--lp-accent-bible) 55%, transparent)' : 'var(--lp-hairline)' }}
          />
        ))}
      </div>
    ),
  },
  {
    key: 'leaderboard',
    icon: Trophy,
    accent: 'var(--lp-accent-leaderboard)',
    title: 'Leaderboard',
    body: 'Every quiz point counts toward a real class ranking — see exactly where you stand.',
    preview: (
      <div className="mt-4 space-y-1.5">
        {[
          { rank: 1, name: 'You', points: 480, me: true },
          { rank: 2, name: 'Classmate', points: 410, me: false },
        ].map((r) => (
          <div
            key={r.rank}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            style={{
              background: r.me ? 'color-mix(in srgb, var(--lp-accent-leaderboard) 16%, transparent)' : 'transparent',
              color: r.me ? 'var(--lp-heading)' : 'var(--lp-muted)',
            }}
          >
            <span className="flex items-center gap-2">
              <span className="w-4 text-center font-display font-bold">{r.rank}</span>
              <User className="h-3.5 w-3.5" strokeWidth={1.75} />
              {r.name}
            </span>
            <span style={{ color: 'var(--lp-accent-leaderboard)' }}>{r.points}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'achievements',
    icon: Award,
    accent: 'var(--lp-accent-achievements)',
    title: 'Achievements',
    body: 'Badges for streaks, match wins, and milestones — collected right on your profile.',
    preview: (
      <div className="mt-4 flex gap-2">
        {[Award, Trophy, Flame].map((Icon, i) => (
          <span
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--lp-accent-achievements) 16%, transparent)',
              color: 'var(--lp-accent-achievements)',
            }}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        ))}
      </div>
    ),
  },
  {
    key: 'ears',
    icon: MessageCircle,
    accent: 'var(--lp-accent-ears)',
    title: 'Ears For You',
    body: 'A safe, private line to your class teacher — for whenever you need to talk.',
    preview: (
      <div className="mt-4 space-y-1.5">
        <div className="w-3/4 rounded-lg rounded-bl-sm px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--lp-bg)', color: 'var(--lp-muted)' }}>
          Hi Teacher, can I ask something?
        </div>
        <div
          className="ml-auto w-3/4 rounded-lg rounded-br-sm px-3 py-1.5 text-right text-xs font-medium"
          style={{ background: 'color-mix(in srgb, var(--lp-accent-ears) 16%, transparent)', color: 'var(--lp-heading)' }}
        >
          Of course — I&apos;m here.
        </div>
      </div>
    ),
  },
] as const

export default function DashboardPreview() {
  return (
    <>
      {tiles.map((tile) => (
        <RevealItem key={tile.key}>
          <div className="lp-panel h-full p-5" style={{ ['--card-accent' as string]: tile.accent }}>
            <span className="lp-icon-chip">
              <tile.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="lp-heading mt-3 font-display text-base font-bold">{tile.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--lp-muted)]">{tile.body}</p>
            {tile.preview}
          </div>
        </RevealItem>
      ))}
    </>
  )
}
