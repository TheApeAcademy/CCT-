import { Link } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Dumbbell,
  BookOpen,
  Trophy,
  Music,
  School,
  CalendarRange,
  Mail,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { db, ensureSeedData } from '../db/db'
import CountUp from '../components/CountUp'
import HeroCarousel, { type HeroSlide } from '../components/HeroCarousel'
import QuizFeatureIntro from '../components/QuizFeatureIntro'
import DashboardPreview from '../components/DashboardPreview'
import ThemeToggle from '../components/ThemeToggle'
import Reveal, { RevealStagger, RevealItem } from '../components/Reveal'
import { useLandingTheme } from '../lib/landingTheme'
import { playClick } from '../lib/sound'

const slides: HeroSlide[] = [
  {
    eyebrow: 'Mountain of Fire and Miracles Ministries · Wuye',
    title: "The Children's Ministry",
    body: 'Raising children in the Word through classes, a Bible Quiz built for the ministry, and a place every child in this church can call theirs.',
    primaryCta: { label: 'Apply as a Kid', to: '/join' },
    secondaryCta: { label: 'Apply to Teach', to: '/teacher' },
    quote: { text: 'But upon mount Zion shall be deliverance, and there shall be holiness', source: 'Obadiah 1:17' },
    image: '/hero-kids.jpg',
  },
  {
    eyebrow: 'A Children’s Ministry Feature',
    title: 'Know the Word. Play the Quiz.',
    body: 'Live trivia on the shared screen, team lifelines, seasons and a leaderboard that means something — every question is a chance to know Scripture a little better.',
    primaryCta: { label: 'Host a Match', to: '/setup' },
    secondaryCta: { label: 'Practice Mode', to: '/training' },
    image: '/hero-quiz.jpg',
  },
  {
    eyebrow: 'Every Child, Every Day',
    title: 'Nourish Your Soul. Read Daily.',
    body: 'A short Bible reading and a streak that keeps count — come back tomorrow and it grows, right there on your own dashboard.',
    primaryCta: { label: 'Apply as a Kid', to: '/join' },
    quote: { text: 'Thy word have I hid in mine heart, that I might not sin against thee', source: 'Psalm 119:11' },
    image: '/hero-bible.jpg',
  },
  {
    eyebrow: 'Meet the Team',
    title: 'Our Sunday School Teachers',
    body: 'Real classrooms, real teachers — approved by the ministry and ready to walk with your child through the Word, every single week.',
    primaryCta: { label: 'Apply to Teach', to: '/teacher' },
    secondaryCta: { label: 'Apply as a Kid', to: '/join' },
    image: '/hero-teachers.jpg',
  },
]

