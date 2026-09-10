import { Link } from 'react-router-dom'
import { playNav } from '../lib/sound'

const columns = [
  {
    title: 'Ministry',
    links: [
      { to: '/join', label: 'Join as a Kid' },
      { to: '/teacher', label: 'Teacher Portal' },
      { to: '/admin', label: 'Admin Control Centre' },
    ],
  },
  {
    title: 'Bible Quiz',
    links: [
      { to: '/setup', label: 'New Match' },
      { to: '/training', label: 'Training Mode' },
      { to: '/questions', label: 'Question Bank' },
      { to: '/history', label: 'History' },
    ],
  },
  {
    title: 'More',
    links: [
      { to: '/seasons', label: 'Seasons' },
      { to: '/transition', label: 'Transition Class' },
      { to: '/anthem', label: 'Anthem' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="mfm-footer">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/church-logo.png" alt="" className="h-9 w-9 rounded-lg object-cover" />
              <span className="font-display text-[0.95rem] font-extrabold leading-tight tracking-tight text-white">
                MFM Children&apos;s Ministry
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              A digital home for MFM Wuye kids to learn, compete, and belong &mdash; built for the ministry, run by the
              ministry.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mfm-eyebrow text-white/45">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} onClick={() => playNav()} className="text-sm font-semibold text-white/70 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} MFM Children&apos;s Ministry, Wuye.</p>
          <p>Built for Sunday school, works fully offline.</p>
        </div>
      </div>
    </footer>
  )
}
