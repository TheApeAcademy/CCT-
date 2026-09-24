import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { playClick } from '../lib/sound'

const THEME_KEY = 'mfm-signin-theme'

/**
 * Every icon on this page is the asset the app already uses for that feature,
 * so a child recognises the screen before they have read a word of it. The
 * circles that carry a painting are Bible stories; everything else is a
 * cut-out 3D icon on a tinted tile.
 */
const TILES: { src: string; label: string; from: string; to: string }[] = [
  { src: '/icons/bible-journey-book.png', label: 'Bible Journey', from: '#c78ae8', to: '#7d2196' },
  { src: '/teacher-isometric.png', label: 'Lessons', from: '#8fc9f5', to: '#2f6fb5' },
  { src: '/feature-leaderboard.png', label: 'Leaderboard', from: '#ffd479', to: '#e0a02a' },
  { src: '/icons/streak-flame.png', label: 'Streak', from: '#ffb36b', to: '#e0531a' },
  { src: '/feature-quiz.png', label: 'Quiz', from: '#7fc2ff', to: '#1b6fe0' },
  { src: '/feature-rocket.png', label: 'Games', from: '#a4e6c5', to: '#1f9b63' },
  { src: '/village/class-house1.png', label: 'My class', from: '#b9c6de', to: '#4c5e7e' },
  { src: '/village/messages-teacherhome.png', label: 'Messages', from: '#f3c9a1', to: '#b8763a' },
  { src: '/village/profile-card.png', label: 'My card', from: '#9fb8e8', to: '#42568c' },
  { src: '/icons/sunday-school-church.png', label: 'Sunday school', from: '#e8cfa8', to: '#a5763c' },
]

export default function KidsSignIn() {
  const [dark, setDark] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_KEY) === 'dark'
    } catch {
      return false
    }
  })

  const setTheme = (next: boolean) => {
    setDark(next)
    try {
      window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch {
      /* storage unavailable - the choice still holds for this visit */
    }
  }

  // Through a portal on purpose. The kids' shell puts its header at z-40 and
  // its <main> at z-10, so anything rendered inside main sits in main's own
  // stacking context and can never cover that header, however high its
  // z-index. This page is the whole screen, so it goes on the body.
  return createPortal(
    <div className={`ic-screen ${dark ? 'is-dark' : ''} fixed inset-0 z-[60] overflow-y-auto`}>
      <div className="ic-bar">
        <Link to="/" className="ic-mark">
          {/* The ministry's own roundel, not the children's lockup: the
              lockup is a wide wordmark and turns to mush at 30px. */}
          <img src="/mfm-logo.png" alt="" />
          MFM Kids
        </Link>
        <button
          type="button"
          onClick={() => {
            playClick()
            setTheme(!dark)
          }}
          aria-label={dark ? 'Switch to light' : 'Switch to dark'}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: '1px solid var(--ic-line)' }}
        >
          {dark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>

      <SignInCluster />

      <div className="ic-lower">
        <div>
          <div className="ic-grid">
            {TILES.map((t) => (
              <span key={t.label} className="ic-tile" style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }} title={t.label}>
                <img src={t.src} alt={t.label} loading="lazy" />
              </span>
            ))}
          </div>
          <h2 className="ic-h2">
            Everything from Sunday morning,
            <br />
            on any screen at home
          </h2>
          <p className="ic-p">
            Your class, your lessons, your Bible Journey and your points live in one place. Sign in on a phone, a
            tablet or the family laptop and pick up on the same verse you stopped at in church.
          </p>
        </div>

        <div>
          <div className="ic-plus" aria-hidden>
            <span className="ic-blob ic-b2">
              <img src="/journey/jacob-ladder-dream.jpg" alt="" />
            </span>
            <span className="ic-blob ic-b1">
              <img src="/icons/bible-journey-book.png" alt="" />
            </span>
            <span className="ic-blob ic-b3">
              <img src="/journey/noah-dove-olive-branch.jpg" alt="" />
            </span>
            <span className="ic-blob ic-b4">
              <img src="/journey/abraham-isaac-ram-provided.jpg" alt="" />
            </span>
            <b className="ic-count">39</b>
          </div>
          <p className="ic-plus-name">Bible Journey</p>
          <h2 className="ic-h2">
            Every book of the
            <br />
            Old Testament, one stepping stone at a time
          </h2>
          <p className="ic-p">
            Thirty nine books, each with its own painting, unlocked in order as a child finishes the one before.
            Parents see the streak, teachers see the class. Read the <Link to="/safety">safety promise</Link> for what
            we do and do not keep.
          </p>
        </div>
      </div>

      <div className="ic-foot">
        <span>MFM Children&apos;s Ministry, Wuye</span>
        <Link to="/safety">Privacy</Link>
        <Link to="/safety">Safety</Link>
        <span>Ask your teacher for a class code</span>
      </div>
    </div>,
    document.body,
  )
}

/**
 * The cluster, the wordmark and the two doors. Lives on its own because the
 * landing page carries the same thing: this is the first thing anyone sees of
 * MFM Kids, on the public site and on the kids sign in page alike. The dow
 * and date are read fresh at render so the calendar tile is never stale.
 */
export function SignInCluster() {
  const today = new Date()
  const dow = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()]
  return (
    <>
    <div className="ic-hero" aria-hidden>
      <span className="ic-app ic-a3 sq">
        <img src="/village/class-house1.png" alt="" />
      </span>
      <span className="ic-app ic-a1">
        <img src="/icons/bible-journey-book.png" alt="" />
      </span>
      <span className="ic-face">
        <img src="/teacher-isometric.png" alt="" />
      </span>
      <span className="ic-app ic-a2">
        <img src="/feature-leaderboard.png" alt="" />
      </span>
      <span className="ic-app ic-a5 is-story">
        <img src="/journey/noah-dove-olive-branch.jpg" alt="" />
      </span>
      <span className="ic-app ic-a4">
        <img src="/icons/streak-flame.png" alt="" />
      </span>
      <span className="ic-cal">
        <em>{dow}</em>
        <b>{today.getDate()}</b>
      </span>
    </div>

    <h1 className="ic-word">MFM Kids</h1>
    <p className="ic-sub">Your class, your lessons, your Bible Journey.</p>
    {/* ?mode=returning, not a bare /join: a button that says Sign In has to
        land on the sign in form, not on the sign up form. */}
    <Link to="/join?mode=returning" className="ic-btn" onClick={() => playClick()}>
      Sign In
    </Link>
    <Link to="/join?mode=new" className="ic-btn-quiet" onClick={() => playClick()}>
      I am new here
    </Link>
    </>
  )
}
