import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { TransitionQuestion } from '../db/types'

const emptyForm = {
  text: '',
  options: ['', '', '', ''] as [string, string, string, string],
  correctIndex: 0 as 0 | 1 | 2 | 3,
  funFact: '',
}

export default function TransitionLectureDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const player = searchParams.get('player') ?? 'Guest'
  const lectureId = Number(id)

  const lecture = useLiveQuery(() => db.transitionLectures.get(lectureId), [lectureId])
  const questions = useLiveQuery(() => db.transitionQuestions.where('lectureId').equals(lectureId).toArray(), [lectureId]) ?? []
  const bestResult = useLiveQuery(
    () =>
      db.transitionCheckpointResults
        .where('lectureId')
        .equals(lectureId)
        .and((r) => r.playerName.toLowerCase() === player.toLowerCase())
        .last(),
    [lectureId, player]
  )

  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const startEdit = (q: TransitionQuestion) => {
    setEditingId(q.id!)
    setForm({ text: q.text, options: [...q.options] as [string, string, string, string], correctIndex: q.correctIndex, funFact: q.funFact ?? '' })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.text.trim()) return setError('Question text is required.')
    if (form.options.some((o) => !o.trim())) return setError('All four options are required.')
    const payload = {
      lectureId,
      text: form.text.trim(),
      options: form.options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex: form.correctIndex,
      funFact: form.funFact.trim() || undefined,
    }
    if (editingId) {
      await db.transitionQuestions.update(editingId, payload)
    } else {
      await db.transitionQuestions.add(payload)
    }
    playClick()
    haptics.success()
    resetForm()
  }

  const handleDelete = async (qid: number) => {
    if (!confirm('Delete this checkpoint question?')) return
    await db.transitionQuestions.delete(qid)
    haptics.tap()
  }

  if (!lecture) return <div className="py-20 text-center text-xl">Loading…</div>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/transition" className="text-sm text-white/50 hover:text-white/80">
        ← Back to Transition Class
      </Link>

      <div className="rounded-3xl bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-6 shadow-2xl">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{lecture.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-white/80">{lecture.body}</p>
        {lecture.citations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {lecture.citations.map((c, i) => (
              <span key={i} className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-semibold text-amber-300">
                📖 {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {bestResult && (
        <p className="text-center text-sm text-white/60">
          Best checkpoint score for {player}: {bestResult.score}/{bestResult.total}
        </p>
      )}

      {questions.length > 0 ? (
        <Link
          to={`/transition/lecture/${lectureId}/checkpoint?player=${encodeURIComponent(player)}`}
          onClick={() => playClick()}
          className="block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-center text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
        >
          ✏️ Take Checkpoint Quiz ({questions.length} question{questions.length === 1 ? '' : 's'})
        </Link>
      ) : (
        <p className="rounded-2xl bg-white/5 p-4 text-center text-white/50">No checkpoint questions yet for this lecture.</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Checkpoint Questions</h2>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:scale-105 hover:bg-white/20"
          >
            {showForm ? 'Cancel' : '+ Add Question'}
          </button>
        </div>

        {showForm && (
          <div className="animate-page-in space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, correctIndex: i as 0 | 1 | 2 | 3 })}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                      form.correctIndex === i ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const options = [...form.options] as [string, string, string, string]
                      options[i] = e.target.value
                      setForm({ ...form, options })
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              ))}
            </div>
            <input
              value={form.funFact}
              onChange={(e) => setForm({ ...form, funFact: e.target.value })}
              placeholder="Explanation shown after answering (optional)"
              className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button onClick={handleSubmit} className="rounded-lg bg-amber-400 px-5 py-2 font-semibold text-purple-950 transition hover:scale-105">
              {editingId ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/5 p-4">
              <div>
                <p className="font-medium">{q.text}</p>
                <p className="mt-1 text-sm text-white/60">✓ {q.options[q.correctIndex]}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => startEdit(q)} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:scale-105 hover:bg-white/20">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(q.id!)}
                  className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-300 transition hover:scale-105 hover:bg-red-500/30"
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
