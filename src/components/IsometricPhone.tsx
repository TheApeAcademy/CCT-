import { motion } from 'framer-motion'

/**
 * A big, tilted 3D iPad shell - CSS only, no image asset. Callers just
 * render their own screen content as children; this only draws the
 * body/bezel/camera-dot/home-indicator chrome around it (flat tablet
 * proportions, uniform bezel, a small front-camera dot instead of a phone
 * notch) and a small idle float + bounce-in entrance so it reads as fun,
 * not static.
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
          width: 380,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(4deg)',
        }}
        className="relative"
      >
        <div
          className="relative overflow-hidden rounded-[26px] border-[14px] shadow-2xl"
          style={{
            borderColor: '#e7e8eb',
            background: '#e7e8eb',
            boxShadow: `0 40px 70px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.06), inset 0 0 0 2px rgba(0,0,0,0.04)`,
          }}
        >
          <div className="relative overflow-hidden rounded-[12px]" style={{ height: 469, background: 'linear-gradient(160deg, #14141c 0%, #0a0a10 100%)' }}>
            <div className="absolute left-1/2 top-2.5 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-black/70" />
            <div className="relative z-10 flex h-full flex-col pt-8">{children}</div>
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
