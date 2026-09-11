import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { User } from 'lucide-react'
import { playClick } from '../lib/sound'

export type VillageTab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears'

interface MapBuilding {
  id: VillageTab
  label: string
  image: string
  /** Percent position + width, hand-matched to one of the map art's three genuinely bare
   * plots (the sandy dais courtyard, the oval lawn, and the shaded dirt patch under the
   * tree) - never on top of the pond/flower beds/fences, those are already "furnished". */
  x: number
  y: number
  width: number
  accent: string
}

// Only 3 spots on /kids-village-map.jpg are actually empty building plots - everything
// else (the mirror pond, both flower beds, the birdbath, the vegetable bed, the mailbox)
// is already decorated with its own prop and isn't meant to have a building dropped on it.
const MAP_BUILDINGS: MapBuilding[] = [
  { id: 'leaderboard', label: 'Leaderboard', image: '/feature-leaderboard.png', x: 74, y: 27, width: 30, accent: 'var(--lp-accent-leaderboard)' },
  { id: 'bible', label: 'Bible', image: '/village/bible-church.png', x: 33, y: 76, width: 30, accent: 'var(--lp-accent-bible)' },
  { id: 'home', label: 'My House', image: '/village/home-house.png', x: 81, y: 58, width: 22, accent: 'var(--hero-accent)' },
]

const MAP_BY_ID = Object.fromEntries(MAP_BUILDINGS.map((b) => [b.id, b])) as Partial<Record<VillageTab, MapBuilding>>

interface DockItem {
  id: VillageTab
  label: string
  image: string
  accent: string
}

// The map art only has 3 real plots, so the other sections live in a simple dock below
// the map instead of getting pasted onto a pond or a flower bed.
const DOCK_ITEMS: DockItem[] = [
  { id: 'class', label: 'My Class', image: '/village/class-backpack.png', accent: 'var(--lp-accent-class)' },
  { id: 'profile', label: 'My Card', image: '/village/profile-card.png', accent: 'var(--lp-accent-achievements)' },
  { id: 'messages', label: 'My Teacher', image: '/village/messages-teacher.png', accent: 'var(--lp-accent-training)' },
  { id: 'ears', label: 'Ears for You', image: '/village/ears-hearttree.png', accent: 'var(--lp-accent-ears)' },
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
  const avatarAt = MAP_BY_ID[active] ?? MAP_BY_ID.home!

  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: '24 / 43' }}>
        <img
          src="/kids-village-map.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* ---------- the 3 real building plots ---------- */}
        {MAP_BUILDINGS.map((b) => {
          const isActive = b.id === active
          return (
            <motion.button
              key={b.id}
              type="button"
              onClick={() => {
                playClick()
                onNavigate(b.id)
              }}
              aria-label={b.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%` }}
              animate={reduced ? undefined : { y: [0, -3, 0] }}
              transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: b.x / 20 }}
              whileHover={reduced ? undefined : { scale: 1.08, transition: { duration: 0.25 } }}
              whileTap={reduced ? undefined : { scale: 0.92 }}
            >
              <img
                src={b.image}
                alt=""
                className="w-full object-contain"
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 18px ${b.accent}) drop-shadow(0 10px 16px rgba(0,0,0,0.4))`
                    : 'drop-shadow(0 10px 16px rgba(0,0,0,0.4))',
                }}
              />
            </motion.button>
          )
        })}

        {/* ---------- kid avatar, hops between the 3 map plots ---------- */}
        <AnimatePresence>
          <motion.div
            key="avatar"
            className="pointer-events-none absolute z-20 -translate-x-1/2"
            initial={false}
            animate={{ left: `${avatarAt.x}%`, top: `${avatarAt.y - avatarAt.width * 0.55}%` }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 130, damping: 15 }}
          >
            <motion.div
              animate={reduced ? undefined : { y: [0, -5, 0] }}
              transition={reduced ? undefined : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[var(--hero-accent)] shadow-xl sm:h-11 sm:w-11"
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

      {/* ---------- the rest of the sections, in a plain dock (not pasted onto the art) ---------- */}
      <div className="bg-[var(--lp-bg)] px-4 pb-6 pt-5">
        <p className="lp-eyebrow mb-3" style={{ ['--card-accent' as string]: 'var(--lp-muted)' }}>
          More
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {DOCK_ITEMS.map((d) => {
            const isActive = d.id === active
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  playClick()
                  onNavigate(d.id)
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition"
                style={{
                  borderColor: isActive ? d.accent : 'var(--lp-hairline-strong)',
                  background: isActive ? `color-mix(in srgb, ${d.accent} 12%, transparent)` : 'var(--lp-bg-panel)',
                }}
              >
                <img src={d.image} alt="" className="h-11 w-11 object-contain sm:h-12 sm:w-12" />
                <span className="text-center text-[10px] font-bold leading-tight text-[var(--lp-heading)] sm:text-[11px]">{d.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
