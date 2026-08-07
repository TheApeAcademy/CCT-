export interface KidProfile {
  name: string
  className: string
}

const KEY = 'cct-kid-profile'

export function getKidProfile(): KidProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<KidProfile>
    if (!parsed.name?.trim()) return null
    return { name: parsed.name, className: parsed.className ?? '' }
  } catch {
    return null
  }
}

export function saveKidProfile(profile: KidProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearKidProfile(): void {
  localStorage.removeItem(KEY)
}
