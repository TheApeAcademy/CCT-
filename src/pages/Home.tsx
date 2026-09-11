import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
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
import HeroCarousel, { type HeroSlide } from '../components/HeroCarousel'
import QuizFeatureIntro from '../components/QuizFeatureIntro'
import BibleFeatureIntro from '../components/BibleFeatureIntro'
import ClassFeatureIntro from '../components/ClassFeatureIntro'
import LeaderboardFeatureIntro from '../components/LeaderboardFeatureIntro'
import AchievementsFeatureIntro from '../components/AchievementsFeatureIntro'
import EarsForYouFeatureIntro from '../components/EarsForYouFeatureIntro'
import FloatingArt from '../components/FloatingArt'
import ScrollProgressBar from '../components/ScrollProgressBar'
import ColorSprinkles from '../components/ColorSprinkles'
import Reveal, { RevealStagger, RevealItem } from '../components/Reveal'
import { playClick } from '../lib/sound'
// A third, deliberately bouncier display face (distinct from the hero's
// clean Poppins and the body's Nunito) for tags/badges/numbers - part of
// the landing page's own lazy chunk, never loaded by the offline quiz.
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/700.css'

const slides: HeroSlide[] = [
  {
    title: "The Children's Ministry",
    body: 'Raising children in the Word through classes, a Bible Quiz built for the ministry, and a place every child in this church can call theirs.',
    primaryCta: { label: 'Apply as a Kid', to: '/join' },
    secondaryCta: { label: 'Apply to Teach', to: '/teacher' },
    quote: { text: 'But upon mount Zion shall be deliverance, and there shall be holiness', source: 'Obadiah 1:17' },
    image: '/hero-kids.jpg',
  },
  {
    title: 'Know the Word. Play the Quiz.',
    body: 'Live trivia on the shared screen, team lifelines, seasons and a leaderboard that means something — every question is a chance to know Scripture a little better.',
    primaryCta: { label: 'Host a Match', to: '/setup' },
    secondaryCta: { label: 'Practice Mode', to: '/training' },
    image: '/hero-quiz.jpg',
  },
  {
    title: 'Nourish Your Soul. Read Daily.',
    body: 'A short Bible reading and a streak that keeps count — come back tomorrow and it grows, right there on your own dashboard.',
    primaryCta: { label: 'Apply as a Kid', to: '/join' },
    quote: { text: 'Thy word have I hid in mine heart, that I might not sin against thee', source: 'Psalm 119:11' },
    image: '/hero-bible.jpg',
  },
  {
    title: 'Our Sunday School Teachers',
    body: 'Real classrooms, real teachers — approved by the ministry and ready to walk with your child through the Word, every single week.',
    primaryCta: { label: 'Apply to Teach', to: '/teacher' },
    secondaryCta: { label: 'Apply as a Kid', to: '/join' },
    image: '/hero-teachers.jpg',
  },
]

