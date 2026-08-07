import { useEffect, useState, useCallback } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import { ensureSeedData } from './db/db'
import { unlockAudio } from './lib/sound'
import Home from './pages/Home'
import QuestionBank from './pages/QuestionBank'
import GameSetup from './pages/GameSetup'
import Gameplay from './pages/Gameplay'
import Results from './pages/Results'
import MatchResults from './pages/MatchResults'
import History from './pages/History'

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
            <Route path="play" element={<Gameplay />} />
            <Route path="results/:sessionId" element={<Results />} />
            <Route path="match-results/:matchId" element={<MatchResults />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </HashRouter>
    </>
  )
}

export default App
