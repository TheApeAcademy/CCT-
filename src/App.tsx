import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import QuestionBank from './pages/QuestionBank'
import GameSetup from './pages/GameSetup'
import Gameplay from './pages/Gameplay'
import Results from './pages/Results'
import History from './pages/History'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="setup" element={<GameSetup />} />
          <Route path="play" element={<Gameplay />} />
          <Route path="results/:sessionId" element={<Results />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
