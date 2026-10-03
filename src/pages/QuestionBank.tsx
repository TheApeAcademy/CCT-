import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, ensureActiveSeason, exportQuestionSet, importQuestionBundle, type ExportBundle } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { Question, QuestionSet } from '../db/types'
import PublicShell from '../components/public/PublicShell'
import { card, display, field, label, pill } from '../components/public/kit'

const emptyForm = {
  text: '',
  category: '',
  difficulty: 1 as 1 | 2 | 3 | 4 | 5,
  options: ['', '', '', ''] as [string, string, string, string],
  correctIndex: 0 as 0 | 1 | 2 | 3,
  funFact: '',
  reference: '',
  groups: [] as string[],
}

const inputClass = 'w-full rounded-xl border border-[var(--hairline-strong)] bg-black/25 px-3 py-2.5 text-white outline-none focus:border-[var(--gold)]'

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
  const [newGroupName, setNewGroupName] = useState('')
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState(0)
  const [openId, setOpenId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // A scratch "cart" of picked questions - persisted (not just this
  // component's state) so it survives switching between sets while you
  // build one up, since the + button works the same regardless of which
  // set you're currently browsing.
  const builderItems = useLiveQuery(() => db.quizBuilder.toArray(), []) ?? []
  const builderIds = useMemo(() => new Set(builderItems.map((b) => b.questionId)), [builderItems])
  const [buildingQuizName, setBuildingQuizName] = useState('')
  const [buildingQuiz, setBuildingQuiz] = useState(false)

  // Groups are freeform labels (e.g. "10-11 years", "Transition Class") that cut
  // across categories and sets, so the known list is derived from every question
  // in the bank rather than tracked in its own table.
  const allQuestionsEverywhere = useLiveQuery(() => db.questions.toArray(), []) ?? []
  const allGroups = useMemo(() => {
    const set = new Set<string>()
    allQuestionsEverywhere.forEach((q) => q.groups?.forEach((g) => set.add(g)))
    return [...set].sort()
  }, [allQuestionsEverywhere])

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

  const visibleQuestions = useMemo(() => {
    let list = groupFilter ? questions.filter((q) => q.groups?.includes(groupFilter)) : questions
    if (level) list = list.filter((q) => q.difficulty === level)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (item) =>
          item.text.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.reference?.toLowerCase().includes(q) ||
          item.options.some((opt) => opt.toLowerCase().includes(q))
      )
    }
    return list
  }, [questions, groupFilter, search, level])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setFormOpen(false)
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
    setFormOpen(true)
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
    setEditingId(q.id!)
    setForm({
      text: q.text,
      category: q.category,
      difficulty: q.difficulty,
      options: [...q.options] as [string, string, string, string],
      correctIndex: q.correctIndex,
      funFact: q.funFact ?? '',
      reference: q.reference ?? '',
      groups: q.groups ? [...q.groups] : [],
    })
  }

  const toggleFormGroup = (g: string) => {
    setForm((f) => (f.groups.includes(g) ? { ...f, groups: f.groups.filter((x) => x !== g) } : { ...f, groups: [...f.groups, g] }))
  }

  const addNewGroup = () => {
    const g = newGroupName.trim()
    if (!g) return
    if (!form.groups.includes(g)) setForm((f) => ({ ...f, groups: [...f.groups, g] }))
    setNewGroupName('')
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
      reference: form.reference.trim() || undefined,
      groups: form.groups.length ? form.groups : undefined,
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

  const toggleBuilderItem = async (questionId: number) => {
    playClick()
    haptics.tap()
    if (builderIds.has(questionId)) {
      const row = await db.quizBuilder.where('questionId').equals(questionId).first()
      if (row) await db.quizBuilder.delete(row.id!)
    } else {
      await db.quizBuilder.add({ questionId, addedAt: Date.now() })
    }
  }

  const clearBuilder = async () => {
    if (!confirm('Clear all picked questions?')) return
    await db.quizBuilder.clear()
  }

  const handleCreateQuizFromBuilder = async () => {
    const name = buildingQuizName.trim()
    if (!name || builderItems.length === 0) return
    setBuildingQuiz(true)
    try {
      const season = await ensureActiveSeason()
      const newSetId = (await db.questionSets.add({ name, createdAt: Date.now(), isStarter: false, seasonId: season.id })) as number
      const picked = await db.questions.bulkGet(builderItems.map((b) => b.questionId))
      const copies = picked.filter((q): q is Question => !!q).map(({ id: _id, ...rest }) => ({ ...rest, setId: newSetId }))
      await db.questions.bulkAdd(copies)
      await db.quizBuilder.clear()
      setBuildingQuizName('')
      setSelectedSetId(newSetId)
      haptics.success()
    } finally {
      setBuildingQuiz(false)
    }
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

  const btn = (solid: boolean) => ({ padding: '10px 16px', borderRadius: 999, border: solid ? 'none' : '1px solid rgba(255,255,255,.22)', background: solid ? '#ffd84d' : 'transparent', color: solid ? '#1a0f2e' : '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' as const })

  return (
    <PublicShell eyebrow="Question Bank" title="Every question, one place" sub="Browse the questions used in quiz matches, by difficulty and Bible book. Teachers can add, edit and pick questions here too." accent="#ffd84d">
      <div style={{ paddingBottom: builderItems.length > 0 ? 80 : 0 }}>
        <div style={{ ...card, marginTop: 28, padding: 18 }}>
          <p style={label}>QUESTION SETS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {sets.map((set) => {
              const on = selectedSetId === set.id
              return (
                <span key={set.id} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: `1px solid ${on ? '#ffd84d' : 'rgba(255,255,255,.16)'}`, background: on ? '#ffd84d' : 'transparent', maxWidth: '100%' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!on) playClick()
                      setSelectedSetId(set.id!)
                      setOpenId(null)
                      resetForm()
                    }}
                    style={{ padding: '9px 14px', border: 'none', background: 'transparent', color: on ? '#1a0f2e' : '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', textAlign: 'left', minWidth: 0, overflowWrap: 'anywhere' }}
                  >
                    {set.name}
                    {seasonName(set.seasonId) && <span style={{ fontWeight: 600, opacity: 0.65 }}> · {seasonName(set.seasonId)}</span>}
                  </button>
                  {!set.isStarter && (
                    <button type="button" onClick={() => handleDeleteSet(set)} title="Delete set" aria-label={`Delete ${set.name}`} style={{ padding: '9px 12px 9px 0', border: 'none', background: 'transparent', color: on ? '#1a0f2e' : '#ff8a96', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      ✕
                    </button>
                  )}
                </span>
              )
            })}
          </div>
          {creatingSet ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <input autoFocus value={newSetName} onChange={(e) => setNewSetName(e.target.value)} placeholder="New set name" className="pb-field" style={{ ...field, flex: '1 1 220px', padding: '10px 16px', fontSize: 14 }} onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()} />
              <button type="button" onClick={handleCreateSet} style={btn(true)}>
                Add
              </button>
              <button type="button" onClick={() => setCreatingSet(false)} style={btn(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => setCreatingSet(true)} style={{ ...btn(false), borderStyle: 'dashed' }}>
                + New question set
              </button>
              <button type="button" onClick={handleExport} disabled={!selectedSetId} style={{ ...btn(false), opacity: selectedSetId ? 1 : 0.4 }}>
                ⬇ Export this set
              </button>
              <button type="button" onClick={handleImportClick} style={btn(false)}>
                ⬆ Import a set
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
            </div>
          )}
        </div>

        {!selectedSet ? (
          <p style={{ margin: '20px 0 0', color: 'rgba(236,230,250,.55)' }}>Create a question set to get started.</p>
        ) : (
          <>
            <div ref={formRef} style={{ ...card, marginTop: 14, padding: 18, scrollMarginTop: 90 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <p style={{ margin: 0, fontFamily: display, fontWeight: 800, fontSize: 20, color: '#fff' }}>{editingId ? 'Edit question' : `Add to ${selectedSet.name}`}</p>
                {!formOpen && (
                  <button type="button" onClick={() => setFormOpen(true)} style={btn(true)}>
                    + Add a question
                  </button>
                )}
              </div>
              {formOpen && (
                <div className="mt-4">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={form.funFact}
                    onChange={(e) => setForm({ ...form, funFact: e.target.value })}
                    placeholder="Fun fact shown after answering (optional)"
                    className={inputClass}
                  />
                  <input
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Bible reference, e.g. Genesis 1:3"
                    className={inputClass}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-sm font-semibold text-[var(--ink-muted)]">Groups</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allGroups.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleFormGroup(g)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          form.groups.includes(g) ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'bg-[var(--ink-panel)] text-[var(--ink-muted)] hover:bg-[var(--ink-raised)]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                    {form.groups
                      .filter((g) => !allGroups.includes(g))
                      .map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleFormGroup(g)}
                          className="rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-semibold text-[var(--gold-ink)]"
                        >
                          {g}
                        </button>
                      ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewGroup())}
                      placeholder="New group name, e.g. 10-11 years"
                      className={`${inputClass} text-sm`}
                    />
                    <button type="button" onClick={addNewGroup} className="btn-outline shrink-0 px-4 py-2 text-sm">
                      + Add Group
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSubmit} className="btn-solid px-5 py-2">
                    {editingId ? 'Save changes' : 'Add question'}
                  </button>
                  <button onClick={resetForm} className="btn-outline px-5 py-2">
                    {editingId ? 'Cancel' : 'Close'}
                  </button>
                </div>
              </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="pb-field" style={{ ...field, flex: '1 1 260px' }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['All', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'].map((name, i) => (
                  <button key={name} type="button" onClick={() => setLevel(i)} style={pill(level === i)}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {allGroups.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(236,230,250,.55)' }}>Group:</span>
                <button type="button" onClick={() => setGroupFilter(null)} style={{ ...pill(groupFilter === null), padding: '7px 12px', fontSize: 12 }}>
                  All
                </button>
                {allGroups.map((g) => (
                  <button key={g} type="button" onClick={() => setGroupFilter(g)} style={{ ...pill(groupFilter === g), padding: '7px 12px', fontSize: 12 }}>
                    {g}
                  </button>
                ))}
              </div>
            )}

            <p style={{ margin: '16px 0 0', fontSize: 13, fontWeight: 800, color: 'rgba(236,230,250,.55)' }}>
              {visibleQuestions.length} question{visibleQuestions.length === 1 ? '' : 's'}
              {visibleQuestions.length !== questions.length ? ` of ${questions.length}` : ''} in {selectedSet.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {visibleQuestions.map((q) => {
                const open = openId === q.id
                const picked = builderIds.has(q.id!)
                return (
                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px', borderRadius: 20, border: `1px solid ${open ? '#2fe0b5' : 'rgba(255,255,255,.1)'}`, background: 'rgba(255,255,255,.04)', transition: 'border-color .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : q.id!)}
                        style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', padding: 0, border: 'none', background: 'transparent', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <span aria-label={`Level ${q.difficulty}`} style={{ display: 'flex', gap: 3, color: '#ffd84d', fontSize: 12, letterSpacing: 1 }}>
                          {'●'.repeat(q.difficulty)}
                          {'○'.repeat(5 - q.difficulty)}
                        </span>
                        <span style={{ flex: '1 1 220px', minWidth: 0, fontWeight: 800, fontSize: 16, overflowWrap: 'anywhere' }}>{q.text}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(236,230,250,.5)', whiteSpace: 'nowrap' }}>{q.reference || q.category}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBuilderItem(q.id!)}
                        title={picked ? 'Remove from quiz' : 'Add to quiz'}
                        aria-label={picked ? 'Remove from quiz' : 'Add to quiz'}
                        style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: picked ? 'none' : '1px solid rgba(255,255,255,.2)', background: picked ? '#2fe0b5' : 'transparent', color: picked ? '#03231b' : '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                      >
                        {picked ? '✓' : '+'}
                      </button>
                    </div>
                    {open && (
                      <>
                        <span style={{ display: 'block', padding: '10px 14px', borderRadius: 12, background: 'rgba(47,224,181,.12)', color: '#5cf0c8', fontWeight: 800, fontSize: 14 }}>Answer: {q.options[q.correctIndex]}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                          <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(193,59,255,.16)', color: '#e0a8ff', fontWeight: 700 }}>{q.category}</span>
                          {q.reference && <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.06)', color: 'rgba(236,230,250,.7)', fontWeight: 700 }}>📖 {q.reference}</span>}
                          {q.groups?.map((g) => (
                            <span key={g} style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(47,224,181,.12)', color: '#5cf0c8', fontWeight: 700 }}>
                              {g}
                            </span>
                          ))}
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'rgba(236,230,250,.6)' }}>Options: {q.options.join(' · ')}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => startEdit(q)} style={{ ...btn(false), padding: '8px 14px', fontSize: 12 }}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteQuestion(q.id!)} style={{ ...btn(false), padding: '8px 14px', fontSize: 12, color: '#ff8a96', borderColor: 'rgba(255,138,150,.4)' }}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
              {visibleQuestions.length === 0 && (
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(236,230,250,.5)' }}>
                  {search.trim() ? `No questions match "${search.trim()}".` : groupFilter ? `No questions in "${groupFilter}" yet.` : level ? `No level ${level} questions in this set.` : 'No questions yet. Add one above.'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {builderItems.length > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, padding: 12, background: 'rgba(13,6,24,.92)', borderTop: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, background: '#2fe0b5', color: '#03231b', fontWeight: 800, fontSize: 13 }}>{builderItems.length} picked</span>
            <input value={buildingQuizName} onChange={(e) => setBuildingQuizName(e.target.value)} placeholder="New quiz name, e.g. Christmas Special" className="pb-field" style={{ ...field, flex: '1 1 200px', minWidth: 0, padding: '10px 16px', fontSize: 14 }} onKeyDown={(e) => e.key === 'Enter' && handleCreateQuizFromBuilder()} />
            <button type="button" onClick={handleCreateQuizFromBuilder} disabled={!buildingQuizName.trim() || buildingQuiz} style={{ ...btn(true), opacity: !buildingQuizName.trim() || buildingQuiz ? 0.4 : 1 }}>
              {buildingQuiz ? 'Creating…' : 'Create quiz'}
            </button>
            <button type="button" onClick={clearBuilder} style={btn(false)}>
              Clear
            </button>
          </div>
        </div>
      )}
    </PublicShell>
  )
}
