import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, KeyRound, PartyPopper, Phone, Sparkles, User, type LucideIcon } from 'lucide-react'
import { registerStudent, studentSignInByName } from '../lib/ministry'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'
import { setRememberMe } from '../lib/supabase'
import { getRememberedStudent, saveRememberedStudent, clearRememberedStudent } from '../lib/rememberedStudent'
import { clearKidsDashboardState } from '../lib/kidsDashboardState'
import '../design/join.css'

// Join, rebuilt from the Claude Design handoff (Join.dc.html): light,
// Apple-style, one question at a time. The flows and the copy are the same
// as before; only the look and the motion changed.

type Mode = 'new' | 'returning'

const INK = '#160b2a'
const MUTED = 'rgba(22,11,42,.56)'
const DISPLAY = "'Bricolage Grotesque',sans-serif"

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 24,
  borderRadius: 22,
  background: '#fff',
  border: '1px solid rgba(22,11,42,.08)',
  borderTop: '3px solid #c13bff',
  boxShadow: '0 24px 50px -30px rgba(110,40,160,.45)',
}

export default function JoinClass() {
  const [params, setParams] = useSearchParams()
  // ?mode= from the kids sign-in buttons wins; otherwise a child who has
  // signed in on this device before lands on the returning half.
  const [remembered] = useState(() => Boolean(getRememberedStudent()))
  const urlMode = params.get('mode')
  const mode: Mode = urlMode === 'returning' || urlMode === 'new' ? urlMode : remembered ? 'returning' : 'new'
  const setMode = (next: Mode) => setParams({ mode: next }, { replace: true })
  const isNew = mode === 'new'

  return (
    <div
      data-dc-screen="join"
      data-screen-label="Join"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%,rgba(193,59,255,.14),transparent 65%),#f7f3fd',
        color: 'rgba(22,11,42,.78)',
        padding: 'clamp(28px,6vh,64px) 16px 60px',
        boxSizing: 'border-box',
        colorScheme: 'light',
      }}
    >
      <div style={{ maxWidth: 448, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/"
            style={{ display: 'block', width: 'clamp(112px,26vw,128px)', margin: '0 auto', animation: 'join-float 5s ease-in-out infinite' }}
          >
            <img
              src="/children-ministry-logo-splash.png"
              alt="MFM Children's Ministry"
              style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 14px 20px rgba(110,40,160,.25))' }}
            />
          </Link>
          <h1
            style={{
              margin: '20px 0 0',
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 'clamp(24px,5vw,30px)',
              lineHeight: 1.15,
              letterSpacing: '-.02em',
              color: INK,
              textWrap: 'balance',
            }}
          >
            Know the Word. Play the Quiz. Grow in Faith.
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: MUTED }}>The Ultimate Bible Quiz Adventure</p>
        </div>

        <div
          role="tablist"
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: 4,
            borderRadius: 14,
            background: 'rgba(22,11,42,.06)',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: 'calc(50% - 4px)',
              borderRadius: 10,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(22,11,42,.12)',
              transform: `translateX(${isNew ? '0' : '100%'})`,
              transition: 'transform .35s cubic-bezier(.34,1.3,.64,1)',
            }}
          />
          <SegButton active={isNew} onClick={() => setMode('new')}>
            I&apos;m new here
          </SegButton>
          <SegButton active={!isNew} onClick={() => setMode('returning')}>
            I&apos;ve signed up before
          </SegButton>
        </div>

        {isNew ? <NewStudentFlow /> : <ReturningStudentFlow />}

        <p style={{ margin: '0 auto', maxWidth: 384, textAlign: 'center', fontSize: 14, fontStyle: 'italic', color: MUTED }}>
          &ldquo;Thy word have I hid in mine heart, that I might not sin against thee.&rdquo;
          <span
            style={{
              display: 'block',
              marginTop: 4,
              fontStyle: 'normal',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: '#d12a7a',
            }}
          >
            Psalm 119:11
          </span>
        </p>
      </div>
    </div>
  )
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: 11,
        border: 'none',
        background: 'none',
        fontWeight: 800,
        fontSize: 14,
        color: active ? INK : 'rgba(22,11,42,.5)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ---------- new student: one question at a time ----------

