import { Link } from 'react-router-dom'
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
  Lock,
  ArrowRight,
  Sparkle,
  type LucideIcon,
} from 'lucide-react'
import Reveal, { RevealStagger, RevealItem } from '../components/Reveal'
import ScrollProgressBar from '../components/ScrollProgressBar'
import ColorSprinkles from '../components/ColorSprinkles'
import FloatingArt from '../components/FloatingArt'
import { SHOWCASE_GROUPS, COMING_SOON, type ShowcaseFeature } from '../content/featureShowcase'
import { playClick } from '../lib/sound'
// The landing page's third display face, for the eyebrows and the big
// numbers in the stat strip - same as Home, loaded with this page's chunk.

// Only the icons the showcase content actually names. Anything unmatched
// falls back to Sparkle rather than crashing the page.
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

const TOTAL_FEATURES = SHOWCASE_GROUPS.reduce((sum, g) => sum + g.features.length, 0)

export default function Features() {
  return (
    <div className="lp-page full-bleed relative space-y-0">
      <ScrollProgressBar />

      {/* ---------- hero ---------- */}
      <div className="lp-band lp-blob-bg full-bleed isolate px-4 pb-14 pt-28 sm:pb-20 sm:pt-36">
        <ColorSprinkles />
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <FloatingArt className="mx-auto w-24 sm:w-32">
              <img src="/feature-rocket.png" alt="" className="w-full drop-shadow-lg" />
            </FloatingArt>
            <p className="lp-eyebrow mt-4 justify-center" style={{ ['--card-accent' as string]: 'var(--lp-accent-achievements)' }}>
              Everything Inside
            </p>
            <h1 className="lp-heading mt-3 text-balance font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              One app. Four doors.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              Children, teachers, ministry admins and parents each get their own way in, and each one sees only what
              belongs to them. Here is every single thing that is already built, and the few honest things that are not.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="lp-stat-strip mx-auto mt-9 max-w-xl grid-cols-3">
              <div className="lp-stat-cell">
                <p className="lp-stat-value">4</p>
                <p className="lp-stat-label">Portals</p>
              </div>
              <div className="lp-stat-cell">
                <p className="lp-stat-value">{TOTAL_FEATURES}</p>
                <p className="lp-stat-label">Features Built</p>
              </div>
              <div className="lp-stat-cell">
                <p className="lp-stat-value">0</p>
                <p className="lp-stat-label">Public Profiles</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------- one band per audience ---------- */}
      {SHOWCASE_GROUPS.map((group, i) => (
        <div
          key={group.key}
          className={`${i % 2 === 0 ? 'lp-band-alt' : 'lp-band'} full-bleed px-4 lp-rhythm`}
        >
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="lp-eyebrow" style={{ ['--card-accent' as string]: group.accent }}>
                {group.eyebrow}
              </p>
              <h2 className="lp-heading mt-3 text-balance font-display text-2xl font-extrabold leading-tight sm:text-4xl">
                {group.title}
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--lp-body)] sm:text-base">{group.intro}</p>
              {group.cta && (
                <Link
                  to={group.cta.to}
                  onClick={() => playClick()}
                  className="lp-btn-solid mt-6 inline-flex !px-6 !py-3 !text-[15px]"
                  style={{ ['--lp-accent-fill' as string]: group.accent, ['--lp-accent-fill-hover' as string]: group.accent }}
                >
                  {group.cta.label}
                </Link>
              )}
            </Reveal>

            <RevealStagger className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map((f) => (
                <FeatureCard key={f.title} feature={f} accent={group.accent} />
              ))}
            </RevealStagger>
          </div>
        </div>
      ))}

      {/* ---------- honest about what is not built yet ---------- */}
      <div className="lp-band-deep full-bleed px-4 lp-rhythm-compact">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="lp-eyebrow justify-center" style={{ ['--card-accent' as string]: 'var(--lp-accent-compete)' }}>
              Not Built Yet
            </p>
            <h2 className="lp-heading mt-2 font-display text-2xl font-extrabold sm:text-3xl">Still on the way</h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed" style={{ color: 'var(--lp-band-deep-body)' }}>
              These are real plans, not marketing. They are listed here so nothing above has to be vague.
            </p>
          </Reveal>
          <RevealStagger className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {COMING_SOON.map((c) => {
              const Icon = ICONS[c.icon] ?? Sparkle
              return (
                <RevealItem key={c.title} className="h-full">
                  <div className="flex h-full items-start gap-3 rounded-2xl border border-dashed border-white/25 bg-white/5 p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-display text-base font-bold text-white">{c.title}</p>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--lp-band-deep-body)' }}>
                        {c.description}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              )
            })}
          </RevealStagger>
        </div>
      </div>

      {/* ---------- final CTA: the four doors, together ---------- */}
      <div className="stage-glow full-bleed border-t border-[var(--hairline)] px-4 lp-rhythm text-center">
        <Reveal>
          <p className="eyebrow justify-center">Pick Your Door</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Which one are you?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-muted)] sm:text-base">
            Each portal is its own separate way in, with its own sign-in. There is no shared navigation between them,
            and that is deliberate.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DoorLink to="/join" icon={Sparkles} label="I'm a Child" sub="Sign up with a name and a passcode" />
            <DoorLink to="/teacher" icon={Users} label="I'm a Teacher" sub="Apply to teach a Sunday School class" />
            <DoorLink to="/parent" icon={HeartHandshake} label="I'm a Parent" sub="Follow your child's progress" />
            <DoorLink to="/admin" icon={ShieldCheck} label="I'm an Admin" sub="Oversee the whole ministry" />
          </div>
        </Reveal>
      </div>
    </div>
  )
}

function FeatureCard({ feature, accent }: { feature: ShowcaseFeature; accent: string }) {
  const Icon = ICONS[feature.icon] ?? Sparkle
  const body = (
    <>
      <span className="lp-icon-chip shrink-0">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="lp-heading font-display text-base font-bold">{feature.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--lp-muted)]">{feature.description}</p>
        {feature.to ? (
          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-extrabold" style={{ color: accent }}>
            Open it <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </span>
        ) : (
          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[var(--lp-faint)]">
            <Lock className="h-3 w-3" strokeWidth={2.25} /> {feature.where}
          </span>
        )}
      </div>
    </>
  )

  const className = 'lp-panel lp-panel-accented flex h-full items-start gap-3.5 p-5'
  const style = { ['--card-accent' as string]: accent }

  if (feature.to) {
    return (
      <RevealItem className="h-full">
        <Link to={feature.to} onClick={() => playClick()} className={`${className} lp-panel-interactive`} style={style}>
          {body}
        </Link>
      </RevealItem>
    )
  }
  return (
    <RevealItem className="h-full">
      <div className={className} style={style}>
        {body}
      </div>
    </RevealItem>
  )
}

function DoorLink({ to, icon: Icon, label, sub }: { to: string; icon: LucideIcon; label: string; sub: string }) {
  return (
    <Link
      to={to}
      onClick={() => playClick()}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--hairline-strong)] bg-white/5 p-5 text-center transition hover:scale-[1.03] hover:bg-white/10"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="font-display text-base font-extrabold text-white">{label}</p>
      <p className="text-xs leading-snug text-[var(--ink-muted)]">{sub}</p>
    </Link>
  )
}
