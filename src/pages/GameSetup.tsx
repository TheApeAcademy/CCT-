import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Camera, Hash, ImageOff, ListChecks, Phone, Repeat, Route, Shuffle, Split, Swords, Users, X, type LucideIcon } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeedData, ensureActiveSeason, createMatch } from '../db/db'
import { playClick, playToggle, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { selectQuestionsForGame } from '../lib/selectQuestions'
import { buildLadder, DEFAULT_QUESTION_COUNT, MIN_QUESTION_COUNT, MAX_QUESTION_COUNT } from '../lib/ladder'
import { fileToResizedDataUrl } from '../lib/image'
import type { GameConfig, Question } from '../db/types'
import QuizStage from '../components/quizshow/QuizStage'
import { card, display, eyebrow, goldBtn, teamColour } from '../components/quizshow/kit'

const TIMER_OPTIONS = [15, 20, 30, 45, 60]
const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20]
const MAX_TEAMS = 10

const emptyQuestionForm = {
  text: '',
  category: '',
  difficulty: 1 as 1 | 2 | 3 | 4 | 5,
  options: ['', '', '', ''] as [string, string, string, string],
  correctIndex: 0 as 0 | 1 | 2 | 3,
  funFact: '',
}


export default function GameSetup() {
  const navigate = useNavigate()
  useEffect(() => {
    ensureSeedData()
  }, [])

  const seasons = useLiveQuery(() => db.seasons.orderBy('createdAt').reverse().toArray(), []) ?? []
  const allSets = useLiveQuery(() => db.questionSets.toArray(), []) ?? []
  const recentPlayers = useLiveQuery(() => db.players.orderBy('createdAt').reverse().limit(10).toArray(), []) ?? []

  const [teamNames, setTeamNames] = useState<string[]>([''])
  const [teamPhotos, setTeamPhotos] = useState<(string | undefined)[]>([undefined])

  // Linking a team to a registered Student Code is entirely opt-in — the
  // Supabase-dependent ministry module only ever loads if the operator
  // taps into this, so a kid running a fully offline quiz never fetches it.
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkChecking, setLinkChecking] = useState(false)
  const [linkAuthorized, setLinkAuthorized] = useState<boolean | null>(null)
  const [studentCodes, setStudentCodes] = useState<string[]>([''])
  const [linkedStudents, setLinkedStudents] = useState<({ id: string; full_name: string; class_id: string | null } | undefined)[]>([undefined])
  const [linkErrors, setLinkErrors] = useState<(string | undefined)[]>([undefined])
  const [linkBusyIndex, setLinkBusyIndex] = useState<number | null>(null)
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all')
  // A quiz can pull from any number of question sets at once - the first
  // one ticked doubles as the "primary" set older code (and the quick-add
  // panel's default target) expects.
  const [setIds, setSetIds] = useState<number[]>([])
  const setId = setIds[0] ?? null
  const setIdsKey = setIds.join(',')
  const [quickTargetSetId, setQuickTargetSetId] = useState<number | null>(null)
  const [mode, setMode] = useState<'marathon' | 'rotational'>('marathon')
  // 1 v 1 is rotational play with two teams; remembered apart so the tile
  // the host tapped stays lit.
  const [headToHead, setHeadToHead] = useState(false)
  const [questionMode, setQuestionMode] = useState<'random' | 'selected' | 'pickNumber'>('random')
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_QUESTION_COUNT)
  const [customQuestionCount, setCustomQuestionCount] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set())
  const seededSetIdRef = useRef<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [customTimer, setCustomTimer] = useState('')
  const [fiftyFifty, setFiftyFifty] = useState(true)
  const [askChurch, setAskChurch] = useState(true)
  const [phoneFriend, setPhoneFriend] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    ensureActiveSeason().then((season) => setSeasonFilter((v) => (v === 'all' ? season.id! : v)))
  }, [])

  const sets = useMemo(
    () => (seasonFilter === 'all' ? allSets : allSets.filter((s) => s.seasonId === seasonFilter)),
    [allSets, seasonFilter]
  )

  // Drop any ticked set that's no longer visible (e.g. the season filter
  // changed), and default to the first set when nothing is ticked yet. (A
  // set that isn't in allSets at all yet - one just created by "write
  // custom questions" that the live query hasn't picked up - is kept.)
  useEffect(() => {
    const visible = setIds.filter((id) => sets.some((s) => s.id === id) || !allSets.some((s) => s.id === id))
    if (visible.length === 0 && sets.length > 0) setSetIds([sets[0].id!])
    else if (visible.length !== setIds.length) setSetIds(visible)
  }, [sets, allSets, setIds])

  const questionCount = useLiveQuery(
    () => (setIds.length ? db.questions.where('setId').anyOf(setIds).count() : Promise.resolve(0)),
    [setIdsKey]
  ) ?? 0

  // The actual question rows for "Selected"/"Pick a Number" mode's picker
  // below - sorted by difficulty so the default pre-check (and the order
  // questions appear in the list) already reads as an escalating ladder.
  const setQuestions = useLiveQuery(
    () =>
      setIds.length
        ? db.questions
            .where('setId')
            .anyOf(setIds)
            .toArray()
            .then((qs) => qs.sort((a, b) => a.difficulty - b.difficulty || a.id! - b.id!))
        : Promise.resolve<Question[]>([]),
    [setIdsKey]
  ) ?? []

  // First time a non-random mode becomes active for a given combination of sets, pre-check
  // the first N by difficulty as a sane starting point - after that, every
  // toggle is left exactly as the teacher set it, even if they uncheck down
  // to zero, so their choices are never silently overwritten.
  useEffect(() => {
    if (questionMode === 'random' || !setIdsKey || setQuestions.length === 0) return
    if (seededSetIdRef.current === setIdsKey) return
    seededSetIdRef.current = setIdsKey
    setSelectedQuestionIds(new Set(setQuestions.slice(0, totalQuestions).map((q) => q.id!)))
    // totalQuestions deliberately excluded - this only seeds once per set, a
    // later change to the count is left for "First N by difficulty" or the
    // checkboxes below to pick up, same as any other manual toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIdsKey, questionMode, setQuestions])

  const setNameById = useMemo(() => new Map(allSets.map((s) => [s.id!, s.name])), [allSets])

  const toggleQuestionSelection = (id: number) => {
    playClick()
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Picking "+ Write custom questions" creates a real (empty) set right
  // away and switches straight to it - from that point it's just a normal
  // set, so every question typed into the quick-add form below lands in
  // the real Question Bank exactly like any other set's questions do.
  const createCustomSet = async () => {
    playClick()
    const season = await ensureActiveSeason()
    const name = `Custom Quiz - ${new Date().toLocaleDateString()}`
    const newId = (await db.questionSets.add({ name, createdAt: Date.now(), isStarter: false, seasonId: season.id })) as number
    setSetIds((prev) => [...prev, newId])
    setQuickTargetSetId(newId)
    setShowQuickAdd(true)
  }

  const toggleSet = (id: number) => {
    playClick()
    setSetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Where the quick-add form writes to: the set picked in its own dropdown,
  // falling back to the first ticked set.
  const quickAddSetId = quickTargetSetId && setIds.includes(quickTargetSetId) ? quickTargetSetId : setId

  // ---------- quick "add a question" panel, right here on the game setup page ----------
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickForm, setQuickForm] = useState(emptyQuestionForm)
  const [quickError, setQuickError] = useState('')
  const [quickSaved, setQuickSaved] = useState(false)

  const handleQuickAddQuestion = async () => {
    if (!quickAddSetId) return
    if (!quickForm.text.trim()) return setQuickError('Question text is required.')
    if (quickForm.options.some((o) => !o.trim())) return setQuickError('All four options are required.')
    await db.questions.add({
      setId: quickAddSetId,
      category: quickForm.category.trim() || 'General',
      difficulty: quickForm.difficulty,
      text: quickForm.text.trim(),
      options: quickForm.options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex: quickForm.correctIndex,
      funFact: quickForm.funFact.trim() || undefined,
    })
    setQuickForm(emptyQuestionForm)
    setQuickError('')
    setQuickSaved(true)
    playClick()
    haptics.success()
    window.setTimeout(() => setQuickSaved(false), 1800)
  }

  // ---------- contestant photos ----------
  const handlePhotoPick = async (index: number, file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setTeamPhotos((prev) => {
        const next = [...prev]
        next[index] = dataUrl
        return next
      })
      haptics.tap()
    } catch {
      setError('Could not use that photo. Try a different image.')
    }
  }

  const removePhoto = (index: number) => {
    setTeamPhotos((prev) => {
      const next = [...prev]
      next[index] = undefined
      return next
    })
  }

  const updateTeamName = (index: number, value: string) => {
    setTeamNames((prev) => prev.map((n, i) => (i === index ? value.toUpperCase() : n)))
  }

  const addTeamSlot = (prefill?: string) => {
    if (teamNames.length >= MAX_TEAMS) return
    setTeamNames((prev) => [...prev, prefill ?? ''])
    setTeamPhotos((prev) => [...prev, undefined])
    setStudentCodes((prev) => [...prev, ''])
    setLinkedStudents((prev) => [...prev, undefined])
    setLinkErrors((prev) => [...prev, undefined])
    playClick()
  }

  const removeTeamSlot = (index: number) => {
    setTeamNames((prev) => prev.filter((_, i) => i !== index))
    setTeamPhotos((prev) => prev.filter((_, i) => i !== index))
    setStudentCodes((prev) => prev.filter((_, i) => i !== index))
    setLinkedStudents((prev) => prev.filter((_, i) => i !== index))
    setLinkErrors((prev) => prev.filter((_, i) => i !== index))
    haptics.tap()
  }

  const openLinking = async () => {
    setLinkOpen(true)
    if (linkAuthorized !== null) return
    setLinkChecking(true)
    try {
      const { getMyProfile } = await import('../lib/supabase')
      const profile = await getMyProfile()
      setLinkAuthorized(profile?.role === 'teacher' || profile?.role === 'admin')
    } catch {
      setLinkAuthorized(false)
    } finally {
      setLinkChecking(false)
    }
  }

  const linkTeamByCode = async (index: number) => {
    const code = studentCodes[index]?.trim()
    if (!code) return
    setLinkBusyIndex(index)
    setLinkErrors((prev) => prev.map((e, i) => (i === index ? undefined : e)))
    try {
      const { findStudentByCode } = await import('../lib/ministry')
      const result = await findStudentByCode(code)
      if (!result) {
        setLinkErrors((prev) => prev.map((e, i) => (i === index ? "Couldn't find that Student Code." : e)))
        return
      }
      setLinkedStudents((prev) => prev.map((s, i) => (i === index ? result : s)))
      haptics.success()
      playClick()
    } catch (e) {
      setLinkErrors((prev) => prev.map((err, i) => (i === index ? (e instanceof Error ? e.message : "Couldn't check that code.") : err)))
    } finally {
      setLinkBusyIndex(null)
    }
  }

  const quickAddPlayer = (name: string) => {
    const emptyIndex = teamNames.findIndex((n) => !n.trim())
    if (emptyIndex >= 0) {
      updateTeamName(emptyIndex, name)
    } else {
      addTeamSlot(name)
    }
    playClick()
  }

  const [errorShake, setErrorShake] = useState(false)
  const shakeError = () => {
    haptics.error()
    setErrorShake(true)
    window.setTimeout(() => setErrorShake(false), 500)
  }

  const handleStart = async () => {
    const cleanTeams = teamNames.map((n) => n.trim()).filter(Boolean)
    if (cleanTeams.length === 0) {
      setError('Enter at least one team or player name.')
      return shakeError()
    }
    if (!setId) {
      setError('Please choose at least one question set.')
      return shakeError()
    }
    if (questionMode === 'random' && questionCount < totalQuestions) {
      setError(
        `You asked for ${totalQuestions} questions but the chosen set${setIds.length === 1 ? ' has' : 's have'} only ${questionCount}. Pick a smaller number, tick more sets, or add questions in the Question Bank.`
      )
      return shakeError()
    }
    if (questionMode !== 'random' && selectedQuestionIds.size === 0) {
      setError('Tick at least one question below.')
      return shakeError()
    }

    const chosenSets = setIds.map((id) => allSets.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
    const selectedSet = chosenSets[0]
    const setName = chosenSets.map((s) => s.name).join(' + ')
    const season = seasons.find((s) => s.id === selectedSet.seasonId)
    playNav()
    haptics.success()
    setStarting(true)

    const pool = await db.questions.where('setId').anyOf(setIds).toArray()
    // "random" draws one question per level at random, matched to that
    // level's target difficulty (the original behavior). "selected" and
    // "pickNumber" instead use exactly the questions the teacher checked
    // off in the picker below, in difficulty order, no shuffling at all -
    // deliberate, level by level.
    const questionIds =
      questionMode === 'random'
        ? selectQuestionsForGame(pool, buildLadder(totalQuestions)).map((q) => q.id!)
        : pool
            .filter((q) => selectedQuestionIds.has(q.id!))
            .sort((a, b) => a.difficulty - b.difficulty || (a.id! - b.id!))
            .map((q) => q.id!)

    // Photos and student links are aligned to the original team slots; keep only the ones for teams that ended up with a name.
    const keptIndexes = teamNames.map((n, i) => (n.trim() ? i : -1)).filter((i) => i >= 0)
    const cleanPhotos = keptIndexes.map((i) => teamPhotos[i])
    const cleanStudentIds = keptIndexes.map((i) => linkedStudents[i]?.id)
    const cleanStudentClassIds = keptIndexes.map((i) => linkedStudents[i]?.class_id ?? undefined)

    const lifelines = { fiftyFifty, askChurch, phoneFriend }
    const matchId = await createMatch({
      setId,
      setIds,
      setName,
      seasonId: selectedSet.seasonId,
      seasonName: season?.name,
      questionIds,
      timerSecondsPerQuestion: timerSeconds,
      lifelines,
      teamNames: cleanTeams,
      teamPhotos: cleanPhotos,
      teamStudentIds: cleanStudentIds,
      teamStudentClassIds: cleanStudentClassIds,
      mode,
      questionMode,
    })

    const config: GameConfig = {
      matchId,
      teamNames: cleanTeams,
      teamPhotos: cleanPhotos,
      teamStudentIds: cleanStudentIds,
      teamStudentClassIds: cleanStudentClassIds,
      teamIndex: 0,
      setId,
      setName,
      seasonName: season?.name,
      timerSecondsPerQuestion: timerSeconds,
      lifelines,
      mode,
      questionMode,
    }
    navigate('/ground-rules', { state: config })
  }

  const named = teamNames.filter((n) => n.trim()).length
  const turnPick: 'marathon' | 'rotational' | '1v1' = mode === 'marathon' ? 'marathon' : headToHead ? '1v1' : 'rotational'
  const tile = (on: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    padding: '14px 12px',
    borderRadius: 16,
    border: `2px solid ${on ? '#ffd84d' : 'rgba(255,255,255,.1)'}`,
    background: on ? 'rgba(255,216,77,.1)' : 'transparent',
    color: '#fff',
    fontFamily: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all .2s',
  })
  const chip = (on: boolean): CSSProperties => ({
    padding: '9px 14px',
    borderRadius: 999,
    border: `1px solid ${on ? '#ffd84d' : 'rgba(255,255,255,.14)'}`,
    background: on ? 'rgba(255,216,77,.14)' : 'transparent',
    color: on ? '#ffd84d' : '#fff',
    fontFamily: 'inherit',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })
  const small: CSSProperties = { margin: '10px 0 0', fontSize: 12, lineHeight: 1.45, color: 'rgba(236,230,250,.6)' }
  const dashed: CSSProperties = { padding: '10px 16px', borderRadius: 12, border: '1px dashed rgba(255,255,255,.25)', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', textAlign: 'center' }

  const QMODES: ['random' | 'selected' | 'pickNumber', string, string, LucideIcon][] = [
    ['random', 'Random', 'A question per level, matched to its difficulty', Shuffle],
    ['selected', 'Selected', 'You tick the questions, in order', ListChecks],
    ['pickNumber', 'Pick a number', 'Teams choose a number off the board', Hash],
  ]
  const TURNS: ['marathon' | 'rotational' | '1v1', string, string, LucideIcon][] = [
    ['marathon', 'Marathon', 'Each team plays the whole ladder in turn', Route],
    ['rotational', 'Rotational', 'Teams take turns each question', Repeat],
    ['1v1', '1 v 1', 'Two teams head to head', Swords],
  ]
  const LIFE: [string, string, LucideIcon, boolean, (v: boolean) => void][] = [
    ['50 / 50', 'Removes two wrong answers', Split, fiftyFifty, setFiftyFifty],
    ['Ask the Church', 'See how everyone would answer', Users, askChurch, setAskChurch],
    ['Ask a Friend', 'Get a hint from a friend', Phone, phoneFriend, setPhoneFriend],
  ]

  return (
    <QuizStage step="setup">
      <div style={{ animation: 'qs-up .5s both' }}>
        <h1 style={{ margin: '10px 0 0', fontFamily: display, fontWeight: 800, fontSize: 'clamp(40px,6vw,76px)', lineHeight: 0.92, letterSpacing: '-.045em', color: '#fff' }}>Set up the quiz</h1>
        <p style={{ margin: '12px 0 0', fontSize: 17, maxWidth: 560 }}>Choose how questions are picked, how teams take turns, and which lifelines are allowed.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 18, marginTop: 28 }}>
          {/* Teams */}
          <div style={card}>
            <p style={eyebrow}>TEAMS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {teamNames.map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flexShrink: 0, width: 14, height: 40, borderRadius: 6, background: teamColour(i) }} />
                  <label title="Add a contestant photo" style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
                    {teamPhotos[i] ? (
                      <img src={teamPhotos[i]} alt="" style={{ display: 'block', width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${teamColour(i)}` }} />
                    ) : (
                      <span style={{ width: 40, height: 40, borderRadius: '50%', border: '1px dashed rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(236,230,250,.6)' }}>
                        <Camera style={{ width: 16, height: 16 }} />
                      </span>
                    )}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handlePhotoPick(i, e.target.files?.[0])} />
                  </label>
                  <input
                    className="qs-field"
                    value={name}
                    onChange={(e) => updateTeamName(i, e.target.value)}
                    placeholder={i === 0 ? 'e.g. JOY CLASS' : `Team ${i + 1}`}
                    style={{ flex: 1, fontSize: 16 }}
                    aria-label={`Team ${i + 1} name`}
                  />
                  {teamPhotos[i] && (
                    <button type="button" onClick={() => removePhoto(i)} title="Remove photo" aria-label="Remove photo" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageOff style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => teamNames.length > 1 && removeTeamSlot(i)}
                    aria-label="Remove team"
                    style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: '#fff', cursor: teamNames.length > 1 ? 'pointer' : 'default', opacity: teamNames.length > 1 ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addTeamSlot()} disabled={teamNames.length >= MAX_TEAMS} style={{ ...dashed, alignSelf: 'flex-start', opacity: teamNames.length < MAX_TEAMS ? 1 : 0.3 }}>
                + Add team
              </button>
            </div>

            {recentPlayers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {recentPlayers.map((p) => (
                  <button key={p.id} type="button" onClick={() => quickAddPlayer(p.name)} style={{ ...chip(false), padding: '6px 11px', fontSize: 12 }}>
                    + {p.name}
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.08)' }}>
              {!linkOpen ? (
                <button type="button" onClick={openLinking} style={{ padding: 0, border: 'none', background: 'none', color: 'rgba(236,230,250,.6)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
                  Counting this for the ministry leaderboard? Link teams to Student Codes (optional)
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={eyebrow}>LEADERBOARD LINKS</p>
                  {linkChecking && <p style={small}>Checking…</p>}
                  {!linkChecking && linkAuthorized === false && <p style={small}>Sign in as a teacher or admin to link teams to the leaderboard. Matches still work fine without it.</p>}
                  {!linkChecking && linkAuthorized === true && (
                    <>
                      <p style={{ ...small, margin: 0 }}>Match each team to their Student Code. Results save on this device either way; this just makes them count toward the leaderboard.</p>
                      {teamNames.map(
                        (name, i) =>
                          name.trim() && (
                            <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 96, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800, color: teamColour(i) }}>{name}</span>
                              {linkedStudents[i] ? (
                                <span style={{ flex: 1, padding: '9px 12px', borderRadius: 12, background: 'rgba(47,224,181,.14)', color: '#5cf0c8', fontSize: 13, fontWeight: 700 }}>Linked to {linkedStudents[i]!.full_name}</span>
                              ) : (
                                <>
                                  <input
                                    className="qs-field"
                                    value={studentCodes[i] ?? ''}
                                    onChange={(e) => setStudentCodes((prev) => prev.map((c, idx) => (idx === i ? e.target.value.toUpperCase() : c)))}
                                    placeholder="MFM4827"
                                    style={{ flex: 1, width: 'auto', padding: '9px 12px', fontSize: 14 }}
                                    onKeyDown={(e) => e.key === 'Enter' && linkTeamByCode(i)}
                                  />
                                  <button type="button" onClick={() => linkTeamByCode(i)} disabled={linkBusyIndex === i} style={chip(false)}>
                                    {linkBusyIndex === i ? '…' : 'Link'}
                                  </button>
                                </>
                              )}
                              {linkErrors[i] && <span style={{ width: '100%', fontSize: 12, color: '#ff8a96' }}>{linkErrors[i]}</span>}
                            </div>
                          ),
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Questions and turns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={card}>
              <p style={eyebrow}>QUESTIONS</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 14 }}>
                {QMODES.map(([id, label, sub, Icon]) => {
                  const on = questionMode === id
                  return (
                    <button key={id} type="button" style={tile(on)} onClick={() => { setQuestionMode(id); playClick() }}>
                      <Icon style={{ width: 20, height: 20, color: on ? '#ffd84d' : 'rgba(236,230,250,.6)' }} />
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{label}</span>
                      <span style={{ fontSize: 12, lineHeight: 1.35, color: 'rgba(236,230,250,.6)' }}>{sub}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={card}>
              <p style={eyebrow}>TURNS</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 14 }}>
                {TURNS.map(([id, label, sub, Icon]) => {
                  const on = turnPick === id
                  return (
                    <button
                      key={id}
                      type="button"
                      style={tile(on)}
                      onClick={() => {
                        setMode(id === 'marathon' ? 'marathon' : 'rotational')
                        setHeadToHead(id === '1v1')
                        playClick()
                      }}
                    >
                      <Icon style={{ width: 20, height: 20, color: on ? '#ffd84d' : 'rgba(236,230,250,.6)' }} />
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{label}</span>
                      <span style={{ fontSize: 12, lineHeight: 1.35, color: 'rgba(236,230,250,.6)' }}>{sub}</span>
                    </button>
                  )
                })}
              </div>
              {turnPick === '1v1' && named !== 2 && <p style={{ ...small, color: '#ffd84d' }}>1 v 1 works best with exactly two teams. You have {named}.</p>}
            </div>
          </div>

          {/* Lifelines, timer, start */}
          <div style={card}>
            <p style={eyebrow}>LIFELINES</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
              {LIFE.map(([label, sub, Icon, on, set]) => (
                <button
                  key={label}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => { set(!on); playToggle(!on) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', border: 'none', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'none', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, background: 'rgba(255,216,77,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 18, height: 18, color: '#ffd84d' }} />
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>{label}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'rgba(236,230,250,.6)' }}>{sub}</span>
                  </span>
                  <span style={{ flexShrink: 0, width: 46, height: 26, borderRadius: 999, background: on ? '#13b48c' : 'rgba(255,255,255,.15)', position: 'relative', transition: 'background .25s' }}>
                    <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .25s cubic-bezier(.34,1.56,.64,1)' }} />
                  </span>
                </button>
              ))}
            </div>

            <p style={{ ...eyebrow, marginTop: 18 }}>TIMER</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {TIMER_OPTIONS.map((t) => (
                <button key={t} type="button" style={chip(timerSeconds === t)} onClick={() => { setTimerSeconds(t); playClick() }}>
                  {t}s
                </button>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  className="qs-field"
                  type="number"
                  min={5}
                  max={600}
                  value={customTimer}
                  onChange={(e) => setCustomTimer(e.target.value)}
                  placeholder="Own"
                  aria-label="Seconds per question"
                  style={{ width: 70, padding: '8px 10px', fontSize: 13 }}
                />
                <button
                  type="button"
                  style={chip(!TIMER_OPTIONS.includes(timerSeconds))}
                  onClick={() => {
                    const n = Math.round(Number(customTimer))
                    if (Number.isFinite(n) && n >= 5 && n <= 600) {
                      setTimerSeconds(n)
                      playClick()
                    }
                  }}
                >
                  Set
                </button>
              </span>
            </div>
            <p style={small}>{timerSeconds} seconds for each question.</p>

            {error && <p className={errorShake ? 'animate-screen-shake' : ''} style={{ margin: '16px 0 0', fontSize: 14, fontWeight: 700, color: '#ff8a96' }}>{error}</p>}
            <button type="button" className="qs-gold" onClick={handleStart} disabled={starting} style={{ ...goldBtn, marginTop: 20, width: '100%', padding: 18, opacity: starting ? 0.6 : 1 }}>
              {starting ? 'Starting…' : 'Continue to ground rules →'}
            </button>
          </div>
        </div>

        {/* Where the questions come from */}
        <div style={{ ...card, marginTop: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <p style={eyebrow}>QUESTION SETS</p>
            {seasons.length > 1 && (
              <select
                className="qs-field"
                value={seasonFilter}
                onChange={(e) => {
                  setSeasonFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  playClick()
                }}
                aria-label="Season"
                style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
              >
                <option value="all">All seasons</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isActive ? '(active)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p style={small}>Tick as many as you like. Their questions are mixed together.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,240px),1fr))', gap: 8, marginTop: 12 }}>
            {sets.length === 0 && <p style={small}>No question sets in this season yet.</p>}
            {sets.map((s) => {
              const on = setIds.includes(s.id!)
              return (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, border: `1px solid ${on ? '#ffd84d' : 'rgba(255,255,255,.1)'}`, background: on ? 'rgba(255,216,77,.08)' : 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  <input type="checkbox" checked={on} onChange={() => toggleSet(s.id!)} style={{ width: 16, height: 16, flexShrink: 0, accentColor: '#ffd84d' }} />
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                </label>
              )
            })}
          </div>
          {setIds.length > 0 && (
            <p style={small}>
              {questionCount} question{questionCount === 1 ? '' : 's'} available across {setIds.length} set{setIds.length === 1 ? '' : 's'}.
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={createCustomSet} style={dashed}>
              + Write custom questions for this quiz
            </button>
            {setId && (
              <button type="button" onClick={() => { setShowQuickAdd((v) => !v); playClick() }} style={dashed}>
                {showQuickAdd ? 'Hide the question form' : `Add a question to ${setIds.length > 1 ? 'a chosen set' : 'this set'}`}
              </button>
            )}
          </div>

          {setId && showQuickAdd && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, padding: 16, borderRadius: 18, background: 'rgba(0,0,0,.2)' }}>
              {quickError && <p style={{ margin: 0, fontSize: 13, color: '#ff8a96' }}>{quickError}</p>}
              {quickSaved && <p style={{ margin: 0, fontSize: 13, color: '#5cf0c8' }}>Question added!</p>}
              {setIds.length > 1 && (
                <select className="qs-field" value={quickAddSetId ?? ''} onChange={(e) => setQuickTargetSetId(Number(e.target.value))} style={{ fontSize: 14 }}>
                  {setIds.map((id) => (
                    <option key={id} value={id}>
                      Add to: {setNameById.get(id)}
                    </option>
                  ))}
                </select>
              )}
              <textarea className="qs-field" value={quickForm.text} onChange={(e) => setQuickForm({ ...quickForm, text: e.target.value })} placeholder="Question text" rows={2} style={{ fontSize: 14 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 8 }}>
                <input className="qs-field" value={quickForm.category} onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })} placeholder="Category" style={{ fontSize: 14 }} />
                <select className="qs-field" value={quickForm.difficulty} onChange={(e) => setQuickForm({ ...quickForm, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })} style={{ fontSize: 14 }}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={d}>
                      Level {d}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 8 }}>
                {quickForm.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setQuickForm({ ...quickForm, correctIndex: i as 0 | 1 | 2 | 3 })}
                      title="Mark as the correct answer"
                      style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: 'none', background: quickForm.correctIndex === i ? '#2fe0b5' : 'rgba(255,255,255,.12)', color: quickForm.correctIndex === i ? '#05261d' : '#fff', fontFamily: display, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input
                      className="qs-field"
                      value={opt}
                      onChange={(e) => {
                        const options = [...quickForm.options] as [string, string, string, string]
                        options[i] = e.target.value
                        setQuickForm({ ...quickForm, options })
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      style={{ flex: 1, fontSize: 14 }}
                    />
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleQuickAddQuestion} style={{ ...chip(true), padding: '12px 16px', borderRadius: 14 }}>
                + Add question to "{quickAddSetId ? setNameById.get(quickAddSetId) : ''}"
              </button>
            </div>
          )}

          <p style={{ ...eyebrow, marginTop: 22 }}>HOW MANY QUESTIONS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <button key={n} type="button" style={chip(totalQuestions === n)} onClick={() => { setTotalQuestions(n); setCustomQuestionCount(''); playClick() }}>
                {n}
              </button>
            ))}
            {questionCount > 0 && (
              <button
                type="button"
                style={chip(totalQuestions === questionCount && !QUESTION_COUNT_OPTIONS.includes(questionCount))}
                onClick={() => { setTotalQuestions(questionCount); setCustomQuestionCount(''); playClick() }}
              >
                All ({questionCount})
              </button>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                className="qs-field"
                type="number"
                min={MIN_QUESTION_COUNT}
                max={MAX_QUESTION_COUNT}
                value={customQuestionCount}
                onChange={(e) => setCustomQuestionCount(e.target.value)}
                placeholder="Own"
                aria-label="Number of questions"
                style={{ width: 70, padding: '8px 10px', fontSize: 13 }}
              />
              <button
                type="button"
                style={chip(false)}
                onClick={() => {
                  const n = Math.round(Number(customQuestionCount))
                  if (Number.isFinite(n) && n >= MIN_QUESTION_COUNT && n <= MAX_QUESTION_COUNT) {
                    setTotalQuestions(n)
                    playClick()
                  }
                }}
              >
                Set
              </button>
            </span>
          </div>
          <p style={{ ...small, color: questionMode === 'random' && totalQuestions > questionCount ? '#ff8a96' : small.color }}>
            {questionMode === 'random'
              ? `${totalQuestions} question${totalQuestions === 1 ? '' : 's'} per team${totalQuestions > questionCount ? `, but only ${questionCount} are in the chosen sets` : ''}.`
              : 'In Selected and Pick a number, the quiz is however many questions you tick below.'}
          </p>

          {questionMode !== 'random' && setId && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: selectedQuestionIds.size > 0 ? '#5cf0c8' : '#ffd84d' }}>
                  {selectedQuestionIds.size} of {setQuestions.length} ticked
                </span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button type="button" style={chip(false)} onClick={() => { setSelectedQuestionIds(new Set(setQuestions.slice(0, totalQuestions).map((q) => q.id!))); playClick() }}>
                    First {totalQuestions} by level
                  </button>
                  <button type="button" style={chip(false)} onClick={() => { setSelectedQuestionIds(new Set(setQuestions.map((q) => q.id!))); playClick() }}>
                    All
                  </button>
                  <button type="button" style={chip(false)} onClick={() => { setSelectedQuestionIds(new Set()); playClick() }}>
                    Clear
                  </button>
                </span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 10, borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', padding: 6 }}>
                {setQuestions.map((q) => (
                  <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={selectedQuestionIds.has(q.id!)} onChange={() => toggleQuestionSelection(q.id!)} style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#ffd84d' }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ marginRight: 8, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,216,77,.15)', color: '#ffd84d', fontSize: 11, fontWeight: 800 }}>L{q.difficulty}</span>
                      <span style={{ color: '#fff' }}>{q.text}</span>
                      {setIds.length > 1 && <span style={{ marginLeft: 6, fontSize: 11, color: 'rgba(236,230,250,.45)' }}>· {setNameById.get(q.setId)}</span>}
                    </span>
                  </label>
                ))}
                {setQuestions.length === 0 && <p style={{ ...small, margin: 8 }}>No questions in this set yet. Write some above.</p>}
              </div>
              <Link to="/questions" onClick={() => playClick()} style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 800 }}>
                Open the Question Bank to write more →
              </Link>
            </div>
          )}
        </div>
      </div>
    </QuizStage>
  )
}
