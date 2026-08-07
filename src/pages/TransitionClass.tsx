import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const LEARNER_KEY = 'cct-current-learner'

export default function TransitionClass() {
  const navigate = useNavigate()
  const lectures = useLiveQuery(() => db.transitionLectures.orderBy('order').toArray(), []) ?? []
  const questionCounts = useLiveQuery(async () => {
    const all = await db.transitionQuestions.toArray()
    const map = new Map<number, number>()
    for (const q of all) map.set(q.lectureId, (map.get(q.lectureId) ?? 0) + 1)
    return map
  }, []) ?? new Map<number, number>()

  const [learner, setLearner] = useState('')
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [citationsText, setCitationsText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setLearner(localStorage.getItem(LEARNER_KEY) ?? '')
  }, [])

  const updateLearner = (value: string) => {
    setLearner(value)
    localStorage.setItem(LEARNER_KEY, value)
  }

  const progress = useLiveQuery(async () => {
    if (!learner.trim()) return new Map<number, boolean>()
    const results = await db.transitionCheckpointResults.where('playerName').equalsIgnoreCase(learner.trim()).toArray()
    const map = new Map<number, boolean>()
    for (const r of results) map.set(r.lectureId, true)
    return map
  }, [learner]) ?? new Map<number, boolean>()

  const handleAddLecture = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Please add a title and lecture content.')
      return
    }
    const citations = citationsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    await db.transitionLectures.add({
      title: title.trim(),
      body: body.trim(),
      citations,
      order: lectures.length,
      createdAt: Date.now(),
    })
    playClick()
    haptics.success()
    setTitle('')
    setBody('')
    setCitationsText('')
    setCreating(false)
    setError('')
  }

  const handleDeleteLecture = async (id: number) => {
    if (!confirm('Delete this lecture and all its checkpoint questions?')) return
    await db.transitionQuestions.where('lectureId').equals(id).delete()
    await db.transitionLectures.delete(id)
    haptics.tap()
  }

  const goToMockExam = () => {
    playClick()
    navigate(`/transition/mock-exam?player=${encodeURIComponent(learner.trim() || 'Guest')}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <p className="text-4xl">🎓</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Transition Class</h1>
        <p className="mx-auto mt-2 max-w-xl text-white/60">
          Getting ready to move up to teenage church. Work through the lectures, take each checkpoint quiz, and finish
          with a mock exam. Your Sunday school teacher is here to guide you the whole way.
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <label className="block text-sm font-semibold text-white/80">Your name</label>
        <input
          value={learner}
          onChange={(e) => updateLearner(e.target.value)}
          placeholder="e.g. Ellie"
          className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
        />
        <p className="text-xs text-white/50">Used to track your lecture progress and checkpoint scores.</p>
      </div>

      <button
        onClick={goToMockExam}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
      >
        📝 Take a Mock Exam
      </button>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Lectures</h2>
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:scale-105 hover:bg-white/20"
          >
            {creating ? 'Cancel' : '+ Add Lecture'}
          </button>
        </div>

        {creating && (
          <div className="animate-page-in space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lecture title (e.g. Who is the Holy Spirit?)"
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the lecture content here..."
              rows={6}
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              value={citationsText}
              onChange={(e) => setCitationsText(e.target.value)}
              placeholder="Bible citations, comma separated (e.g. John 14:26, Acts 2:1-4)"
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button onClick={handleAddLecture} className="rounded-lg bg-amber-400 px-5 py-2 font-semibold text-purple-950 transition hover:scale-105">
              Save Lecture
            </button>
          </div>
        )}

        {lectures.length === 0 && !creating && (
          <p className="rounded-2xl bg-white/5 p-5 text-center text-white/50">No lectures yet. Add the first one above.</p>
        )}

        <div className="space-y-2">
          {lectures.map((lec, i) => (
            <div
              key={lec.id}
              className="animate-page-in flex items-center justify-between gap-3 rounded-xl bg-white/5 p-4 transition hover:bg-white/[0.08]"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {progress.get(lec.id!) && <span className="text-green-400">✓</span>}
                  <p className="truncate font-bold">{lec.title}</p>
                </div>
                <p className="text-xs text-white/50">
                  {questionCounts.get(lec.id!) ?? 0} checkpoint question{(questionCounts.get(lec.id!) ?? 0) === 1 ? '' : 's'}
                  {lec.citations.length > 0 && ` · ${lec.citations.length} citation${lec.citations.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  to={`/transition/lecture/${lec.id}?player=${encodeURIComponent(learner.trim() || 'Guest')}`}
                  onClick={() => playClick()}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950 transition hover:scale-105"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleDeleteLecture(lec.id!)}
                  className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300 transition hover:scale-105 hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
