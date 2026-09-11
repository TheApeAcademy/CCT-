import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { Home as HomeIcon, School, BookOpen, Trophy, IdCard, MessageCircle, HeartHandshake, User, type LucideIcon } from 'lucide-react'
import { playClick } from '../lib/sound'

export type VillageTab = 'home' | 'class' | 'bible' | 'leaderboard' | 'profile' | 'messages' | 'ears'

interface Building {
  id: VillageTab
  label: string
  icon: LucideIcon
  accent: string
  /** Percent position matched to an actual empty clearing on the garden map art. */
  x: number
  y: number
  /** Real 3D building illustration - once supplied, this is the whole spot: no chip, no label pill. */
  image?: string
}

// Coordinates are hand-matched to the clearings on /kids-village-map.jpg -
// the mirror & flower nook, the round stone dais, the birdbath, the open
// oval lawn, the vegetable bed, the fenced flower garden by the gate, and
// the mailbox at the foot of the path.
const BUILDINGS: Building[] = [
  { id: 'profile', label: 'My Card', icon: IdCard, accent: 'var(--lp-accent-achievements)', x: 15, y: 9, image: '/village/profile-card.png' },
  // Reuses the same trophy art as the landing page's Leaderboard section for a consistent identity.
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, accent: 'var(--lp-accent-leaderboard)', x: 72, y: 26, image: '/feature-leaderboard.png' },
  { id: 'ears', label: 'Ears for You', icon: HeartHandshake, accent: 'var(--lp-accent-ears)', x: 27, y: 52, image: '/village/ears-hearttree.png' },
  { id: 'bible', label: 'Bible', icon: BookOpen, accent: 'var(--lp-accent-bible)', x: 42, y: 73, image: '/village/bible-church.png' },
  { id: 'class', label: 'My Class', icon: School, accent: 'var(--lp-accent-class)', x: 18, y: 65, image: '/village/class-backpack.png' },
  { id: 'home', label: 'My House', icon: HomeIcon, accent: 'var(--hero-accent)', x: 17, y: 89, image: '/village/home-house.png' },
  { id: 'messages', label: 'My Teacher', icon: MessageCircle, accent: 'var(--lp-accent-training)', x: 62, y: 93, image: '/village/messages-teacher.png' },
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

      {/* ---------- building spots ---------- */}
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
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            animate={reduced ? undefined : { y: [0, -4, 0] }}
            transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: b.x / 20 }}
            whileHover={reduced ? undefined : { scale: 1.12, transition: { duration: 0.25 } }}
            whileTap={reduced ? undefined : { scale: 0.9 }}
          >
            {b.image ? (
              <img
                src={b.image}
                alt=""
                className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 14px ${b.accent}) drop-shadow(0 6px 10px rgba(0,0,0,0.35))`
                    : 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))',
                }}
              />
            ) : (
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-lg sm:h-12 sm:w-12"
                style={{
                  background: `linear-gradient(160deg, ${b.accent}, color-mix(in srgb, ${b.accent} 60%, black))`,
                  boxShadow: isActive
                    ? `0 0 0 3px white, 0 0 0 6px ${b.accent}, 0 6px 14px rgba(0,0,0,0.35)`
                    : '0 4px 10px rgba(0,0,0,0.35)',
                }}
              >
                <b.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={2.25} />
              </span>
            )}
          </motion.button>
        )
      })}

      {/* ---------- kid avatar, hops from spot to spot along the path ---------- */}
      <AnimatePresence>
        <motion.div
          key="avatar"
          className="pointer-events-none absolute z-20 -translate-x-1/2"
          initial={false}
          animate={{ left: `${avatarAt.x}%`, top: `${avatarAt.y - 6}%` }}
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
