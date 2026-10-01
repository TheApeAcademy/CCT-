import {
  Swords,
  Trophy,
  Star,
  BookOpen,
  Flame,
  Award,
  Map,
  Compass,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/**
 * Maps an achievement row's `icon` name (set in Supabase, see the
 * achievements catalog) to the component that draws it. Shared so the
 * child's own badge list and their parent's report never disagree about
 * what a badge looks like.
 */
export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  swords: Swords,
  trophy: Trophy,
  star: Star,
  'book-open': BookOpen,
  flame: Flame,
  award: Award,
  map: Map,
  compass: Compass,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
}

/** Every icon name above resolves; anything unknown falls back to a generic badge. */
export function achievementIcon(name: string): LucideIcon {
  return ACHIEVEMENT_ICONS[name] ?? Award
}
