import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { Home as HomeIcon, School, BookOpen, Trophy, IdCard, MessageCircle, HeartHandshake, User, type LucideIcon } from 'lucide-react'
import { playClick } from '../lib/sound'

export type VillageTab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears'

interface Building {
  id: VillageTab
  label: string
  icon: LucideIcon
  accent: string
  x: number
  y: number
  /** Drop a real illustration in later - falls back to a big colourful icon chip until then. */
  image?: string
}

const BUILDINGS: Building[] = [
  { id: 'home', label: 'My House', icon: HomeIcon, accent: 'var(--hero-accent)', x: 50, y: 86 },
  { id: 'class', label: 'My Class', icon: School, accent: 'var(--lp-accent-class)', x: 22, y: 68 },
  { id: 'messages', label: 'My Teacher', icon: MessageCircle, accent: 'var(--lp-accent-training)', x: 36, y: 56 },
  { id: 'ears', label: 'Ears for You', icon: HeartHandshake, accent: 'var(--lp-accent-ears)', x: 60, y: 66 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, accent: 'var(--lp-accent-leaderboard)', x: 80, y: 50 },
  { id: 'bible', label: 'Bible', icon: BookOpen, accent: 'var(--lp-accent-bible)', x: 30, y: 34 },
  { id: 'profile', label: 'My Card', icon: IdCard, accent: 'var(--lp-accent-achievements)', x: 64, y: 20 },
]

const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<VillageTab, Building>

// The main dirt road, visiting every building except the little grass
// path off to the teacher's hut (drawn separately below).
const ROAD_ORDER: VillageTab[] = ['home', 'class', 'ears', 'leaderboard', 'bible', 'profile']

function curve(a: Building, b: Building) {
  const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18
  const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.18
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`
}

const CLOUDS = [
  { top: '8%', size: 60, duration: 46, delay: 0 },
  { top: '16%', size: 40, duration: 60, delay: -12 },
  { top: '5%', size: 34, duration: 52, delay: -30 },
]

const FLOWERS = [
  { x: 10, y: 80, color: 'var(--lp-accent-anthem)' },
  { x: 90, y: 84, color: 'var(--lp-accent-compete)' },
  { x: 68, y: 78, color: 'var(--lp-accent-leaderboard)' },
  { x: 14, y: 46, color: 'var(--lp-accent-training)' },
  { x: 48, y: 50, color: 'var(--lp-accent-anthem)' },
  { x: 88, y: 30, color: 'var(--lp-accent-compete)' },
  { x: 10, y: 24, color: 'var(--lp-accent-leaderboard)' },
  { x: 46, y: 12, color: 'var(--lp-accent-training)' },
]

export default function VillageMap({
  active,
  onNavigate,
  avatarUrl,
}: {
  active: VillageTab
  onNavigate: (tab: VillageTab) => void
  avatarUrl?: string | null
}) {
  const reduced = useReducedMotion()
  const avatarAt = BY_ID[active] ?? BY_ID.home

  return (
    <div className="relative overflow-hidden rounded-[28px] border-2 border-[var(--lp-hairline-strong)]" style={{ aspectRatio: '4 / 5' }}>
      {/* ---------- sky + sun + clouds ---------- */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #8ec9f0 0%, #bfe4f7 38%, #d9f0c9 55%, #8fce6a 62%, #6fb852 100%)' }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: '6%',
          right: '10%',
          width: '15%',
          aspectRatio: '1 / 1',
          background: 'radial-gradient(circle, #fff6c8 0%, #ffe17d 60%, #ffd23f 100%)',
          boxShadow: '0 0 40px 10px rgba(255, 210, 63, 0.45)',
          animation: reduced ? undefined : 'lp-sprinkle-float 6s ease-in-out infinite',
        }}
      />
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/80"
          style={{
            top: c.top,
            left: '-20%',
            width: c.size,
            height: c.size * 0.5,
            filter: 'blur(0.5px)',
            animation: reduced ? undefined : `village-cloud-drift ${c.duration}s linear infinite`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {/* ---------- flowers scattered in the grass ---------- */}
      {FLOWERS.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            animation: reduced ? undefined : 'lp-sprinkle-float 3.6s ease-in-out infinite',
            animationDelay: `${i * 0.3}s`,
          }}
        >
          <div className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5" style={{ background: f.color }} />
        </div>
      ))}

      {/* ---------- roads ---------- */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {ROAD_ORDER.slice(1).map((id, i) => {
          const a = BY_ID[ROAD_ORDER[i]]
          const b = BY_ID[id]
          const d = curve(a, b)
          return (
            <g key={id}>
              <path d={d} fill="none" stroke="#c9a266" strokeWidth={3.2} strokeLinecap="round" opacity={0.9} />
              <path d={d} fill="none" stroke="#e8caa0" strokeWidth={1.6} strokeDasharray="1.5 2.5" strokeLinecap="round" />
            </g>
          )
        })}
        {/* the little grass path from Class over to the teacher's hut - not the tarred road */}
        <path
          d={curve(BY_ID.class, BY_ID.messages)}
          fill="none"
          stroke="#5a8f3c"
          strokeWidth={1.2}
          strokeDasharray="0.8 1.6"
          strokeLinecap="round"
          opacity={0.85}
        />
      </svg>

      {/* ---------- buildings ---------- */}
      {BUILDINGS.map((b) => {
        const isActive = b.id === active
        return (
          <motion.button
            key={b.id}
            type="button"
            onClick={() => {
              playClick()
              onNavigate(b.id)
            }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            animate={reduced ? undefined : { y: [0, -5, 0] }}
            transition={reduced ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: b.x / 20 }}
            whileHover={reduced ? undefined : { scale: 1.14, rotate: [0, -4, 4, 0], transition: { duration: 0.4 } }}
            whileTap={reduced ? undefined : { scale: 0.9 }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-3xl border-[3px] border-white shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]"
              style={{
                background: `linear-gradient(160deg, ${b.accent}, color-mix(in srgb, ${b.accent} 60%, black))`,
                boxShadow: isActive ? `0 0 0 4px white, 0 0 0 7px ${b.accent}` : undefined,
              }}
            >
              {b.image ? (
                <img src={b.image} alt="" className="h-full w-full rounded-3xl object-cover" />
              ) : (
                <b.icon className="h-7 w-7 text-white sm:h-9 sm:w-9" strokeWidth={2} />
              )}
            </span>
            <span
              className="rounded-full border border-[var(--lp-hairline-strong)] bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--lp-heading)] shadow sm:text-xs"
              style={{ fontFamily: 'Fredoka, var(--font-display)' }}
            >
              {b.label}
            </span>
          </motion.button>
        )
      })}

      {/* ---------- kid avatar, hops from building to building ---------- */}
      <AnimatePresence>
        <motion.div
          key="avatar"
          className="pointer-events-none absolute z-20 -translate-x-1/2"
          initial={false}
          animate={{ left: `${avatarAt.x}%`, top: `${avatarAt.y - 11}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 16 }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -6, 0] }}
            transition={reduced ? undefined : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-[var(--hero-accent)] shadow-xl sm:h-12 sm:w-12"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={2.25} />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
