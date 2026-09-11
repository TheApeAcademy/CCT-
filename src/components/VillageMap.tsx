import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { User } from 'lucide-react'
import { playClick } from '../lib/sound'

export type VillageTab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears' | 'game'

interface Building {
  id: VillageTab
  label: string
  image: string
  /** x/y is the building's GROUND point on /kids-village-map.jpg (where its base/feet
   * touch down), not its center - the image is anchored bottom-center to it so it reads
   * as standing on the spot instead of floating with the spot at its middle. width is a
   * percent of the map's own width; heightPct is that same image's rendered height as a
   * percent of the map's height (map is a fixed 24:43 box), precomputed from each PNG's
   * real aspect ratio so the avatar can hover just above the roof, not through it. */
  x: number
  y: number
  width: number
  heightPct: number
  accent: string
}

// Positions were hand-marked directly on the map art (circled spot by spot), not guessed:
// the stone dais courtyard (My Class), the open grass opposite My House (Leaderboard),
// open lawn by the pond (My Card), the shaded dirt patch under the tree (Bible), the oval
// lawn (My House), and open lawn near the flower bed, shared by Ears for You and Game
// (My Teacher's spot is open lawn by the willow tree).
const BUILDINGS: Building[] = [
  { id: 'class', label: 'My Class', image: '/village/class-backpack.png', x: 73, y: 31, width: 24, heightPct: 12.7, accent: 'var(--lp-accent-class)' },
  { id: 'leaderboard', label: 'Leaderboard', image: '/feature-leaderboard.png', x: 77, y: 87, width: 16, heightPct: 10.6, accent: 'var(--lp-accent-leaderboard)' },
  { id: 'profile', label: 'My Card', image: '/village/profile-card.png', x: 38, y: 48, width: 16, heightPct: 9.4, accent: 'var(--lp-accent-achievements)' },
  { id: 'bible', label: 'Bible', image: '/village/bible-church.png', x: 81, y: 59, width: 22, heightPct: 15.5, accent: 'var(--lp-accent-bible)' },
  { id: 'home', label: 'My House', image: '/village/home-house.png', x: 33, y: 79, width: 28, heightPct: 16.6, accent: 'var(--hero-accent)' },
  { id: 'ears', label: 'Ears for You', image: '/village/ears-app.png', x: 18, y: 20, width: 15, heightPct: 8.7, accent: 'var(--lp-accent-ears)' },
  { id: 'game', label: 'Live Quiz Match', image: '/village/game-rocket.png', x: 37, y: 18, width: 15, heightPct: 8.4, accent: 'var(--lp-accent-compete)' },
  { id: 'messages', label: 'My Teacher', image: '/village/messages-teacherhome.png', x: 78, y: 19, width: 18, heightPct: 9.6, accent: 'var(--lp-accent-training)' },
]

const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<VillageTab, Building>

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
    <div className="relative w-full" style={{ aspectRatio: '24 / 43' }}>
      <img
        src="/kids-village-map.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* ---------- the 7 building spots ---------- */}
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
            aria-label={b.label}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%` }}
            animate={reduced ? undefined : { y: [0, -3, 0] }}
            transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: b.x / 20 }}
            whileHover={reduced ? undefined : { scale: 1.1, transition: { duration: 0.25 } }}
            whileTap={reduced ? undefined : { scale: 0.92 }}
          >
            <img
              src={b.image}
              alt=""
              className="w-full object-contain"
              style={{
                filter: isActive
                  ? `drop-shadow(0 0 16px ${b.accent}) drop-shadow(0 8px 14px rgba(0,0,0,0.4))`
                  : 'drop-shadow(0 8px 14px rgba(0,0,0,0.4))',
              }}
            />
          </motion.button>
        )
      })}

      {/* ---------- kid avatar, hops from building to building ---------- */}
      <AnimatePresence>
        <motion.div
          key="avatar"
          className="pointer-events-none absolute z-20 -translate-x-1/2"
          initial={false}
          animate={{ left: `${avatarAt.x}%`, top: `${avatarAt.y - avatarAt.heightPct - 2}%` }}
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
  )
}
