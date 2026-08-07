// Thin wrapper over the Vibration API — no-ops silently on unsupported
// devices (iOS Safari, desktop), so it's always safe to call.

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // ignore
  }
}

export const haptics = {
  tap: () => vibrate(10),
  select: () => vibrate(15),
  success: () => vibrate([20, 40, 20]),
  error: () => vibrate([40, 30, 40, 30, 60]),
  win: () => vibrate([30, 50, 30, 50, 30, 50, 100]),
}
