import { useEffect, useState, useCallback, Suspense, lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PortalShell from './components/PortalShell'
import KidsShell from './components/KidsShell'
import SplashScreen from './components/SplashScreen'
import { db, ensureSeedData } from './db/db'
import { unlockAudio } from './lib/sound'
import QuestionBank from './pages/QuestionBank'
import GameSetup from './pages/GameSetup'
import GroundRules from './pages/GroundRules'
import Gameplay from './pages/Gameplay'
import Results from './pages/Results'
import MatchResults from './pages/MatchResults'
import History from './pages/History'
import Seasons from './pages/Seasons'
import Anthem from './pages/Anthem'
import Training from './pages/Training'

// These are the only screens that need the network (Supabase accounts,
// classes, messaging). Lazy load them so the @supabase/supabase-js bundle
// never has to be fetched or parsed by kids using the fully offline quiz.
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const TeacherPortal = lazy(() => import('./pages/TeacherPortal'))
const StudentPortal = lazy(() => import('./pages/StudentPortal'))
const JoinClass = lazy(() => import('./pages/JoinClass'))

// The landing page carries its own motion libraries (framer-motion, gsap)
// for its cinematic hero/scroll choreography. Lazy load it too so that
// weight never lands in the shared entry chunk kids on the offline quiz
// screens (Training, Gameplay, ...) have to download and parse.
const Home = lazy(() => import('./pages/Home'))

function LazyFallback() {
  return <div className="py-20 text-center text-xl">Loading…</div>
}

function App() {
  const [seeded, setSeeded] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    ensureSeedData().then(() => setSeeded(true))
  }, [])

  // Only pull in the Supabase-dependent sync module (and its network
  // bundle) if there's actually a locally-queued result to push — a kid on
  // the fully offline quiz who never links a team to a Student Code should
  // never fetch it at all. The existence check itself is pure Dexie.
  useEffect(() => {
    const maybeSync = () => {
      db.pendingLeaderboardSync
        .where('synced')
        .equals(0)
        .count()
        .then((count) => {
          if (count > 0) import('./lib/leaderboardSync').then((m) => m.syncPendingLeaderboard())
        })
    }
    maybeSync()
    window.addEventListener('online', maybeSync)
    return () => window.removeEventListener('online', maybeSync)
  }, [])

  // Same lazy-import-only-if-needed pattern as above, for the full-history
  // sync (every question, not just aggregate points - see sessionSync.ts).
  // The schema migration backfills every pre-existing local session with
  // synced: 0, so this also finally pushes older history up on next load,
  // not just matches played from here on.
  useEffect(() => {
    const maybeSyncSessions = () => {
      db.gameSessions
        .where('synced')
        .equals(0)
        .count()
        .then((count) => {
          if (count > 0) import('./lib/sessionSync').then((m) => m.syncPendingSessions())
        })
    }
    maybeSyncSessions()
    window.addEventListener('online', maybeSyncSessions)
    return () => window.removeEventListener('online', maybeSyncSessions)
  }, [])

  // iOS Safari (including installed/standalone PWAs) only allows the Web
  // Audio API to start inside a real user gesture. Unlock it on the very
  // first tap/click/key of the session so every sound effect works
  // reliably from that point on, instead of relying on whichever specific
  // button happens to trigger the first sound.
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true, passive: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <>
      {!splashDone && <SplashScreen ready={seeded} onDone={handleSplashDone} />}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route
              index
              element={
                <Suspense fallback={<LazyFallback />}>
                  <Home />
                </Suspense>
              }
            />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="setup" element={<GameSetup />} />
            <Route path="ground-rules" element={<GroundRules />} />
            <Route path="play" element={<Gameplay />} />
            <Route path="results/:sessionId" element={<Results />} />
            <Route path="match-results/:matchId" element={<MatchResults />} />
            <Route path="history" element={<History />} />
            <Route path="seasons" element={<Seasons />} />
            <Route path="anthem" element={<Anthem />} />
            <Route path="training" element={<Training />} />
          </Route>

          {/* Admin, Teacher, and Kids are deliberately NOT nested under the
              public site's <Layout /> — each is its own link with its own
              chrome, no shared nav between them. */}
          <Route path="admin" element={<PortalShell eyebrow="Admin Control Centre" />}>
            <Route
              index
              element={
                <Suspense fallback={<LazyFallback />}>
                  <AdminPortal />
                </Suspense>
              }
            />
          </Route>
          <Route path="teacher" element={<PortalShell eyebrow="Teacher Portal" />}>
            <Route
              index
              element={
                <Suspense fallback={<LazyFallback />}>
                  <TeacherPortal />
                </Suspense>
              }
            />
          </Route>
          <Route path="student" element={<KidsShell eyebrow="Kids Dashboard" />}>
            <Route
              index
              element={
                <Suspense fallback={<LazyFallback />}>
                  <StudentPortal />
                </Suspense>
              }
            />
          </Route>
          <Route path="join" element={<KidsShell eyebrow="Create Your Account" />}>
            <Route
              index
              element={
                <Suspense fallback={<LazyFallback />}>
                  <JoinClass />
                </Suspense>
              }
            />
            <Route
              path=":code"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <JoinClass />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </>
  )
}

export default App
