import {
  Map,
  BookOpen,
  Flame,
  Sparkles,
  Gamepad2,
  Trophy,
  Globe,
  MessageCircleHeart,
  Bot,
  PenLine,
  IdCard,
  CalendarDays,
  Music,
  Users,
  ClipboardCheck,
  Award,
  FileText,
  HeartHandshake,
  ShieldCheck,
  Smartphone,
  FileCheck,
  School,
  CalendarRange,
  BookMarked,
  Database,
  KeyRound,
  TrendingUp,
  Star,
  Grid3x3,
  Phone,
  Sparkle,
  type LucideIcon,
} from 'lucide-react'

/**
 * Only the icons the showcase content actually names. Lives here rather than
 * in one page because both the Everything Inside page and the landing page's
 * feature index draw from the same list, and a second copy of this map is a
 * second place for an icon name to go stale.
 */
const ICONS: Record<string, LucideIcon> = {
  Map,
  BookOpen,
  Flame,
  Sparkles,
  Gamepad2,
  Trophy,
  Globe,
  MessageCircleHeart,
  Bot,
  PenLine,
  IdCard,
  CalendarDays,
  Music,
  Users,
  ClipboardCheck,
  Award,
  FileText,
  HeartHandshake,
  ShieldCheck,
  Smartphone,
  FileCheck,
  School,
  CalendarRange,
  BookMarked,
  Database,
  KeyRound,
  TrendingUp,
  Star,
  Grid3x3,
  Phone,
}

/** Anything unmatched falls back to Sparkle rather than crashing the page. */
export function showcaseIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkle
}
