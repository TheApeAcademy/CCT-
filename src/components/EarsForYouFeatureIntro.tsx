import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import Reveal from './Reveal'
import { playClick } from '../lib/sound'
// Same clean grotesk as the hero, reused here (not Baloo 2) to mark this
// as one of the page's calmer, more meaningful sections - see .lp-heading-calm.
import '@fontsource/poppins/700.css'

/**
 * Deliberately the calmest section on the page - trust over excitement.
 * No floating/looping motion, no counters, no colourful blob background -
 * just a single fade-in (the one thing every section already gets) and a
 * quiet reassuring tone, on purpose, contrasting the energy around it.
 */
export default function EarsForYouFeatureIntro() {
  return (
    <div className="lp-band-tinted-soft full-bleed px-4 py-16 sm:py-20" style={{ ['--card-accent' as string]: 'var(--lp-accent-ears)' }}>
      <div className="mx-auto max-w-6xl">
        <Reveal className="grid items-center gap-10 sm:grid-cols-[0.8fr_1.2fr] sm:gap-14">
          <img src="/feature-ears.png" alt="" className="mx-auto w-40 rounded-3xl sm:w-full sm:max-w-xs" />
          <div>
            <p className="lp-eyebrow" style={{ ['--card-accent' as string]: 'var(--lp-accent-ears)' }}>
              Ears For You
            </p>
            <h2 className="lp-heading lp-heading-calm mt-3 text-balance text-2xl leading-[1.1] sm:text-4xl">
              You can talk to us.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--lp-body)] sm:text-lg">
              A safe, private line to your class teacher — for whenever something&apos;s on your mind. No pressure,
              no judgement, just a place to be heard.
            </p>
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
          </div>
        </Reveal>
      </div>
    </div>
  )
}
