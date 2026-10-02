// The night/day sky the kids' full-page apps share (Bible Journey, Bible
// Arcade). The prototypes keep one theme for all of them, so flipping it in
// one carries over to the next.
const KEY = 'mfm-kids-sky'

export type KidsSky = 'night' | 'day'

export function loadKidsSky(): KidsSky {
  try {
    return localStorage.getItem(KEY) === 'day' ? 'day' : 'night'
  } catch {
    return 'night'
  }
}

export function saveKidsSky(sky: KidsSky) {
  try {
    localStorage.setItem(KEY, sky)
  } catch {
    /* the toggle still works for this visit */
  }
}