export default function Home() {
  const [stats, setStats] = useState({ questions: 0, sets: 0, games: 0, kids: 0 })
  const { theme, toggle } = useLandingTheme()

  useEffect(() => {
    ensureSeedData().then(async () => {
      const [questions, sets, games, kids] = await Promise.all([
        db.questions.count(),
        db.questionSets.count(),
        db.gameSessions.count(),
        db.players.count(),
      ])
      setStats({ questions, sets, games, kids })
    })
  }, [])

  return (
    <div data-landing-theme={theme} className="lp-page full-bleed relative space-y-0 pb-10">
      <div className="fixed bottom-5 right-4 z-30 sm:bottom-6 sm:right-6">
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>

      {/* ---------- hero ---------- */}
      <HeroCarousel slides={slides} />

      {/* ---------- stats ---------- */}
      <div className="mx-auto -mt-10 w-full max-w-6xl px-4">
        <div className="lp-stat-strip grid-cols-4">
          <StatCell label="Questions" value={stats.questions} />
          <StatCell label="Question Sets" value={stats.sets} />
          <StatCell label="Matches Played" value={stats.games} />
          <StatCell label="Kids" value={stats.kids} />
        </div>
      </div>

      {/* ---------- flagship feature: the quiz, demonstrated ---------- */}
      <div className="lp-band full-bleed mt-16 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <Reveal direction="left">
              <p className="lp-eyebrow">The Bible Quiz</p>
              <h2 className="lp-heading mt-3 text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
                See it before you play it.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
                A live question appears, an answer gets picked, the reveal lands, the score moves. That&apos;s the whole
                match &mdash; on a shared screen, in teams, with lifelines &mdash; run entirely from the Question Bank a
                teacher builds.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/setup" onClick={() => playClick()} className="btn-solid !px-6 !py-3 !text-[15px]">
                  Host a Match
                </Link>
                <Link
                  to="/training"
                  onClick={() => playClick()}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--lp-heading)] transition hover:text-[var(--lp-accent-compete)]"
                >
                  Try Practice Mode <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <QuizFeatureIntro />
            </Reveal>
          </div>
        </div>
      </div>

      {/* ---------- what we do ---------- */}
      <div className="lp-band-alt full-bleed px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow">A Children&apos;s Ministry Feature</p>
            <h2 className="lp-heading mt-1 font-display text-2xl font-extrabold sm:text-3xl">What Else You Can Do</h2>
          </Reveal>
          <RevealStagger className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SectionCard
              to="/training"
              icon={Dumbbell}
              accent="var(--lp-accent-training)"
              title="Training Mode"
              description="Unlimited solo practice. No teams, no timer, no pressure."
            />
            <SectionCard
              to="/transition"
              icon={School}
              accent="var(--lp-accent-transition)"
              title="Transition Class"
              description="Lectures, Bible citations, checkpoint quizzes, and mock exams."
            />
            <SectionCard
              to="/seasons"
              icon={CalendarRange}
              accent="var(--lp-accent-seasons)"
              title="Seasons"
              description="Every competition season, past and present, in one place."
            />
          </RevealStagger>

          <Reveal delay={0.05}>
            <p className="lp-eyebrow mt-10">For Teachers &amp; Kids</p>
            <h2 className="lp-heading mt-1 font-display text-2xl font-extrabold sm:text-3xl">Resources</h2>
          </Reveal>
          <RevealStagger className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SectionCard
              to="/questions"
              icon={BookOpen}
              accent="var(--lp-accent-questions)"
              title="Question Bank"
              description="Add, edit, import, and export trivia questions and sets."
            />
            <SectionCard
              to="/history"
              icon={Trophy}
              accent="var(--lp-accent-history)"
              title="History"
              description="Every completed match, team score, and full recap."
            />
            <SectionCard
              to="/anthem"
              icon={Music}
              accent="var(--lp-accent-anthem)"
              title="Anthem"
              description="Our children's ministry anthem, with lyrics and a read-aloud."
            />
          </RevealStagger>
        </div>
      </div>

      {/* ---------- once you join: the kids dashboard ---------- */}
      <div className="lp-band-deep full-bleed px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="lp-eyebrow justify-center">Once You Join a Class</p>
            <h2 className="lp-heading mt-2 text-balance font-display text-3xl font-extrabold sm:text-5xl">
              A dashboard that&apos;s actually theirs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--lp-band-deep-body)' }}>
              Every kid who joins a class gets their own home base &mdash; here&apos;s what&apos;s waiting inside.
            </p>
          </Reveal>
          <RevealStagger className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardPreview />
          </RevealStagger>
          <Reveal delay={0.1} className="mt-9 text-center">
            <Link to="/join" onClick={() => playClick()} className="btn-solid !px-7 !py-3.5 !text-base">
              Apply as a Kid
            </Link>
          </Reveal>
        </div>
      </div>

      {/* ---------- how it works ---------- */}
      <div className="lp-band full-bleed px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow">How It Works</p>
            <h2 className="lp-heading mt-1 font-display text-2xl font-extrabold sm:text-3xl">From Sign-Up to Sunday</h2>
          </Reveal>
          <RevealStagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'Teachers apply for an account; the admin approves them from the Control Centre.',
              'A teacher creates a class and shares its join code or link with their kids.',
              'Kids sign up with just their name and a passcode — no email needed.',
              'From their dashboard, kids play the Bible Quiz, climb the leaderboard, and message their teacher.',
            ].map((text, i) => (
              <RevealItem key={i}>
                <div className="lp-panel flex h-full gap-3 p-5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--lp-hairline-strong)] font-display text-xs font-bold text-[var(--lp-accent-text)]">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--lp-body)]">{text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>

      {/* ---------- MFM worldwide ---------- */}
      <div id="about" className="lp-band-alt full-bleed scroll-mt-20 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow">About the Ministry</p>
            <h2 className="lp-heading mt-3 max-w-2xl text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Mountain of Fire and Miracles Ministries
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              A full-gospel ministry devoted to revival, holiness, prayer, and deliverance, founded and led by
              Dr.&nbsp;Daniel Kolawole Olukoya as General Overseer. From its beginnings, MFM has grown into a worldwide
              ministry with branches across nations, all carrying the same call to prayer and holy living.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ---------- MFM Wuye branch ---------- */}
      <InstitutionalBand id="wuye" eyebrow="Our Branch" title="MFM Wuye" image="/mfm-wuye-building.jpg" imageAlt="MFM Wuye branch building">
        <p className="text-[15px] leading-relaxed text-[var(--lp-body)] sm:text-base">
          MFM Wuye is a branch of Mountain of Fire and Miracles Ministries, carrying the same call to prayer,
          holiness, and deliverance to its community. Full branch details, service times, and photos are being
          finalized with the ministry and will appear here soon.
        </p>
      </InstitutionalBand>

      {/* ---------- SRO ---------- */}
      <InstitutionalBand
        id="leadership"
        eyebrow="Leadership"
        title="Pastor Edwin Etomi"
        deep
        imageFirst
        image="/pastor-edwin-etomi.jpg"
        imageAlt="Pastor Edwin Etomi"
      >
        <p className="lp-eyebrow !mt-0">Senior Regional Overseer, MFM International Headquarters Annex, Wuye</p>
      </InstitutionalBand>

      {/* ---------- Children's Ministry ---------- */}
      <InstitutionalBand
        id="ministry"
        eyebrow="This Platform"
        title="The Children's Ministry"
        alt
        image="/children-pastor.jpg"
        imageAlt="Head of the Children's Department"
      >
        <p className="lp-eyebrow !mt-0">Head of Children&apos;s Department &mdash; Olusanu Olukunle</p>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--lp-body)] sm:text-base">
          This platform exists to serve the Children&apos;s Ministry directly &mdash; giving teachers real
          classrooms to run and children a place of their own to learn, play, and grow in the Word.
        </p>
      </InstitutionalBand>

      {/* ---------- contact us ---------- */}
      <div id="contact" className="lp-band full-bleed scroll-mt-20 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow">Contact Us</p>
            <h2 className="lp-heading mt-2 font-display text-2xl font-extrabold sm:text-4xl">Get In Touch</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--lp-body)] sm:text-base">
              A direct line to MFM Wuye Children&apos;s Ministry &mdash; a branch phone number, email, and service
              times &mdash; is being finalized with the ministry and will appear here soon.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-hairline-strong)] text-[var(--lp-accent-text)]">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-semibold text-[var(--lp-muted)]">Details coming soon &mdash; check back shortly.</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------- final CTA: apply as a kid or teacher, only here ---------- */}
      <div className="stage-glow full-bleed border-t border-[var(--hairline)] px-4 py-16 text-center sm:py-20">
        <Reveal>
          <p className="eyebrow justify-center">Get Started</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Ready to join?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-muted)] sm:text-base">
            Kids join a class in under a minute. Teachers apply and the admin reviews it from the Control Centre.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/join" onClick={() => playClick()} className="btn-solid !px-7 !py-3.5 !text-base">
              Apply as a Kid
            </Link>
            <Link to="/teacher" onClick={() => playClick()} className="btn-outline !px-7 !py-3.5 !text-base">
              Apply to Teach
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="text-center">
        <Link to="/admin" className="text-xs text-[var(--lp-faint)] transition hover:text-[var(--lp-muted)]">
          Admin sign in
        </Link>
      </div>
    </div>
  )
}

