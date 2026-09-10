import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Copy, KeyRound, Sparkles, User } from 'lucide-react'
import { registerStudent, studentSignInByCode } from '../lib/ministry'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

type Mode = 'new' | 'returning'

const inputClass =
  'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function JoinClass() {
  const [mode, setMode] = useState<Mode>('new')

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="text-center">
        <div className="mx-auto w-fit rounded-xl bg-white p-4 shadow-lg shadow-black/30">
          <img src="/ministry-logo-full.png" alt="MFM Children's Ministry" className="h-24 w-auto sm:h-28" />
        </div>
        <p className="eyebrow mt-4">The Ultimate Bible Quiz Adventure</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Know the Word. Play the Quiz.
          <br />
          Grow in Faith.
        </h1>
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
          I have a Student Code
        </button>
      </div>

      {mode === 'new' ? <NewStudentFlow /> : <ReturningStudentFlow />}

      <p className="mx-auto max-w-sm text-center text-sm italic text-[var(--ink-muted)]">
        &ldquo;Thy word have I hid in mine heart, that I might not sin against thee.&rdquo;
        <span className="mt-1 block not-italic text-xs font-bold uppercase tracking-wide text-[var(--gold)]">Psalm 119:11</span>
      </p>
    </div>
  )
}

// ---------- new student: one question at a time ----------

type Step = 'name' | 'phone' | 'passcode' | 'confirm' | 'generating' | 'code'

const STEP_ORDER: Step[] = ['name', 'phone', 'passcode', 'confirm', 'generating', 'code']

function NewStudentFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [fullName, setFullName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const progress = ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100

  const advance = (next: Step) => {
    setError('')
    setStep(next)
    playNav()
  }

  const submit = async () => {
    setStep('generating')
    setError('')
    try {
      const result = await registerStudent({ full_name: fullName, guardian_phone: guardianPhone || undefined, passcode })
      setStudentCode(result.student_code)
      haptics.success()
      setStep('code')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account. Try again.')
      haptics.error()
      setStep('confirm')
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(studentCode)
      setCopied(true)
      playClick()
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — the code is already visible on screen
    }
  }

  return (
    <div className="animate-page-in space-y-4">
      {step !== 'generating' && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[var(--gold)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      {step === 'name' && (
        <StepPanel icon={User} question="What's your name?">
          <input
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && fullName.trim().length >= 2 && advance('phone')}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={() => {
              if (fullName.trim().length < 2) return setError('Please enter your full name.')
              advance('phone')
            }}
            className="btn-solid w-full py-3 text-base"
          >
            Continue
          </button>
        </StepPanel>
      )}

      {step === 'phone' && (
        <StepPanel icon={User} question="Parent or guardian's phone number?" hint="Optional — in case we ever need to reach home.">
          <input
            autoFocus
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            placeholder="Optional"
            type="tel"
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && advance('passcode')}
          />
          <div className="flex gap-2">
            <button onClick={() => advance('name')} className="btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={() => advance('passcode')} className="btn-solid flex-1 py-3 text-base">
              {guardianPhone.trim() ? 'Continue' : "Skip for now"}
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'passcode' && (
        <StepPanel icon={KeyRound} question="Choose a 4-digit passcode" hint="You'll use this to sign in next time.">
          <input
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            type="password"
            inputMode="numeric"
            placeholder="• • • •"
            className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            onKeyDown={(e) => e.key === 'Enter' && passcode.length === 4 && advance('confirm')}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => advance('phone')} className="btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (passcode.length !== 4) return setError('Your passcode needs to be exactly 4 digits.')
                advance('confirm')
              }}
              className="btn-solid flex-1 py-3 text-base"
            >
              Continue
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'confirm' && (
        <StepPanel icon={KeyRound} question="Type your passcode again" hint="Just to make sure you didn't miss a digit.">
          <input
            autoFocus
            value={confirmPasscode}
            onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            type="password"
            inputMode="numeric"
            placeholder="• • • •"
            className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            onKeyDown={(e) => e.key === 'Enter' && confirmPasscode.length === 4 && submit()}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => advance('passcode')} className="btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirmPasscode !== passcode) return setError("Those don't match. Try again.")
                submit()
              }}
              className="btn-solid flex-1 py-3 text-base"
            >
              Create My Account
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'generating' && (
        <div className="panel flex flex-col items-center gap-3 p-8 text-center">
          <Sparkles className="h-8 w-8 animate-pulse text-[var(--gold)]" strokeWidth={1.5} />
          <p className="font-display text-lg font-bold">Almost ready&hellip;</p>
          <p className="text-sm text-[var(--ink-muted)]">Setting up your space.</p>
        </div>
      )}

      {step === 'code' && (
        <div className="animate-page-in space-y-4">
          <div className="panel space-y-3 p-6 text-center">
            <p className="eyebrow justify-center">Your Student Code</p>
            <p className="font-display text-4xl font-extrabold tracking-widest text-[var(--gold)]">{studentCode}</p>
            <button onClick={copyCode} className="btn-outline mx-auto flex items-center gap-1.5 px-4 py-2 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
            <p className="text-sm text-[var(--ink-muted)]">
              Keep this safe. You&apos;ll use it, with your passcode, to sign in next time.
            </p>
          </div>
          <button
            onClick={() => {
              playNav()
              navigate('/student')
            }}
            className="btn-solid w-full py-3 text-base"
          >
            Welcome! Let&apos;s go
          </button>
        </div>
      )}
    </div>
  )
}

function StepPanel({
  icon: Icon,
  question,
  hint,
  children,
}: {
  icon: typeof User
  question: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="panel space-y-3 p-6">
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-lg font-bold">{question}</p>
        {hint && <p className="text-sm text-[var(--ink-muted)]">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

// ---------- returning student ----------

function ReturningStudentFlow() {
  const navigate = useNavigate()
  const [studentCode, setStudentCode] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!studentCode.trim()) return setError('Enter your Student Code.')
    if (passcode.length !== 4) return setError('Enter your 4-digit passcode.')
    setSubmitting(true)
    setError('')
    try {
      await studentSignInByCode({ student_code: studentCode, passcode })
      playNav()
      haptics.success()
      navigate('/student')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.')
      haptics.error()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel space-y-3 p-6">
      <label className="block text-sm font-bold text-white/80">Your Student Code</label>
      <input
        value={studentCode}
        onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
        placeholder="MFM4827"
        className={`${inputClass} text-center text-xl font-bold tracking-widest`}
      />
      <label className="block text-sm font-bold text-white/80">Your passcode</label>
      <input
        value={passcode}
        onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        type="password"
        inputMode="numeric"
        placeholder="• • • •"
        className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={submit} disabled={submitting} className="btn-solid w-full py-3 text-base">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </div>
  )
}
