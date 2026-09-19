import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Copy, KeyRound, PartyPopper, Phone, Sparkles, User } from 'lucide-react'
import { registerStudent, studentSignInByName } from '../lib/ministry'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { setRememberMe } from '../lib/supabase'
import { getRememberedStudent, saveRememberedStudent, clearRememberedStudent } from '../lib/rememberedStudent'
import FloatingArt from '../components/FloatingArt'
// Landing page's playful display face for the big student code / step
// numbers - safe to pull in here since /join is already its own lazy
// route, never loaded by the offline quiz.

type Mode = 'new' | 'returning'

// One field shape for the whole page (C2). The ring on focus belongs to
// .apple-field in index.css, so a field does not change size when it is
// tapped the way a 2px border swap does.
const inputClass = 'apple-field'

export default function JoinClass() {
  const [mode, setMode] = useState<Mode>('new')

  return (
    <div className="relative mx-auto max-w-md space-y-8">
      {/* The mark, one line of type, and nothing else - which is the whole
          of Apple's own sign-in page. The shell above renders no logo on
          this route, so this is the only one on the screen. */}
      <div className="text-center">
        <FloatingArt className="mx-auto w-28 sm:w-32">
          <img src="/children-ministry-logo-splash.png" alt="MFM Children's Ministry" className="w-full" />
        </FloatingArt>
        <h1 className="lp-heading mt-5 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Know the Word. Play the Quiz. Grow in Faith.
        </h1>
        <p className="mt-2 text-sm text-[var(--lp-muted)]">The Ultimate Bible Quiz Adventure</p>
      </div>

      <div className="apple-segmented" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'new'} onClick={() => setMode('new')} className="apple-segment">
          I&apos;m new here
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'returning'}
          onClick={() => setMode('returning')}
          className="apple-segment"
        >
          I&apos;ve signed up before
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

type Step = 'name' | 'phone' | 'passcode' | 'confirm' | 'generating' | 'done'

const STEP_ORDER: Step[] = ['name', 'phone', 'passcode', 'confirm', 'generating', 'done']

// One accent for the whole sign-up, not a different colour at every step.
// Six accents down one flow made each panel look like a different product.
const ACCENT = 'var(--hero-accent)'

// Kids don't pick a passcode - it's built from their own first name so it's
// easy to remember: first name + "mfm" + three random digits (e.g.
// "joshmfm472"). The passcode IS the account password, so the random part
// has to be long enough that knowing a child's name isn't enough to guess
// their way into their messages and their Ears for You entries. One digit
// meant ten tries; three means a thousand.
/** The stable part of a passcode: the child's first name, lowercased. */
function passcodeBase(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] ?? ''
  return `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'kid'}mfm`
}

