import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KeyRound, PartyPopper } from 'lucide-react'
import { getClassByJoinCode, joinClass, studentSignIn, type ClassJoinInfo } from '../lib/ministry'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

type Mode = 'new' | 'returning'

const inputClass =
  'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

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
      <div className="mx-auto max-w-xl space-y-8 text-center">
        <div className="mx-auto w-fit rounded-xl bg-white p-4 shadow-lg shadow-black/30">
          <img src="/ministry-logo-full.png" alt="MFM Children's Ministry" className="h-28 w-auto sm:h-32" />
        </div>

        <div>
          <p className="eyebrow">The Ultimate Bible Quiz Adventure</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Know the Word. Play the Quiz.
            <br />
            Grow in Faith.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ink-muted)]">
            Join other young Bible champions for fun questions, amazing discoveries, and real rewards. Every
            question is a chance to know God's Word a little better and shine a little brighter for Jesus.
          </p>
        </div>

        <div className="panel space-y-3 p-5 text-left">
          <label className="flex items-center gap-2 text-sm font-bold text-white/80">
            <KeyRound className="h-4 w-4 text-[var(--gold)]" />
            Enter your class code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CLASS CODE"
            className={`${inputClass} text-center text-2xl font-bold tracking-widest`}
            onKeyDown={(e) => e.key === 'Enter' && lookup(code)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={() => lookup(code)} disabled={looking} className="btn-solid w-full py-3 text-base">
            {looking ? 'Checking…' : 'Start My Adventure'}
          </button>
          <p className="text-center text-xs text-[var(--ink-faint)]">Ask your Sunday school teacher for your code.</p>
        </div>

        <p className="mx-auto max-w-sm text-sm italic text-[var(--ink-muted)]">
          &ldquo;Thy word have I hid in mine heart, that I might not sin against thee.&rdquo;
          <span className="mt-1 block not-italic text-xs font-bold uppercase tracking-wide text-[var(--gold)]">Psalm 119:11</span>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <PartyPopper className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold">{info.class_name}</h1>
        <p className="text-sm text-[var(--ink-muted)]">with {info.teacher_name}</p>
      </div>

      <div className="flex gap-1 rounded-md border border-[var(--hairline-strong)] p-1">
        <button
          onClick={() => setMode('new')}
          className={`flex-1 rounded px-4 py-2 text-sm font-bold transition ${mode === 'new' ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/70 hover:text-white'}`}
        >
          I&apos;m new here
        </button>
        <button
          onClick={() => setMode('returning')}
          className={`flex-1 rounded px-4 py-2 text-sm font-bold transition ${mode === 'returning' ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/70 hover:text-white'}`}
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
      <div className="panel p-5 text-center text-sm text-[var(--ink-muted)]">
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
    <div className="panel space-y-3 p-5">
      <label className="block text-sm font-bold text-white/80">Which name is yours?</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {info.unclaimed_roster.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setRosterId(r.id)
              playClick()
            }}
            className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
              rosterId === r.id ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]' : 'border-[var(--hairline-strong)] hover:border-white/30'
            }`}
          >
            {r.full_name}
          </button>
        ))}
      </div>
      {rosterId && (
        <div className="animate-page-in space-y-2 pt-2">
          <label className="block text-sm font-bold text-white/80">Pick a PIN (4-6 numbers) so you can sign in again later</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="password"
            inputMode="numeric"
            placeholder="New PIN"
            className={`${inputClass} text-center text-xl tracking-widest`}
          />
          <input
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="password"
            inputMode="numeric"
            placeholder="Confirm PIN"
            className={`${inputClass} text-center text-xl tracking-widest`}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={submit} disabled={submitting || !rosterId} className="btn-solid w-full py-3 text-base">
        {submitting ? 'Joining…' : 'Join the Class'}
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
    return <div className="panel p-5 text-center text-sm text-[var(--ink-muted)]">No one has joined this class yet.</div>
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
    <div className="panel space-y-3 p-5">
      <label className="block text-sm font-bold text-white/80">Which name is yours?</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {info.claimed_roster.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setRosterId(r.id)
              playClick()
            }}
            className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
              rosterId === r.id ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]' : 'border-[var(--hairline-strong)] hover:border-white/30'
            }`}
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
          className={`${inputClass} text-center text-xl tracking-widest`}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={submit} disabled={submitting || !rosterId} className="btn-solid w-full py-3 text-base">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </div>
  )
}
