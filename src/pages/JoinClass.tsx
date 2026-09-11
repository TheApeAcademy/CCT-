import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Copy, KeyRound, Phone, Sparkles, User } from 'lucide-react'
import { registerStudent, studentSignInByCode } from '../lib/ministry'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import FloatingArt from '../components/FloatingArt'
import ColorSprinkles from '../components/ColorSprinkles'
// Landing page's playful display face for the big student code / step
// numbers - safe to pull in here since /join is already its own lazy
// route, never loaded by the offline quiz.
import '@fontsource/fredoka/700.css'

type Mode = 'new' | 'returning'

const inputClass =
  'w-full rounded-xl border-2 border-[var(--lp-hairline-strong)] bg-[var(--lp-bg)] px-4 py-3 text-[var(--lp-heading)] outline-none transition-colors focus:border-[var(--hero-accent)]'

export default function JoinClass() {
  const [mode, setMode] = useState<Mode>('new')

  return (
    <div className="relative mx-auto max-w-md space-y-8">
      <ColorSprinkles />
      <div className="text-center">
        <FloatingArt className="mx-auto w-28 sm:w-32">
          <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" className="w-full drop-shadow-xl" />
        </FloatingArt>
        <p className="lp-eyebrow mt-4 justify-center" style={{ ['--card-accent' as string]: 'var(--lp-accent-compete)' }}>
          The Ultimate Bible Quiz Adventure
        </p>
        <h1 className="lp-heading mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Know the Word. Play the Quiz.
          <br />
          Grow in Faith.
        </h1>
      </div>

      <div className="flex gap-1 rounded-xl border-2 border-[var(--lp-hairline-strong)] bg-[var(--lp-bg-panel)] p-1">
        <button
          onClick={() => setMode('new')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
            mode === 'new' ? 'bg-[var(--hero-accent)] text-white shadow-md' : 'text-[var(--lp-muted)] hover:text-[var(--lp-heading)]'
          }`}
        >
          I&apos;m new here
        </button>
        <button
          onClick={() => setMode('returning')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
            mode === 'returning' ? 'bg-[var(--hero-accent)] text-white shadow-md' : 'text-[var(--lp-muted)] hover:text-[var(--lp-heading)]'
          }`}
        >
          I have a Student Code
        </button>
      </div>

      {mode === 'new' ? <NewStudentFlow /> : <ReturningStudentFlow />}

      <p className="mx-auto max-w-sm text-center text-sm italic text-[var(--lp-muted)]">
        &ldquo;Thy word have I hid in mine heart, that I might not sin against thee.&rdquo;
        <span className="mt-1 block not-italic text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--lp-accent-compete)' }}>
          Psalm 119:11
        </span>
      </p>
    </div>
  )
}

// ---------- new student: one question at a time ----------

type Step = 'name' | 'phone' | 'passcode' | 'confirm' | 'generating' | 'code'

const STEP_ORDER: Step[] = ['name', 'phone', 'passcode', 'confirm', 'generating', 'code']