function generatePasscode(fullName: string): string {
  return `${passcodeBase(fullName)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
}

function NewStudentFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [fullName, setFullName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [passcodeCopied, setPasscodeCopied] = useState(false)
  const [error, setError] = useState('')

  const progress = ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100

  const advance = (next: Step) => {
    setError('')
    setStep(next)
    playNav()
  }

  const goToPasscode = () => {
    // Only mint a new one if there isn't one yet, or the name it's built
    // from has changed. Regenerating here would hand the child a different
    // passcode from the one they just wrote down, purely because they
    // stepped back a question.
    if (!passcode || !passcode.startsWith(passcodeBase(fullName))) {
      setPasscode(generatePasscode(fullName))
      setConfirmPasscode('')
    }
    advance('passcode')
  }

  const submit = async () => {
    setStep('generating')
    setError('')
    try {
      // The Student Code this returns still exists (teachers use it to add a
      // kid to their class from the roster) - it just isn't shown here
      // anymore. Kids can find it on their profile / ID card once signed in.
      await registerStudent({ full_name: fullName, guardian_phone: guardianPhone || undefined, passcode })
      haptics.success()
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account. Try again.')
      haptics.error()
      setStep('confirm')
    }
  }

  const copyPasscode = async () => {
    try {
      await navigator.clipboard.writeText(passcode)
      setPasscodeCopied(true)
      playClick()
      window.setTimeout(() => setPasscodeCopied(false), 2000)
    } catch {
      // clipboard unavailable — the passcode is already visible on screen
    }
  }

  return (
    <div className="animate-page-in space-y-4">
      {step !== 'generating' && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lp-bg-panel)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: ACCENT }}
          />
        </div>
      )}

      {step === 'name' && (
        <StepPanel icon={User} accent={ACCENT} question="What's your name?">
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
        <StepPanel icon={Phone} accent={ACCENT} question="Parent or guardian's phone number?" hint="Optional, in case we ever need to reach home.">
          <input
            autoFocus
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            placeholder="Optional"
            type="tel"
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && goToPasscode()}
          />
          <div className="flex gap-2">
            <button onClick={() => advance('name')} className="lp-btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={goToPasscode} className="lp-btn-solid flex-1 py-3 text-base">
              {guardianPhone.trim() ? 'Continue' : 'Skip for now'}
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'passcode' && (
        <StepPanel icon={KeyRound} accent={ACCENT} question="Here's your passcode" hint="We made it from your name so it's easy to remember.">
          <div className="apple-field py-5 text-center">
            <p
              className="font-display text-3xl font-extrabold tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: ACCENT }}
            >
              {passcode}
            </p>
          </div>
          <button onClick={copyPasscode} className="lp-btn-outline mx-auto flex items-center gap-1.5 px-4 py-2 text-xs">
            {passcodeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {passcodeCopied ? 'Copied' : 'Copy passcode'}
          </button>
          <p className="text-sm text-[var(--lp-muted)]">
            Copy it or write it down somewhere safe. Even though it&apos;s easy to remember, you&apos;ll need it,
            with your name, to sign in next time.
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => advance('phone')} className="lp-btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={() => advance('confirm')} className="lp-btn-solid flex-1 py-3 text-base">
              I&apos;ve saved it
            </button>
          </div>
        </StepPanel>
      )}

      {step === 'confirm' && (
        <StepPanel icon={KeyRound} accent={ACCENT} question="Type your passcode again" hint="Just to make sure you saved it right.">
          <input
            autoFocus
            value={confirmPasscode}
            onChange={(e) => setConfirmPasscode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type your passcode"
            className={`${inputClass} text-center text-xl tracking-wide`}
            onKeyDown={(e) => e.key === 'Enter' && confirmPasscode && submit()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => advance('passcode')} className="lp-btn-outline px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirmPasscode !== passcode) return setError("That doesn't match. Tap back to see it again.")
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

      {step === 'done' && (
        <div className="animate-page-in space-y-4">
          <div className="lp-panel lp-panel-accented space-y-3 p-6 text-center" style={{ ['--card-accent' as string]: ACCENT }}>
            <PartyPopper className="mx-auto h-10 w-10" style={{ color: ACCENT }} strokeWidth={1.75} />
            <p className="lp-heading font-display text-xl font-bold">You&apos;re all set, {fullName.trim().split(/\s+/)[0]}!</p>
            <p className="text-sm text-[var(--lp-muted)]">
              Your Student Code is waiting on your profile once you&apos;re in, and that&apos;s what you&apos;ll give
              your teacher to get added to your class.
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
  const [fullName, setFullName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberMe, setRememberMeChecked] = useState(true)

  // Prefills from whatever was saved here last time "Remember me" was
  // checked - a kid shouldn't have to retype their passcode on a device
  // they already signed into before.
  useEffect(() => {
    const remembered = getRememberedStudent()
    if (remembered) {
      setFullName(remembered.fullName)
      setPasscode(remembered.passcode)
    }
  }, [])

  const submit = async () => {
    if (!fullName.trim()) return setError('Enter your name.')
    if (!passcode.trim()) return setError('Enter your passcode.')
    setSubmitting(true)
    setError('')
    setRememberMe(rememberMe)
    try {
      await studentSignInByName({ full_name: fullName, passcode })
      if (rememberMe) saveRememberedStudent({ fullName, passcode })
      else clearRememberedStudent()
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
      <label className="block text-sm font-bold text-[var(--lp-heading)]">Your name</label>
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your full name"
        className={inputClass}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <label className="block text-sm font-bold text-[var(--lp-heading)]">Your passcode</label>
      <input
        value={passcode}
        onChange={(e) => setPasscode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
        type="text"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="e.g. joshmfm7"
        className={`${inputClass} text-center text-xl tracking-wide`}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <label className="flex items-center gap-2 text-sm text-[var(--lp-muted)]">
        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMeChecked(e.target.checked)} className="h-4 w-4" />
        Remember me on this device
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button onClick={submit} disabled={submitting} className="lp-btn-solid w-full py-3 text-base">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </div>
  )
}
