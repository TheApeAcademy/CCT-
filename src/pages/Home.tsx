import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
import { Mail, ArrowRight } from 'lucide-react'
import HeroCarousel, { type HeroSlide } from '../components/HeroCarousel'
import { SignInCluster, SignInLower } from '../components/KidsSignIn'
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
import { SHOWCASE_GROUPS, type ShowcaseFeature } from '../content/featureShowcase'
import { showcaseIcon } from '../content/showcaseIcons'
import { playClick } from '../lib/sound'
// A third, deliberately bouncier display face (distinct from the hero's
// clean Poppins and the body's Nunito) for tags/badges/numbers - part of
// the landing page's own lazy chunk, never loaded by the offline quiz.

const slides: HeroSlide[] = [
  {
    title: "MFM Children's Ministry",
    body: 'Raising children in the Word through classes, a Bible Quiz built for the ministry, and a place every child in this church can call theirs.',
    primaryCta: { label: 'Apply as a Child', to: '/join' },
    secondaryCta: { label: 'Apply to Teach', to: '/teacher' },
    quote: { text: 'But upon mount Zion shall be deliverance, and there shall be holiness', source: 'Obadiah 1:17' },
    image: '/hero-kids.jpg',
  },
  {
    title: 'Know the Word. Play the Quiz.',
    body: 'Live trivia on the shared screen, team lifelines, seasons and a leaderboard that means something. Every question is a chance to know Scripture a little better.',
    primaryCta: { label: 'Host a Match', to: '/setup' },
    secondaryCta: { label: 'Practice Mode', to: '/training' },
    image: '/hero-quiz.jpg',
  },
  {
    title: 'Nourish Your Soul. Read Daily.',
    body: 'A short Bible reading and a streak that keeps count. Come back tomorrow and it grows, right there on your own dashboard.',
    primaryCta: { label: 'Apply as a Child', to: '/join' },
    quote: { text: 'Thy word have I hid in mine heart, that I might not sin against thee', source: 'Psalm 119:11' },
    image: '/hero-bible.jpg',
  },
  {
    title: 'Our Sunday School Teachers',
    body: 'Real classrooms, real teachers, approved by the ministry and ready to walk with your child through the Word, every single week.',
    primaryCta: { label: 'Apply to Teach', to: '/teacher' },
    secondaryCta: { label: 'Apply as a Child', to: '/join' },
    image: '/hero-teachers.jpg',
  },
]

const TOTAL_FEATURES = SHOWCASE_GROUPS.reduce((sum, group) => sum + group.features.length, 0)

/**
 * One feature, one line. No card, no description: at this density the list
 * itself is the argument, and the Everything Inside page is one click away
 * for anyone who wants the detail. Only features a signed-out visitor can
 * actually open carry a link - the rest say nothing rather than bounce
 * someone into a sign-in wall.
 */
function FeatureLine({ feature, accent }: { feature: ShowcaseFeature; accent: string }) {
  const Icon = showcaseIcon(feature.icon)
  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} strokeWidth={1.75} />
      <span className="min-w-0">{feature.title}</span>
    </>
  )
  const base = 'flex items-center gap-2.5 rounded-lg py-1.5 text-sm font-semibold text-[var(--lp-heading)]'
  return (
    <li>
      {feature.to ? (
        <Link to={feature.to} onClick={() => playClick()} className={`${base} transition hover:opacity-70`}>
          {inner}
        </Link>
      ) : (
        <span className={base}>{inner}</span>
      )}
    </li>
  )
}