const STEP_ACCENT: Record<Step, string> = {
  name: 'var(--lp-accent-compete)',
  phone: 'var(--lp-accent-training)',
  passcode: 'var(--lp-accent-achievements)',
  confirm: 'var(--lp-accent-leaderboard)',
  generating: 'var(--hero-accent)',
  code: 'var(--lp-accent-class)',
}

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
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lp-bg-panel)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: STEP_ACCENT[step] }}
          />
        </div>
      )}

      {step === 'name' && (
        <StepPanel icon={User} accent={STEP_ACCENT.name} question="What's your name?">
          <input
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && fullName.trim().length >= 2 && advance('phone')}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={() => {
              if (fullName.trim().length < 2) return setError('Please enter your full name.')
              advance('phone')
            }}
            className="lp-btn-solid w-full py-3 text-base"
          >
            Continue
          </button>
        </StepPanel>
      )}

      {step === 'phone' && (
        <StepPanel icon={Phone} accent={STEP_ACCENT.phone} question="Parent or guardian's phone number?" hint="Optional — in case we ever need to reach home.">
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
            <button onClick={() => advance('name')} className="lp-btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={() => advance('passcode')} className="lp-btn-solid flex-1 py-3 text-base">
              {guardianPhone.trim() ? 'Continue' : 'Skip for now'}
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'passcode' && (
        <StepPanel icon={KeyRound} accent={STEP_ACCENT.passcode} question="Choose a 4-digit passcode" hint="You'll use this to sign in next time.">
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
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => advance('phone')} className="lp-btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (passcode.length !== 4) return setError('Your passcode needs to be exactly 4 digits.')
                advance('confirm')
              }}
              className="lp-btn-solid flex-1 py-3 text-base"
            >
              Continue
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'confirm' && (
        <StepPanel icon={KeyRound} accent={STEP_ACCENT.confirm} question="Type your passcode again" hint="Just to make sure you didn't miss a digit.">
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
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => advance('passcode')} className="lp-btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirmPasscode !== passcode) return setError("Those don't match. Try again.")
                submit()
              }}
              className="lp-btn-solid flex-1 py-3 text-base"
            >
              Create My Account
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'generating' && (
        <div className="lp-panel flex flex-col items-center gap-3 p-8 text-center">
          <Sparkles className="h-8 w-8 animate-pulse" strokeWidth={1.5} style={{ color: 'var(--hero-accent)' }} />
          <p className="lp-heading font-display text-lg font-bold">Almost ready&hellip;</p>
          <p className="text-sm text-[var(--lp-muted)]">Setting up your space.</p>
        </div>
      )}

      {step === 'code' && (
        <div className="animate-page-in space-y-4">
          <div className="lp-panel lp-panel-accented space-y-3 p-6 text-center" style={{ ['--card-accent' as string]: STEP_ACCENT.code }}>
            <p className="lp-eyebrow justify-center" style={{ ['--card-accent' as string]: STEP_ACCENT.code }}>
              Your Student Code
            </p>
            <p className="font-display text-4xl font-extrabold tracking-widest" style={{ fontFamily: 'Fredoka, var(--font-display)', color: STEP_ACCENT.code }}>
              {studentCode}
            </p>
            <button onClick={copyCode} className="lp-btn-outline mx-auto flex items-center gap-1.5 px-4 py-2 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
            <p className="text-sm text-[var(--lp-muted)]">
              Keep this safe. You&apos;ll use it, with your passcode, to sign in next time.
            </p>
          </div>
          <button
            onClick={() => {
              playNav()
              navigate('/student')
            }}
            className="lp-btn-solid w-full py-3 text-base"
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
  accent,
  question,
  hint,
  children,
}: {
  icon: typeof User
  accent: string
  question: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="lp-panel lp-panel-accented space-y-3 p-6" style={{ ['--card-accent' as string]: accent }}>
      <span
        className="lp-icon-chip flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ ['--card-accent' as string]: accent, background: 'color-mix(in srgb, ' + accent + ' 16%, transparent)' }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: accent }} />
      </span>
      <div>
        <p className="lp-heading font-display text-lg font-bold">{question}</p>
        {hint && <p className="text-sm text-[var(--lp-muted)]">{hint}</p>}
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
    <div className="lp-panel lp-panel-accented space-y-3 p-6" style={{ ['--card-accent' as string]: 'var(--hero-accent)' }}>
      <label className="block text-sm font-bold text-[var(--lp-heading)]">Your Student Code</label>
      <input
        value={studentCode}
        onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
        placeholder="MFM4827"
        className={`${inputClass} text-center text-xl font-bold tracking-widest`}
      />
      <label className="block text-sm font-bold text-[var(--lp-heading)]">Your passcode</label>
      <input
        value={passcode}
        onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        type="password"
        inputMode="numeric"
        placeholder="• • • •"
        className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button onClick={submit} disabled={submitting} className="lp-btn-solid w-full py-3 text-base">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </div>
  )
}
