import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, ensureActiveSeason, exportQuestionSet, importQuestionBundle, type ExportBundle } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { Question, QuestionSet } from '../db/types'

const emptyForm = {
  text: '',
  category: '',
  difficulty: 1 as 1 | 2 | 3 | 4 | 5,
  options: ['', '', '', ''] as [string, string, string, string],
  correctIndex: 0 as 0 | 1 | 2 | 3,
  funFact: '',
}

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-3 py-2 outline-none focus:border-[var(--gold)]'

export default function QuestionBank() {
  useEffect(() => {
    ensureSeedData()
  }, [])

  const sets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const seasons = useLiveQuery(() => db.seasons.toArray(), []) ?? []
  const seasonName = (seasonId?: number) => seasons.find((s) => s.id === seasonId)?.name
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null)
  const [newSetName, setNewSetName] = useState('')
  const [creatingSet, setCreatingSet] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedSetId === null && sets.length > 0) {
      setSelectedSetId(sets[0].id!)
    }
  }, [sets, selectedSetId])

  const questions = useLiveQuery(
    () => (selectedSetId ? db.questions.where('setId').equals(selectedSetId).sortBy('difficulty') : Promise.resolve<Question[]>([])),
    [selectedSetId]
  ) ?? []

  const selectedSet = useMemo(() => sets.find((s) => s.id === selectedSetId), [sets, selectedSetId])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const handleCreateSet = async () => {
    const name = newSetName.trim()
    if (!name) return
    const season = await ensureActiveSeason()
    const id = await db.questionSets.add({ name, createdAt: Date.now(), isStarter: false, seasonId: season.id })
    playClick()
    haptics.success()
    setSelectedSetId(id as number)
    setNewSetName('')
    setCreatingSet(false)
  }

  const handleDeleteSet = async (set: QuestionSet) => {
    if (!confirm(`Delete "${set.name}" and all its questions? This can't be undone.`)) return
    await db.questions.where('setId').equals(set.id!).delete()
    await db.questionSets.delete(set.id!)
    haptics.tap()
    if (selectedSetId === set.id) setSelectedSetId(null)
  }

  const startEdit = (q: Question) => {
    setEditingId(q.id!)
    setForm({
      text: q.text,
      category: q.category,
      difficulty: q.difficulty,
      options: [...q.options] as [string, string, string, string],
      correctIndex: q.correctIndex,
      funFact: q.funFact ?? '',
    })
  }

  const handleSubmit = async () => {
    if (!selectedSetId) return
    if (!form.text.trim()) return setError('Question text is required.')
    if (form.options.some((o) => !o.trim())) return setError('All four options are required.')

    const payload = {
      setId: selectedSetId,
      category: form.category.trim() || 'General',
      difficulty: form.difficulty,
      text: form.text.trim(),
      options: form.options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex: form.correctIndex,
      funFact: form.funFact.trim() || undefined,
    }

    if (editingId) {
      await db.questions.update(editingId, payload)
    } else {
      await db.questions.add(payload)
    }
    playClick()
    haptics.success()
    resetForm()
  }

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Delete this question?')) return
    await db.questions.delete(id)
    haptics.tap()
    if (editingId === id) resetForm()
  }

  const handleExport = async () => {
    if (!selectedSetId) return
    const bundle = await exportQuestionSet(selectedSetId)
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedSet?.name ?? 'question-set'}.json`
    a.click()
    URL.revokeObjectURL(url)
    playClick()
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const bundle = JSON.parse(text) as ExportBundle
      const newSetId = await importQuestionBundle(bundle)
      setSelectedSetId(newSetId)
      haptics.success()
    } catch {
      alert('Could not import that file. Make sure it is a valid exported question set.')
      haptics.error()
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div data-landing-theme="light" className="site-light-theme lp-page full-bleed px-4 py-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <h2 className="font-display text-lg font-bold">Question Sets</h2>
        <div className="space-y-2">
          {sets.map((set) => (
            <div
              key={set.id}
              className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition hover:scale-[1.02] ${
                selectedSetId === set.id ? 'bg-[var(--gold)] text-[var(--gold-ink)] font-semibold' : 'bg-[var(--ink-panel)] hover:bg-[var(--ink-raised)]'
              }`}
              onClick={() => {
                if (selectedSetId !== set.id) playClick()
                setSelectedSetId(set.id!)
                resetForm()
              }}
            >
              <span className="min-w-0 flex-1 truncate">
                {set.name}
                {seasonName(set.seasonId) && <span className="ml-1 text-[10px] font-normal opacity-70">· {seasonName(set.seasonId)}</span>}
              </span>
              {!set.isStarter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSet(set)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:text-red-700"
                  title="Delete set"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {creatingSet ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="New set name"
              className={`${inputClass} text-sm`}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()}
            />
            <div className="flex gap-2">
              <button onClick={handleCreateSet} className="btn-solid flex-1 py-1.5 text-sm">
                Add
              </button>
              <button onClick={() => setCreatingSet(false)} className="btn-outline flex-1 py-1.5 text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreatingSet(true)}
            className="w-full rounded-lg border border-dashed border-[var(--hairline-strong)] py-2 text-sm text-[var(--ink-muted)] transition hover:scale-[1.02] hover:bg-[var(--ink-panel)]"
          >
            + New question set
          </button>
        )}

        <div className="mt-4 space-y-2 border-t border-[var(--hairline)] pt-4">
          <button
            onClick={handleExport}
            disabled={!selectedSetId}
            className="btn-outline w-full py-2 text-sm disabled:opacity-40"
          >
            ⬇ Export selected set
          </button>
          <button onClick={handleImportClick} className="btn-outline w-full py-2 text-sm">
            ⬆ Import set from file
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
      </aside>

      <section className="space-y-6">
        {!selectedSet ? (
          <p className="text-[var(--ink-muted)]">Create a question set to get started.</p>
        ) : (
          <>
            <div>
              <h2 className="font-display text-2xl font-bold">{selectedSet.name}</h2>
              <p className="text-sm text-[var(--ink-muted)]">{questions.length} question{questions.length === 1 ? '' : 's'}</p>
            </div>

            <div className="panel p-5">
              <h3 className="mb-3 font-display font-bold">{editingId ? 'Edit question' : 'Add a question'}</h3>
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <div className="grid gap-3">
                <textarea
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="Question text"
                  rows={2}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Category (e.g. Old Testament)"
                    className={`${inputClass} col-span-2 sm:col-span-2`}
                  />
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                    className={inputClass}
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d} className="text-black">
                        Difficulty {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, correctIndex: i as 0 | 1 | 2 | 3 })}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                          form.correctIndex === i ? 'bg-emerald-500 text-white' : 'bg-[var(--ink-panel)] text-[var(--ink-muted)]'
                        }`}
                        title="Mark as correct answer"
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
                        className={`${inputClass} flex-1`}
                      />
                    </div>
                  ))}
                </div>
                <input
                  value={form.funFact}
                  onChange={(e) => setForm({ ...form, funFact: e.target.value })}
                  placeholder="Fun fact / verse reference shown after answering (optional)"
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <button onClick={handleSubmit} className="btn-solid px-5 py-2">
                    {editingId ? 'Save changes' : 'Add question'}
                  </button>
                  {editingId && (
                    <button onClick={resetForm} className="btn-outline px-5 py-2">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="panel animate-page-in flex items-start justify-between gap-3 p-4 transition hover:bg-[var(--ink-raised)]"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <div>
                    <div className="mb-1 flex gap-2 text-xs">
                      <span className="rounded-full bg-[var(--hero-accent)]/15 px-2 py-0.5 text-[var(--hero-accent)]">{q.category}</span>
                      <span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[var(--gold)]">Difficulty {q.difficulty}</span>
                    </div>
                    <p className="font-medium">{q.text}</p>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      ✓ {q.options[q.correctIndex]}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(q)} className="btn-outline px-3 py-1.5 text-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id!)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-600 transition hover:scale-105 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No questions yet. Add one above.</p>}
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  )
}
