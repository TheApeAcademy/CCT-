import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { supabase, setRememberMe, sendPasswordReset } from '../../lib/supabase'
import { playClick } from '../../lib/sound'
import { haptics } from '../../lib/haptics'
import SegmentedControl from './SegmentedControl'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function AuthCard({
  icon: Icon,
  title,
  subtitle,
  signUpLabel = 'Sign Up',
  afterSignUp,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  signUpLabel?: string
  afterSignUp?: (email: string) => React.ReactNode
}) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [rememberMe, setRememberMeChecked] = useState(true)
  // Every adult login in the app renders this card, so putting password
  // recovery here is what makes it system wide: teacher, admin and parent all
  // get it from one change, and all three get exactly the same wording.
  const [forgot, setForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSignIn = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setLoading(true)
    setError('')
    setRememberMe(rememberMe)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) return setError(err.message)
    playClick()
    haptics.success()
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')
    setRememberMe(rememberMe)
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (err) return setError(err.message)
    playClick()
    haptics.success()
    setSignedUp(true)
  }

  const handleReset = async () => {
    if (!email.trim()) return setError('Enter the email address you sign in with.')
    setLoading(true)
    setError('')
    try {
      await sendPasswordReset(email)
      playClick()
      setResetSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const leaveForgot = () => {
    setForgot(false)
    setResetSent(false)
    setError('')
  }

  if (signedUp && afterSignUp) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Header icon={Icon} title="Account Created" subtitle="" />
        <div className="panel space-y-2 p-5 text-left text-sm text-[var(--ink-muted)]">{afterSignUp(email)}</div>
        <button onClick={() => setSignedUp(false)} className="btn-outline w-full py-3">
          Back to Sign In
        </button>
      </div>
    )
  }

  if (forgot) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <Header icon={Icon} title="Reset Your Password" subtitle={resetSent ? '' : 'We will email you a link to set a new one.'} />
        <div className="panel space-y-3 p-5">
          {resetSent ? (
            <>
              {/* Says "if there is an account" rather than confirming one
                  exists. Anybody can type an email into this box, and telling
                  them whether it belongs to a teacher here would hand out the
                  staff list one guess at a time. */}
              <p className="text-sm text-[var(--fg)]/80">
                If there is an account for <span className="font-bold">{email.trim()}</span>, a reset link is on its way. It works
                once and expires in an hour.
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                Nothing after a few minutes? Check the spam folder, then try again.
              </p>
              <button onClick={leaveForgot} className="btn-solid w-full py-3 text-base">
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className={inputClass}
                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button onClick={handleReset} disabled={loading} className="btn-solid w-full py-3 text-base">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button onClick={leaveForgot} className="btn-outline w-full py-3">
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Header icon={Icon} title={title} subtitle={subtitle} />
      <SegmentedControl
        value={tab}
        onChange={setTab}
        items={[
          { value: 'signin' as const, label: 'Sign In' },
          { value: 'signup' as const, label: signUpLabel },
        ]}
      />
      <div className="panel space-y-3 p-5">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={inputClass} />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className={inputClass}
          onKeyDown={(e) => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
        />
        <label className="flex items-center gap-2 text-sm text-[var(--fg)]/80">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMeChecked(e.target.checked)} className="h-4 w-4" />
          Remember me on this device
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button onClick={tab === 'signin' ? handleSignIn : handleSignUp} disabled={loading} className="btn-solid w-full py-3 text-base">
          {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : signUpLabel}
        </button>
        {tab === 'signin' && (
          <button
            onClick={() => {
              setForgot(true)
              setError('')
            }}
            className="w-full pt-1 text-center text-sm font-bold text-[var(--gold)] underline underline-offset-2"
          >
            Forgot your password?
          </button>
        )}
      </div>
    </div>
  )
}

function Header({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>}
    </div>
  )
}
