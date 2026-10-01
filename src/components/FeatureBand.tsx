import type { ReactNode } from 'react'
import Reveal from './Reveal'

/**
 * A1, from the Awwwards reference, which governs the public landing page
 * only: full-bleed imagery.
 *
 * Every feature section used to be a small cut-out PNG prop floating on a
 * pastel wash, with confetti dots scattered behind it. Six of those in a row
 * reads as a template. Here each section is a photograph that runs to the
 * edge of the screen and the full height of the band, with the copy beside
 * it on the page's own plain ground. The sides alternate down the page so it
 * reads as an edited sequence rather than a repeated card.
 *
 * Every photograph is cropped the same way - cover, centred, one band height
 * - which is the Premier League rule about identical image crops, and the
 * thing that makes a column of photographs look deliberate.
 *
 * The colour that used to be smeared across the background now lives only in
 * the section's eyebrow and its demo card, through --card-accent.
 */
export default function FeatureBand({
  photo,
  alt,
  side,
  accent,
  children,
}: {
  photo: string
  /** What is actually in the picture. These carry meaning, so they are not decorative. */
  alt: string
  /** Which side the photograph sits on from 1024px up. */
  side: 'left' | 'right'
  accent: string
  children: ReactNode
}) {
  return (
    <section className="lp-feature-band full-bleed" data-side={side} style={{ ['--card-accent' as string]: accent }}>
      <div className="lp-feature-photo" role="img" aria-label={alt} style={{ backgroundImage: `url('${photo}')` }} />
      <div className="lp-feature-copy">
        <Reveal className="lp-feature-copy-inner">{children}</Reveal>
      </div>
    </section>
  )
}