export default function Home() {
  return (
    <div className="lp-page full-bleed relative space-y-0 pb-10">
      <ScrollProgressBar />
      {/* ---------- hero ---------- */}
      <HeroCarousel slides={slides} />

      {/* ---------- flagship feature: the quiz, demonstrated ---------- */}
      <div className="lp-band lp-blob-bg full-bleed isolate px-4 lp-rhythm">
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
                match, on a shared screen, in teams, with lifelines, run entirely from the Question Bank a
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

      {/* ---------- everything inside: the whole app, on one screen ----------
           This used to be five hand-written cards, which named five of the
           thirty-two things the app actually does. It is now drawn from
           SHOWCASE_GROUPS, the same list the Everything Inside page uses, so
           a feature cannot exist in the app and be missing from here. Dense
           on purpose: the point of the section is the length of the list. */}
      <div className="lp-band-alt full-bleed px-4 lp-rhythm">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-training)' }}>
              Everything Inside
            </p>
            <h2 className="lp-heading mt-1 font-display text-2xl font-extrabold sm:text-3xl">
              {TOTAL_FEATURES} things this already does
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--lp-body)]">
              Not a roadmap. Every one of these is built and running today, across the four places people
              sign in.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE_GROUPS.map((group) => (
              <div key={group.key}>
                <p className="lp-eyebrow" style={{ ['--card-accent' as string]: group.accent }}>
                  {group.eyebrow}
                </p>
                <ul className="mt-3 space-y-px">
                  {group.features.map((feature) => (
                    <FeatureLine key={feature.title} feature={feature} accent={group.accent} />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Reveal>
            <Link to="/features" onClick={() => playClick()} className="lp-btn-outline mt-9 inline-flex">
              See what each one does <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>


      {/* ---------- bridge: sets up the dashboard-only features below ---------- */}
      <div className="lp-band-deep full-bleed px-4 lp-rhythm-compact">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="lp-eyebrow justify-center" style={{ ['--card-accent' as string]: 'var(--lp-accent-leaderboard)' }}>
              From the Moment You Sign Up
            </p>
            <h2 className="lp-heading mt-2 text-balance font-display text-3xl font-extrabold sm:text-5xl">
              A dashboard that&apos;s actually theirs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--lp-band-deep-body)' }}>
              Every child gets their own home base the moment they sign up, no class code needed. Here&apos;s a
              look at what&apos;s waiting inside.
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
      <div id="about" className="lp-band-alt full-bleed scroll-mt-20 px-4 lp-rhythm-compact">
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
                Dr.&nbsp;Daniel Kolawole Olukoya as General Overseer, grown into a worldwide ministry with
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
                Head of Children&apos;s Department: Olusanu Olukunle. This platform exists to serve the
                ministry directly.
              </ProfileCard>
            </RevealItem>
          </RevealStagger>
        </div>
      </div>

      {/* ---------- contact us ---------- */}
      <div id="contact" className="lp-band full-bleed scroll-mt-20 px-4 lp-rhythm">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-ears)' }}>
              Contact Us
            </p>
            <h2 className="lp-heading mt-2 font-display text-2xl font-extrabold sm:text-4xl">Get In Touch</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--lp-body)] sm:text-base">
              A branch phone number, email, and service times for MFM Wuye Children&apos;s Ministry are being
              finalised with the ministry and will appear here soon.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-hairline-strong)] text-[var(--lp-accent-text)]">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-semibold text-[var(--lp-muted)]">Details coming soon. Check back shortly.</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------- sign in: the kids sign in page, whole, at the foot of the
           landing page ----------
           The same cluster, wordmark, doors and copy a child meets at
           /join, so the public site and the app open on one identical
           screen. Rendered inline rather than as the fixed full screen
           layer that page uses, which is all .ic-inline changes; the
           palette follows the site's own light and dark toggle. */}
      <div className="ic-screen ic-inline full-bleed">
        <SignInCluster />
        <SignInLower />
      </div>

      {/* ---------- final CTA: the two doors a child does not use ----------
           The sign in block above is the children's way in, so this band
           no longer repeats it: what is left here is the teacher's door,
           the parent's door, and the feature tour. */}
      <div className="stage-glow full-bleed border-t border-[var(--hairline)] px-4 lp-rhythm text-center">
        <Reveal>
          <FloatingArt className="mx-auto w-36 sm:w-44">
            <img src="/feature-rocket.png" alt="" className="w-full drop-shadow-2xl" />
          </FloatingArt>
          <p className="eyebrow mt-2 justify-center">You&apos;ve Seen the World</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Now step inside.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ink-muted)] sm:text-base">
            The Quiz, the Bible streak, the leaderboard, achievements, a teacher who listens. Children join a class in
            under a minute, and teachers apply straight to the Control Centre.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/join" onClick={() => playClick()} className="hero-btn-solid !px-7 !py-3.5 !text-base uppercase">
              Enter the Children&apos;s Platform
            </Link>
            <Link to="/teacher" onClick={() => playClick()} className="hero-btn-outline !px-7 !py-3.5 !text-base uppercase">
              Apply to Teach
            </Link>
            <Link to="/parent" onClick={() => playClick()} className="hero-btn-outline !px-7 !py-3.5 !text-base uppercase">
              Parent Dashboard
            </Link>
          </div>
          <Link
            to="/features"
            onClick={() => playClick()}
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-white/80 underline decoration-[var(--gold)] decoration-2 underline-offset-4 transition hover:text-white"
          >
            See everything inside, feature by feature <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </Reveal>
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

