import { useEffect, useState, useCallback } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import { ensureSeedData } from './db/db'
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
