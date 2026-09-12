// Flat, restrained backdrop for the site chrome: one solid ink color and a
// faint watermark crest. No moving gradient blobs, no glassmorphism - the
// quiz screens get their own theatrical touches (drumroll, flash, ladder)
// without needing the whole app to glow.

export default function StageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--ink)]">
      <img
        src="/children-ministry-logo-splash.png"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 w-[42vmin] max-w-[440px] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.025]"
        style={{ filter: 'grayscale(1) invert(1)' }}
      />
    </div>
  )
}