type Step = 'name' | 'phone' | 'passcode' | 'confirm' | 'generating' | 'done'

const STEP_ORDER: Step[] = ['name', 'phone', 'passcode', 'confirm', 'generating', 'done']

// Kids don't pick a passcode - it's built from their own first name so it's
// easy to remember: first name + "mfm" + three random digits (e.g.
// "joshmfm472"). The passcode IS the account password, so the random part
// has to be long enough that knowing a child's name isn't enough to guess
// their way into their messages and their Ears for You entries.
/** The stable part of a passcode: the child's first name, lowercased. */
function passcodeBase(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] ?? ''
  return `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'kid'}mfm`
}

function generatePasscode(fullName: string): string {
  return `${passcodeBase(fullName)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
}

const QUESTIONS: Record<'name' | 'phone' | 'passcode' | 'confirm', { icon: LucideIcon; q: string; hint: string }> = {
  name: { icon: User, q: "What's your name?", hint: '' },
  phone: { icon: Phone, q: "Parent or guardian's phone number?", hint: 'Optional, in case we ever need to reach home.' },
  passcode: { icon: KeyRound, q: "Here's your passcode", hint: "We made it from your name so it's easy to remember." },
  confirm: { icon: KeyRound, q: 'Type your passcode again', hint: 'Just to make sure you saved it right.' },
}

const CONFETTI_COLS = ['#ffc93c', '#ff4fa3', '#4f7bff', '#2fe0b5', '#c13bff', '#ff8a3d']
const CONFETTI = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2
  const d = 150 + ((i * 37) % 160)
  return {
    dx: Math.round(Math.cos(a) * d),
    dy: Math.round(Math.sin(a) * d - 70),
    s: 8 + (i % 5),
    h: 10 + (i % 9),
    col: CONFETTI_COLS[i % 6],
  }
})

function NewStudentFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [fullName, setFullName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [passcodeCopied, setPasscodeCopied] = useState(false)
  const [error, setError] = useState('')
  const [errN, setErrN] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const confettiTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(confettiTimer.current), [])

  const progress = Math.round(((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100)

  const fail = (msg: string) => {
    setError(msg)
    setErrN((n) => n + 1)
    haptics.error()
  }

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
      // kid to their class from the roster) - it just isn't shown here.
      // Kids find it on their profile / ID card once signed in.
      await registerStudent({ full_name: fullName, guardian_phone: guardianPhone || undefined, passcode })
      haptics.success()
      setStep('done')
      setConfetti(true)
      confettiTimer.current = window.setTimeout(() => setConfetti(false), 1500)
    } catch (e) {
      setStep('confirm')
      fail(e instanceof Error ? e.message : 'Could not create your account. Try again.')
    }
  }

  const next = () => {
    if (step === 'name') {
      if (fullName.trim().length < 2) return fail('Please enter your full name.')
      return advance('phone')
    }
    if (step === 'phone') return goToPasscode()
    if (step === 'passcode') return advance('confirm')
    if (step === 'confirm') {
      if (confirmPasscode !== passcode) return fail("That doesn't match. Tap back to see it again.")
      void submit()
    }
  }

  const prev: Partial<Record<Step, Step>> = { phone: 'name', passcode: 'phone', confirm: 'passcode' }
  const back = prev[step]

  const copyPasscode = async () => {
    try {
      await navigator.clipboard.writeText(passcode)
      setPasscodeCopied(true)
      playClick()
      window.setTimeout(() => setPasscodeCopied(false), 2000)
    } catch {
      // clipboard unavailable - the passcode is already visible on screen
    }
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') next()
  }

  const nextLabel =
    step === 'phone'
      ? guardianPhone.trim()
        ? 'Continue'
        : 'Skip for now'
      : step === 'passcode'
        ? "I've saved it"
        : step === 'confirm'
          ? 'Create My Account'
          : 'Continue'

  const isStepPanel = step === 'name' || step === 'phone' || step === 'passcode' || step === 'confirm'
  const Q = isStepPanel ? QUESTIONS[step] : null
  const StepIcon = Q?.icon ?? User

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {step !== 'generating' && (
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(22,11,42,.07)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg,#c13bff,#8a1fb0)',
              transition: 'width .5s cubic-bezier(.34,1.2,.64,1)',
            }}
          />
        </div>
      )}

      {isStepPanel && Q && (
        <div
          key={`${step}-${errN}`}
          style={{ ...card, animation: error ? 'join-shake .4s' : 'join-pageIn .4s cubic-bezier(.2,.9,.2,1) both' }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(193,59,255,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'join-pop .45s both',
            }}
          >
            <StepIcon aria-hidden style={{ width: 20, height: 20, color: '#8a1fb0' }} />
          </span>
          <div>
            <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 19, color: INK }}>{Q.q}</p>
            {Q.hint && <p style={{ margin: '2px 0 0', fontSize: 14, color: MUTED }}>{Q.hint}</p>}
          </div>

          {step === 'name' && (
            <input
              autoFocus
              className="join-field"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setError('')
              }}
              onKeyDown={onEnter}
              placeholder="Your full name"
            />
          )}
          {step === 'phone' && (
            <input
              autoFocus
              className="join-field"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              onKeyDown={onEnter}
              type="tel"
              placeholder="Optional"
            />
          )}
          {step === 'passcode' && (
            <>
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: '#f4f0fa',
                  boxShadow: 'inset 0 0 0 1px rgba(22,11,42,.1)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: DISPLAY,
                    fontWeight: 800,
                    fontSize: 30,
                    letterSpacing: '.12em',
                    color: '#8a1fb0',
                    animation: 'join-pop .5s both',
                    userSelect: 'text',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {passcode}
                </p>
              </div>
              <button
                type="button"
                onClick={copyPasscode}
                style={{
                  alignSelf: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(22,11,42,.16)',
                  background: '#fff',
                  color: INK,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {passcodeCopied ? (
                  <Check aria-hidden style={{ width: 14, height: 14 }} />
                ) : (
                  <Copy aria-hidden style={{ width: 14, height: 14 }} />
                )}
                {passcodeCopied ? 'Copied' : 'Copy passcode'}
              </button>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: MUTED }}>
                Copy it or write it down somewhere safe. Even though it&apos;s easy to remember, you&apos;ll need it,
                with your name, to sign in next time.
              </p>
            </>
          )}
          {step === 'confirm' && (
            <input
              autoFocus
              className="join-field join-field-code"
              value={confirmPasscode}
              onChange={(e) => {
                setConfirmPasscode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
                setError('')
              }}
              onKeyDown={onEnter}
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Type your passcode"
            />
          )}

          {error && <p style={{ margin: 0, fontSize: 14, color: '#d6334a' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            {back && (
              <button
                type="button"
                onClick={() => advance(back)}
                aria-label="Back"
                style={{
                  padding: '0 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(22,11,42,.16)',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowLeft aria-hidden style={{ width: 16, height: 16, color: INK }} />
              </button>
            )}
            <button type="button" onClick={next} className="join-cta" style={{ flex: 1 }}>
              {nextLabel}
            </button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: 32,
            borderRadius: 22,
            background: '#fff',
            border: '1px solid rgba(22,11,42,.08)',
            textAlign: 'center',
          }}
        >
          <Sparkles aria-hidden style={{ width: 32, height: 32, color: '#c13bff', animation: 'join-pulse 1.2s ease-in-out infinite' }} />
          <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, color: INK }}>Almost ready&hellip;</p>
          <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Setting up your space.</p>
        </div>
      )}

      {step === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'join-pageIn .5s both' }}>
          <div style={{ ...card, display: 'block', textAlign: 'center' }}>
            <PartyPopper
              aria-hidden
              style={{ display: 'block', margin: '0 auto', width: 44, height: 44, color: '#c13bff', animation: 'join-pop .6s both' }}
            />
            <p style={{ margin: '12px 0 0', fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: INK }}>
              You&apos;re all set, {fullName.trim().split(/\s+/)[0]}!
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: MUTED }}>
              Your Student Code is waiting on your profile once you&apos;re in, and that&apos;s what you&apos;ll give your
              teacher to get added to your class.
            </p>
          </div>
          <button
            type="button"
            className="join-cta"
            onClick={() => {
              playNav()
              clearKidsDashboardState()
              navigate('/student')
            }}
          >
            Welcome! Let&apos;s go
          </button>
        </div>
      )}

      {confetti && (
        <div aria-hidden style={{ position: 'fixed', left: '50%', top: '40%', pointerEvents: 'none', zIndex: 100 }}>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              style={
                {
                  position: 'absolute',
                  width: c.s,
                  height: c.h,
                  borderRadius: 3,
                  background: c.col,
                  '--dx': `${c.dx}px`,
                  '--dy': `${c.dy}px`,
                  animation: 'join-burst 1.4s cubic-bezier(.2,.8,.3,1) forwards',
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- returning student ----------

function ReturningStudentFlow() {
  const navigate = useNavigate()
  // Prefills from whatever was saved here last time "Remember me" was
  // checked - a kid shouldn't have to retype their passcode on a device
  // they already signed into before.
  const [fullName, setFullName] = useState(() => getRememberedStudent()?.fullName ?? '')
  const [passcode, setPasscode] = useState(() => getRememberedStudent()?.passcode ?? '')
  const [error, setError] = useState('')
  const [errN, setErrN] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [rememberMe, setRememberMeChecked] = useState(true)

  const fail = (msg: string) => {
    setError(msg)
    setErrN((n) => n + 1)
    haptics.error()
  }

  const submit = async () => {
    if (!fullName.trim()) return fail('Enter your name.')
    if (!passcode.trim()) return fail('Enter your passcode.')
    setSubmitting(true)
    setError('')
    setRememberMe(rememberMe)
    try {
      await studentSignInByName({ full_name: fullName, passcode })
      if (rememberMe) saveRememberedStudent({ fullName, passcode })
      else clearRememberedStudent()
      // A sign in always opens on the village map, never on whatever room the
      // last session in this tab happened to leave behind.
      clearKidsDashboardState()
      playNav()
      haptics.success()
      navigate('/student')
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void submit()
  }

  return (
    <div key={errN} style={{ ...card, animation: errN ? 'join-shake .4s' : 'join-pageIn .4s both' }}>
      <label htmlFor="join-r-name" style={{ fontSize: 14, fontWeight: 800, color: INK }}>
        Your name
      </label>
      <input
        id="join-r-name"
        className="join-field"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value)
          setError('')
        }}
        onKeyDown={onKey}
        placeholder="Your full name"
      />
      <label htmlFor="join-r-pass" style={{ fontSize: 14, fontWeight: 800, color: INK }}>
        Your passcode
      </label>
      <input
        id="join-r-pass"
        className="join-field join-field-code"
        value={passcode}
        onChange={(e) => {
          setPasscode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
          setError('')
        }}
        onKeyDown={onKey}
        type="text"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="e.g. joshmfm7"
      />
      <button
        type="button"
        role="checkbox"
        aria-checked={rememberMe}
        onClick={() => setRememberMeChecked((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 0,
          border: 'none',
          background: 'none',
          fontSize: 14,
          color: MUTED,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: `2px solid ${rememberMe ? '#8a1fb0' : 'rgba(22,11,42,.3)'}`,
            background: rememberMe ? '#8a1fb0' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
            boxSizing: 'border-box',
          }}
        >
          <Check aria-hidden style={{ width: 12, height: 12, color: '#fff', opacity: rememberMe ? 1 : 0 }} strokeWidth={3} />
        </span>
        Remember me on this device
      </button>
      {error && <p style={{ margin: 0, fontSize: 14, color: '#d6334a' }}>{error}</p>}
      <button type="button" onClick={submit} disabled={submitting} className="join-cta">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </div>
  )
}