function InstitutionalBand({
  id,
  eyebrow,
  title,
  children,
  alt,
  deep,
  imageFirst,
  image,
  imageAlt,
}: {
  id?: string
  eyebrow: string
  title: string
  children: ReactNode
  alt?: boolean
  deep?: boolean
  imageFirst?: boolean
  image?: string
  imageAlt?: string
}) {
  return (
    <div
      id={id}
      className={`full-bleed scroll-mt-20 px-4 py-16 sm:py-20 ${deep ? 'lp-band-deep' : alt ? 'lp-band-alt' : 'lp-band'}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className={`grid items-center gap-8 sm:grid-cols-[1fr_1.2fr] sm:gap-12 ${imageFirst ? '' : 'sm:[&>*:first-child]:order-2'}`}>
          <Reveal direction={imageFirst ? 'left' : 'right'}>
            {image ? (
              <img src={image} alt={imageAlt ?? ''} className="aspect-[4/3] w-full rounded-2xl border border-[var(--lp-hairline-strong)] object-cover shadow-[var(--lp-shadow-card)]" />
            ) : (
              <div className="crest-badge aspect-[4/3] w-full" />
            )}
          </Reveal>
          <Reveal direction={imageFirst ? 'right' : 'left'} delay={0.08}>
            <p className="lp-eyebrow">{eyebrow}</p>
            <h2 className="lp-heading mt-2 font-display text-2xl font-extrabold sm:text-4xl">{title}</h2>
            <div className="mt-4 space-y-3">{children}</div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="lp-stat-cell">
      <div className="lp-stat-value">
        <CountUp value={value} durationMs={900} />
      </div>
      <div className="lp-stat-label">{label}</div>
    </div>
  )
}

function SectionCard({
  to,
  icon: Icon,
  accent,
  title,
  description,
}: {
  to: string
  icon: LucideIcon
  accent: string
  title: string
  description: string
}) {
  return (
    <RevealItem>
      <Link
        to={to}
        onClick={() => playClick()}
        className="lp-panel lp-panel-interactive flex h-full items-start gap-4 p-5"
        style={{ ['--card-accent' as string]: accent }}
      >
        <span className="lp-icon-chip">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="lp-heading font-display text-lg font-bold">{title}</p>
          <p className="mt-1 text-sm text-[var(--lp-muted)]">{description}</p>
        </div>
      </Link>
    </RevealItem>
  )
}
