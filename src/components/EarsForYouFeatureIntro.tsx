import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import FeatureBand from './FeatureBand'
import { playClick } from '../lib/sound'
// Same clean grotesk as the hero, reused here (not Baloo 2) to mark this
// as one of the page's calmer, more meaningful sections - see .lp-heading-calm.
import '@fontsource/poppins/700.css'

/**
 * Deliberately the calmest section on the page - trust over excitement.
 * Centred, small, and quiet next to its louder neighbours: no card stack,
 * no counters, just one small image and a reassuring line.
 */
export default function EarsForYouFeatureIntro() {
  return (
    <FeatureBand
      photo="/hero-teachers.jpg"
      alt="A Sunday school teacher sitting and listening to a child"
      side="left"
      accent="var(--lp-accent-ears)"
    >
      <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-ears)' }}>
        Ears For You
      </p>
      <h2 className="lp-heading lp-heading-calm mt-3 text-balance text-2xl leading-[1.1] sm:text-4xl">
        You can talk to us.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
        A safe, private line to your class teacher, for whenever something&apos;s on your mind. No pressure,
        no judgement, just a place to be heard.
      </p>
      {/* Still the quietest section on the page: no counter, no cards, no
          demo. The photograph does the reassuring, and the only control is
          an outlined one. */}
      <div className="mt-6">
        <Link
          to="/join"
          onClick={() => playClick()}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold transition"
          style={{ borderColor: 'var(--lp-hairline-strong)', color: 'var(--lp-heading)' }}
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          Talk to Us
        </Link>
      </div>
    </FeatureBand>
  )
}
