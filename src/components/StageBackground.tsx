// Theatrical animated backdrop: two slow-sweeping stage "spotlights" plus a
// faint centered watermark of the ministry logo. Pure CSS, no assets beyond
// the logo image, cheap to run so it can stay mounted behind every screen.

export default function StageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <img
        src="/church-logo.svg"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 w-[52vmin] max-w-[600px] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.03]"
        style={{ filter: 'grayscale(1) invert(1) blur(1.5px)' }}
      />
      <div
        className="animate-spotlight-1 absolute -left-1/4 -top-1/4 h-[70vmax] w-[70vmax] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.25) 0%, transparent 65%)' }}
      />
      <div
        className="animate-spotlight-2 absolute -right-1/4 top-1/3 h-[60vmax] w-[60vmax] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 65%)' }}
      />
    </div>
  )
}
