import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getClassByJoinCode, joinClass, studentSignIn, type ClassJoinInfo } from '../lib/ministry'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

type Mode = 'new' | 'returning'

export default function JoinClass() {
  const { code: codeParam } = useParams()
  const navigate = useNavigate()

  const [code, setCode] = useState(codeParam ?? '')
  const [info, setInfo] = useState<ClassJoinInfo | null>(null)
  const [error, setError] = useState('')
  const [looking, setLooking] = useState(false)
  const [mode, setMode] = useState<Mode>('new')

  const lookup = async (c: string) => {
    if (!c.trim()) return
    setLooking(true)
    setError('')
    try {
      const result = await getClassByJoinCode(c)
      if (!result) {
        setError("That class code wasn't found. Double check with your teacher.")
        setInfo(null)
      } else {
        setInfo(result)
      }
    } catch {
      setError('Could not check that code. Make sure you have an internet connection.')
    } finally {
      setLooking(false)
    }
  }

  useEffect(() => {
    if (codeParam) lookup(codeParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam])

  if (!info) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <p className="text-4xl">🔑</p>
        <h1 className="font-display text-3xl font-extrabold">Join Your Class</h1>
        <p className="text-white/60">Ask your Sunday school teacher for your class code.</p>
        <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CLASS CODE"
            className="w-full rounded-lg bg-white/10 px-4 py-4 text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && lookup(code)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={() => lookup(code)}
            disabled={looking}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
          >
            {looking ? 'Checking…' : 'Find My Class →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="font-display text-2xl font-extrabold">{info.class_name}</h1>
        <p className="text-white/60">with {info.teacher_name}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('new')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'new' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
        >
          I'm new here
        </button>
        <button
          onClick={() => setMode('returning')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'returning' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
        >
          I already joined
        </button>
      </div>

      {mode === 'new' ? (
        <NewStudentFlow info={info} code={code} onDone={() => navigate('/student')} />
      ) : (
        <ReturningStudentFlow info={info} code={code} onDone={() => navigate('/student')} />
      )}
    </div>
  )
}

function NewStudentFlow({ info, code, onDone }: { info: ClassJoinInfo; code: string; onDone: () => void }) {
  const [rosterId, setRosterId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (info.unclaimed_roster.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center text-sm text-white/60">
        Every name on this class's roster has already joined. Ask your teacher to add your name.
      </div>
    )
  }

  const submit = async () => {
    if (!rosterId) return setError('Pick your name first.')
    if (!/^[0-9]{4,6}$/.test(pin)) return setError('Choose a PIN with 4 to 6 numbers.')
    if (pin !== confirmPin) return setError("PINs don't match.")
    setSubmitting(true)
    setError('')
    try {
      await joinClass({ join_code: code, roster_id: rosterId, pin })
      playNav()
      haptics.success()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join. Try again.')
      haptics.error()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
      <label className="block text-sm font-semibold text-white/80">Which name is yours?</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {info.unclaimed_roster.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setRosterId(r.id)
              playClick()
            }}
            className={`rounded-xl border-2 px-4 py-3 text-left transition ${rosterId === r.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            {r.full_name}
          </button>
        ))}
      </div>
      {rosterId && (
        <div className="animate-page-in space-y-2 pt-2">
          <label className="block text-sm font-semibold text-white/80">Pick a PIN (4-6 numbers) so you can sign in again later</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="password"
            inputMode="numeric"
            placeholder="New PIN"
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="password"
            inputMode="numeric"
            placeholder="Confirm PIN"
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !rosterId}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
      >
        {submitting ? 'Joining…' : 'Join the Class! →'}
      </button>
    </div>
  )
}

function ReturningStudentFlow({ info, code, onDone }: { info: ClassJoinInfo; code: string; onDone: () => void }) {
  const [rosterId, setRosterId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (info.claimed_roster.length === 0) {
    return <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center text-sm text-white/60">No one has joined this class yet.</div>
  }

  const submit = async () => {
    if (!rosterId) return setError('Pick your name first.')
    if (!pin) return setError('Enter your PIN.')
    setSubmitting(true)
    setError('')
    try {
      await studentSignIn({ join_code: code, roster_id: rosterId, pin })
      playNav()
      haptics.success()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.')
      haptics.error()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
      <label className="block text-sm font-semibold text-white/80">Which name is yours?</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {info.claimed_roster.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setRosterId(r.id)
              playClick()
            }}
            className={`rounded-xl border-2 px-4 py-3 text-left transition ${rosterId === r.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            {r.full_name}
          </button>
        ))}
      </div>
      {rosterId && (
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          type="password"
          inputMode="numeric"
          placeholder="Your PIN"
          className="w-full rounded-lg bg-white/10 px-4 py-3 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !rosterId}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign In →'}
      </button>
    </div>
  )
}
