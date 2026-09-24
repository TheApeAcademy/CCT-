import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Radio } from 'lucide-react'
import { playNav, playClick } from '../lib/sound'

const MFM_LIVE_URL = 'https://www.mountainoffire.org/live'

/**
 * The studio's own address, for the panel at the end of the footer row.
 *
 * An empty string is a supported state: the panel then keeps its credit and
 * its copy and shows no call to action, rather than putting a dead link on a
 * client's live site.
 */
const ZEBRAISH_URL = 'https://bankys-portfolio.vercel.app/'

const columns = [
  {
    title: 'Who We Are',
    links: [
      { to: '/#about', label: 'About the Ministry' },
      { to: '/#wuye', label: 'MFM Wuye' },
      { to: '/#leadership', label: 'Leadership' },
      { to: '/#ministry', label: "Children's Ministry" },
    ],
  },
  {
    title: 'What We Do',
    links: [
      { to: '/features', label: 'Everything Inside' },
      { to: '/setup', label: 'New Match' },
      { to: '/training', label: 'Training Mode' },
      { to: '/seasons', label: 'Seasons' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/questions', label: 'Question Bank' },
      { to: '/history', label: 'History' },
      { to: '/anthem', label: 'Anthem' },
      { to: '/safety', label: 'Safety & Privacy' },
      { to: '/#contact', label: 'Contact Us' },
    ],
  },
] as const

export default function SiteFooter() {
  return (
    <footer className="section-band full-bleed relative z-10 border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
          <div>
            <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" className="h-16 w-auto object-contain" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
              MFM Wuye&apos;s digital home for children: classes, the Bible Quiz, and a place every child in this
              church can call theirs.
            </p>
            <a
              href={MFM_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClick()}
              className="nav-cta-solid mt-5 inline-flex !gap-1.5 !px-4 !py-2 text-xs uppercase"
            >
              <Radio className="h-3.5 w-3.5" strokeWidth={2.25} />
              Join Us Live
            </a>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-xs text-[var(--ink-faint)]">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} onClick={() => playNav()} className="text-sm font-semibold text-white/75 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ZebraishCard />
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--hairline)] pt-6 text-xs text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} MFM Children&apos;s Ministry, Wuye.</p>
          <p>Built by Zebraish.</p>
        </div>
      </div>
    </footer>
  )
}

/**
 * The studio's own panel, in the footer's row rather than under it: a narrow
 * vertical card, the last column of the grid.
 *
 * The logo falls back to the wordmark in type if the file ever goes missing,
 * because a footer that ships a broken image icon is worse than one that
 * ships no image. There is no name line under it either way: the lockup
 * already spells the name, and so does the fallback.
 */
function ZebraishCard() {
  const [logoFailed, setLogoFailed] = useState(false)
  return (
    <aside className="zeb-card">
      <div className="zeb-mark">
        {logoFailed ? (
          <span className="zeb-wordmark">ZEBRAISH</span>
        ) : (
          <img src="/zebraish-lockup.png" alt="Zebraish" onError={() => setLogoFailed(true)} />
        )}
      </div>
      <p className="zeb-credit">Built this site</p>
      <p className="zeb-body">
        A software studio. We design and build websites and apps for churches, schools and small teams.
      </p>
      {ZEBRAISH_URL ? (
        <a
          href={ZEBRAISH_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playClick()}
          className="zeb-cta"
        >
          <span className="zeb-cta-line">Want a site like this one?</span>
          <span className="zeb-cta-link">
            See our work
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </a>
      ) : null}
    </aside>
  )
}
