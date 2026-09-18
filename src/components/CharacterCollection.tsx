import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, X } from 'lucide-react'
import { listBibleCharacters, type BibleCharacterRow, type EarnedAchievement } from '../lib/ministry'
import { playClick } from '../lib/sound'

const CHARACTER_CODE_PREFIX = 'character_'

/** Every activity that earns points feeds this - see check_character_unlocks() in Supabase. */
export function unlockedCharacterKeys(achievements: EarnedAchievement[]): Set<string> {
  return new Set(
    achievements.filter((a) => a.code.startsWith(CHARACTER_CODE_PREFIX)).map((a) => a.code.slice(CHARACTER_CODE_PREFIX.length)),
  )
}

/** Dedicated gallery for the character collection - not a re-skin of Bible Journey's "By Character" browse, which is for picking any lesson to learn right away regardless of unlock state. This one is the trophy case. */
export function CharacterCollectionGallery({
  achievements,
  onGoToJourney,
}: {
  achievements: EarnedAchievement[]
  onGoToJourney: () => void
}) {
  const [characters, setCharacters] = useState<BibleCharacterRow[]>([])
  const unlocked = unlockedCharacterKeys(achievements)

  useEffect(() => {
    listBibleCharacters().then(setCharacters)
  }, [])

  const unlockedCount = characters.filter((c) => unlocked.has(c.key)).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white/70">
          {unlockedCount} of {characters.length} unlocked
        </p>
        <button onClick={onGoToJourney} className="text-xs font-bold underline" style={{ color: 'var(--gold)' }}>
          Go learn more
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {characters.map((c) => {
          const isUnlocked = unlocked.has(c.key)
          return (
            <div key={c.key} className="relative aspect-square overflow-hidden rounded-2xl">
              {isUnlocked ? (
                <>
                  <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <p className="font-display absolute bottom-1.5 left-1.5 right-1.5 line-clamp-2 text-[11px] font-extrabold leading-tight text-white drop-shadow">
                    {c.name}
                  </p>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/5">
                  <Lock className="h-5 w-5 text-white/30" strokeWidth={2} />
                  <p className="text-[10px] font-bold text-white/30">{c.book}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-[11px] text-white/40">Keep earning points and finishing lessons - locked ones are a surprise!</p>
    </div>
  )
}

/** The full-screen "you got one!" moment, shown once per newly-unlocked character. */
export function CharacterRevealModal({
  character,
  onClose,
  onGoToJourney,
}: {
  character: BibleCharacterRow
  onClose: () => void
  onGoToJourney: () => void
}) {
  const sparklePositions = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    delay: (i % 7) * 0.12,
  }))

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      >
        {sparklePositions.map((s, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute"
            style={{ left: s.left, top: s.top }}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: 90 }}
            transition={{ duration: 1.6, delay: s.delay, repeat: Infinity, repeatDelay: 1.2 }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--gold)' }} />
          </motion.span>
        ))}

        <motion.div
          initial={{ scale: 0.6, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[#15101f] text-center shadow-2xl"
        >
          <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
            <X className="h-4 w-4" />
          </button>
          <div className="relative h-56 w-full overflow-hidden">
            <img src={character.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#15101f] via-transparent to-black/20" />
          </div>
          <div className="space-y-3 p-5">
            <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>
              New Character Unlocked!
            </p>
            <p className="font-display text-2xl font-extrabold text-white">{character.name}</p>
            <p className="text-sm leading-snug text-white/70">{character.short_story}</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  playClick()
                  onGoToJourney()
                }}
                className="rounded-full py-2.5 text-sm font-bold text-white"
                style={{ background: 'var(--hero-accent)' }}
              >
                Read {character.name}&apos;s Story
              </button>
              <button onClick={onClose} className="rounded-full py-2.5 text-sm font-bold text-white/60">
                Continue
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
