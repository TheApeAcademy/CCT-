import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { User } from 'lucide-react'
import { playClick } from '../lib/sound'

export type VillageTab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears' | 'game'

interface Building {
  id: VillageTab
  label: string
  image: string
  /** x/y is the building's GROUND point on /kids-village-map.jpg (where its base/feet
   * touch down), not its center - the image is anchored bottom-center to it, cropped
   * flush to its own base (no padding under it) so the anchor is accurate. width is a
   * percent of the map's own width; heightPct is that image's rendered height as a
   * percent of the map's height, precomputed from its real aspect ratio so the ground
   * shadow, avatar and label all land at the right spot. tilt gives each one a few
   * degrees of a "toy placed down by hand" lean instead of sitting dead upright. */
  x: number
  y: number
  width: number
  heightPct: number
  tilt: number
  accent: string
}

// Positions were hand-marked directly on the map art (circled spot by spot), not guessed:
// the stone dais courtyard (My Class), the open grass opposite My House (Leaderboard),
// open lawn by the pond (My Card), the shaded dirt patch under the tree (Bible), the oval
// lawn (My House), and open lawn near the flower bed, shared by Ears for You and Game
// (My Teacher's spot is open lawn by the willow tree).
const BUILDINGS: Building[] = [
  { id: 'class', label: 'My Class', image: '/village/class-backpack.png', x: 73, y: 31, width: 24, heightPct: 12.3, tilt: -4, accent: 'var(--lp-accent-class)' },
  { id: 'leaderboard', label: 'Leaderboard', image: '/feature-leaderboard.png', x: 77, y: 87, width: 16, heightPct: 10.6, tilt: 5, accent: 'var(--lp-accent-leaderboard)' },
  { id: 'profile', label: 'My Card', image: '/village/profile-card.png', x: 38, y: 48, width: 16, heightPct: 9.1, tilt: -6, accent: 'var(--lp-accent-achievements)' },
  { id: 'bible', label: 'Bible', image: '/village/bible-church.png', x: 81, y: 59, width: 22, heightPct: 15.2, tilt: 3, accent: 'var(--lp-accent-bible)' },
  { id: 'home', label: 'My House', image: '/village/home-house.png', x: 33, y: 79, width: 28, heightPct: 16.2, tilt: -3, accent: 'var(--hero-accent)' },
  { id: 'ears', label: 'Ears for You', image: '/village/ears-app.png', x: 17, y: 20, width: 11, heightPct: 6.2, tilt: 6, accent: 'var(--lp-accent-ears)' },
  { id: 'game', label: 'Live Quiz Match', image: '/village/game-rocket.png', x: 34, y: 18, width: 15, heightPct: 8.2, tilt: -5, accent: 'var(--lp-accent-compete)' },
  { id: 'messages', label: 'My Teacher', image: '/village/messages-teacherhome.png', x: 78, y: 19, width: 18, heightPct: 9.3, tilt: 4, accent: 'var(--lp-accent-training)' },
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

      {/* ---------- the 8 building spots ---------- */}
      {BUILDINGS.map((b) => {
        const isActive = b.id === active
        return (
          <div key={b.id} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%` }}>
            {/* contact shadow - grounds the sprite even where the art's own baked-in shadow is faint */}
            <div
              className="absolute rounded-[50%]"
              style={{
                left: '50%',
                bottom: '-2%',
                width: '80%',
                height: '18%',
                transform: 'translateX(-50%)',
                background: 'radial-gradient(ellipse at center, rgba(20,15,10,0.38) 0%, rgba(20,15,10,0) 72%)',
                filter: 'blur(1.5px)',
              }}
            />
            <motion.button
              type="button"
              onClick={() => {
                playClick()
                onNavigate(b.id)
              }}
              aria-label={b.label}
              className="relative block w-full"
              initial={{ rotate: b.tilt }}
              animate={reduced ? { rotate: b.tilt } : { rotate: b.tilt, y: [0, -3, 0] }}
              transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: b.x / 20 }}
              whileHover={reduced ? undefined : { scale: 1.1, rotate: 0, transition: { duration: 0.25 } }}
              whileTap={reduced ? undefined : { scale: 0.92 }}
            >
              <img
                src={b.image}
                alt=""
                className="w-full object-contain"
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 16px ${b.accent}) drop-shadow(0 6px 8px rgba(0,0,0,0.35))`
                    : 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
                }}
              />
            </motion.button>
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--lp-hairline-strong)] bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--lp-heading)] shadow-md sm:text-xs"
              style={{ marginTop: '2%' }}
            >
              {b.label}
            </span>
          </div>
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