export default function Home() {
  return (
    <div className="lp-page full-bleed relative space-y-0 pb-10">
      <ScrollProgressBar />
      {/* ---------- hero ---------- */}
      <HeroCarousel slides={slides} />

      {/* ---------- flagship feature: the quiz, demonstrated ---------- */}
      <div className="lp-band lp-blob-bg full-bleed isolate px-4 py-16 sm:py-24">
        <ColorSprinkles />
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <Reveal direction="left">
              <FloatingArt className="w-28 sm:w-36">
                <img src="/feature-quiz.png" alt="" className="w-full drop-shadow-lg" />
              </FloatingArt>
              <p className="lp-eyebrow mt-3" style={{ ['--card-accent' as string]: 'var(--lp-accent-compete)' }}>
                The Bible Quiz
              </p>
              <h2 className="lp-heading mt-3 text-balance font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
                See it before you play it.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
                A live question appears, an answer gets picked, the reveal lands, the score moves. That&apos;s the whole
                match &mdash; on a shared screen, in teams, with lifelines &mdash; run entirely from the Question Bank a
                teacher builds.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/setup" onClick={() => playClick()} className="lp-btn-solid !px-6 !py-3 !text-[15px]">
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
      <div className="lp-band-alt lp-blob-bg full-bleed px-4 py-16 sm:py-20" style={{ ['--lp-blob-accent-2' as string]: 'var(--lp-accent-seasons)' }}>
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-training)' }}>
              A Children&apos;s Ministry Feature
            </p>
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
            <p className="lp-eyebrow mt-10" style={{ ['--card-accent' as string]: 'var(--lp-accent-questions)' }}>
              For Teachers &amp; Kids
            </p>
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

      {/* ---------- bridge: sets up the dashboard-only features below ---------- */}
      <div className="lp-band-deep full-bleed px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="lp-eyebrow justify-center" style={{ ['--card-accent' as string]: 'var(--lp-accent-leaderboard)' }}>
              Once You Join a Class
            </p>
            <h2 className="lp-heading mt-2 text-balance font-display text-3xl font-extrabold sm:text-5xl">
              A dashboard that&apos;s actually theirs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--lp-band-deep-body)' }}>
              Every kid who joins a class gets their own home base. Here&apos;s a look at what&apos;s waiting inside.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ---------- bible: calm, meaningful contrast to the quiz ---------- */}
      <BibleFeatureIntro />

      {/* ---------- class: belonging, learning, community ---------- */}
      <ClassFeatureIntro />

      {/* ---------- leaderboard: celebratory, high energy ---------- */}
      <LeaderboardFeatureIntro />

      {/* ---------- achievements: collectible ---------- */}
      <AchievementsFeatureIntro />

      {/* ---------- ears for you: deliberately the quietest section ---------- */}
      <EarsForYouFeatureIntro />

      {/* ---------- about: ministry, branch, and leadership in one continuous view ---------- */}
      <div id="about" className="lp-band-alt full-bleed scroll-mt-20 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal className="relative flex flex-col-reverse items-center gap-2 sm:flex-row sm:items-end sm:justify-start">
            <div className="relative z-10 max-w-xl shrink-0">
              <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-anthem)' }}>
                About the Ministry
              </p>
              <h2 className="lp-heading mt-3 text-balance font-display text-2xl font-extrabold leading-[1.05] sm:text-4xl">
                Mountain of Fire and Miracles Ministries
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--lp-body)] sm:text-base">
                A full-gospel ministry devoted to revival, holiness, prayer, and deliverance, founded and led by
                Dr.&nbsp;Daniel Kolawole Olukoya as General Overseer &mdash; grown into a worldwide ministry with
                branches across nations, all carrying the same call to prayer and holy living.
              </p>
            </div>
            <FloatingArt className="relative z-0 mx-auto w-32 shrink-0 opacity-90 sm:mx-0 sm:w-48 lg:w-64">
              <img src="/mfm-logo.png" alt="Mountain of Fire and Miracles Ministries" className="w-full drop-shadow-2xl" />
            </FloatingArt>
          </Reveal>

          <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-3">
            <RevealItem>
              <ProfileCard
                id="wuye"
                image="/mfm-wuye-building.jpg"
                imageAlt="MFM Wuye branch building"
                eyebrow="Our Branch"
                eyebrowAccent="var(--lp-accent-seasons)"
                title="MFM Wuye"
              >
                Carrying the same call to prayer, holiness, and deliverance to its community.
              </ProfileCard>
            </RevealItem>
            <RevealItem>
              <ProfileCard
                id="leadership"
                image="/pastor-edwin-etomi.jpg"
                imageAlt="Pastor Edwin Etomi"
                eyebrow="Leadership"
                eyebrowAccent="var(--lp-accent-leaderboard)"
                title="Pastor Edwin Etomi"
              >
                Senior Regional Overseer, MFM International Headquarters Annex, Wuye.
              </ProfileCard>
            </RevealItem>
            <RevealItem>
              <ProfileCard
                id="ministry"
                image="/children-pastor.jpg"
                imageAlt="Head of the Children's Department"
                eyebrow="This Platform"
                eyebrowAccent="var(--lp-accent-history)"
                title="The Children's Ministry"
              >
                Head of Children&apos;s Department &mdash; Olusanu Olukunle. This platform exists to serve the
                ministry directly.
              </ProfileCard>
            </RevealItem>
          </RevealStagger>
        </div>
      </div>

      {/* ---------- contact us ---------- */}
      <div id="contact" className="lp-band full-bleed scroll-mt-20 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-ears)' }}>
              Contact Us
            </p>
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

      {/* ---------- final CTA: brings the whole ecosystem together ---------- */}
      <div className="stage-glow full-bleed border-t border-[var(--hairline)] px-4 py-16 text-center sm:py-20">
        <Reveal>
          <FloatingArt className="mx-auto w-36 sm:w-44">
            <img src="/feature-rocket.png" alt="" className="w-full drop-shadow-2xl" />
          </FloatingArt>
          <p className="eyebrow mt-2 justify-center">You&apos;ve Seen the World</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Now step inside.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-muted)] sm:text-base">
            The Quiz, the Bible streak, the leaderboard, achievements, a teacher who listens &mdash; kids join a
            class in under a minute, and teachers apply straight to the Control Centre.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/join" onClick={() => playClick()} className="hero-btn-solid !px-7 !py-3.5 !text-base uppercase">
              Enter the Children&apos;s Platform
            </Link>
            <Link to="/teacher" onClick={() => playClick()} className="hero-btn-outline !px-7 !py-3.5 !text-base uppercase">
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

/** A compact card, not a full-bleed band - three of these sit side by side
 * so "MFM worldwide, the Wuye branch, and its leadership" reads as one
 * continuous view instead of three stacked full-height sections. */
function ProfileCard({
  id,
  eyebrow,
  eyebrowAccent = 'var(--lp-accent-text)',
  title,
  children,
  image,
  imageAlt,
}: {
  id?: string
  eyebrow: string
  eyebrowAccent?: string
  title: string
  children: ReactNode
  image?: string
  imageAlt?: string
}) {
  return (
    <div id={id} className="lp-panel lp-panel-accented scroll-mt-20 overflow-hidden" style={{ ['--card-accent' as string]: eyebrowAccent }}>
      {image ? (
        <img
          src={image}
          alt={imageAlt ?? ''}
          className="lp-card-photo-bleed relative z-0 -mb-9 h-40 w-full object-cover object-top sm:h-44"
        />
      ) : (
        <div className="crest-badge -mb-9 h-40 w-full sm:h-44" />
      )}
      <div className="relative z-10 p-4 pt-9">
        <p className="lp-eyebrow !mt-0" style={{ ['--card-accent' as string]: eyebrowAccent }}>
          {eyebrow}
        </p>
        <h3 className="lp-heading mt-2 font-display text-lg font-extrabold">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--lp-body)]">{children}</p>
      </div>
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
        className="lp-panel lp-panel-interactive lp-panel-accented flex h-full items-start gap-4 p-5"
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
