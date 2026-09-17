import { motion } from 'framer-motion'

/**
 * A big, tilted 3D "isometric" phone shell - CSS only, no image asset (one
 * is meant to replace this later, see the Home/Teacher-Home redesign
 * conversation). Callers just render their own screen content as children;
 * this only draws the body/bezel/notch/home-indicator chrome around it and
 * a small idle float + bounce-in entrance so it reads as fun, not static.
 */
export default function IsometricPhone({ children, accent = 'var(--gold)' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="flex justify-center py-6" style={{ perspective: 1400 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
        animate={{ opacity: 1, scale: 1, rotateY: -14, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5, ease: 'backOut' },
          rotateY: { duration: 0.6, ease: 'backOut' },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
        }}
        style={{
          width: 300,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(4deg)',
        }}
        className="relative"
      >
        <div
          className="relative overflow-hidden rounded-[46px] border-[10px] shadow-2xl"
          style={{
            borderColor: '#f4f4f6',
            background: '#f4f4f6',
            boxShadow: `0 40px 70px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.06), inset 0 0 0 2px rgba(0,0,0,0.04)`,
          }}
        >
          <div className="relative min-h-[520px] overflow-hidden rounded-[36px]" style={{ background: 'linear-gradient(160deg, #14141c 0%, #0a0a10 100%)' }}>
            <div className="absolute left-1/2 top-3 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-black/80" />
            <div className="relative z-10 flex h-full flex-col pt-11">{children}</div>
            <div className="absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-white/40" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-6 -bottom-6 -z-10 h-10 rounded-full opacity-40 blur-xl"
          style={{ background: accent }}
        />
      </motion.div>
    </div>
  )
}
