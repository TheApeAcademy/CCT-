import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { playNav, playClick } from '../lib/sound'

const MFM_LIVE_URL = 'https://www.mountainoffire.org/live'

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
      { to: '/setup', label: 'New Match' },
      { to: '/training', label: 'Training Mode' },
      { to: '/transition', label: 'Transition Class' },
      { to: '/seasons', label: 'Seasons' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/questions', label: 'Question Bank' },
      { to: '/history', label: 'History' },
      { to: '/anthem', label: 'Anthem' },
      { to: '/#contact', label: 'Contact Us' },
    ],
  },
] as const

export default function SiteFooter() {
  return (
    <footer className="section-band full-bleed relative z-10 border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/church-logo.png" alt="" className="crest h-9 w-9 shrink-0 object-cover" />
              <span className="font-display text-[0.95rem] font-extrabold leading-tight tracking-tight">
                MFM Children&apos;s Ministry
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
              MFM Wuye&apos;s digital home for kids &mdash; classes, the Bible Quiz, and a place every child in this
              church can call theirs.
            </p>
            <a
              href={MFM_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClick()}
              className="btn-outline mt-5 inline-flex !gap-1.5 !px-4 !py-2 text-xs"
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
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--hairline)] pt-6 text-xs text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} MFM Children&apos;s Ministry, Wuye.</p>
          <p>Built for Sunday school, works fully offline.</p>
        </div>
      </div>
    </footer>
  )
}
