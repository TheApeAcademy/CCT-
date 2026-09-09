import { useEffect, useState, useCallback, Suspense, lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import { ensureSeedData } from './db/db'
import { unlockAudio } from './lib/sound'
import Home from './pages/Home'
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
import TransitionClass from './pages/TransitionClass'
import TransitionLectureDetail from './pages/TransitionLectureDetail'
import TransitionCheckpoint from './pages/TransitionCheckpoint'
import MockExam from './pages/MockExam'

// These two are the only screens that need the network (Supabase). Lazy
// load them so the @supabase/supabase-js bundle never has to be fetched or
// parsed by kids using the fully offline parts of the app.
const AskShare = lazy(() => import('./pages/AskShare'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))

function LazyFallback() {
  return <div className="py-20 text-center text-xl">Loading…</div>
}

function App() {
  const [seeded, setSeeded] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    ensureSeedData().then(() => setSeeded(true))
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
            <Route index element={<Home />} />
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
            <Route path="transition" element={<TransitionClass />} />
            <Route path="transition/lecture/:id" element={<TransitionLectureDetail />} />
            <Route path="transition/lecture/:id/checkpoint" element={<TransitionCheckpoint />} />
            <Route path="transition/mock-exam" element={<MockExam />} />
            <Route
              path="ask"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <AskShare />
                </Suspense>
              }
            />
            <Route
              path="teacher"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <TeacherDashboard />
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
