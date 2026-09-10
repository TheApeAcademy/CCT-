import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { playClick } from '../../lib/sound'
import { haptics } from '../../lib/haptics'

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

  const handleSignIn = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setLoading(true)
    setError('')
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
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (err) return setError(err.message)
    playClick()
    haptics.success()
    setSignedUp(true)
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

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Header icon={Icon} title={title} subtitle={subtitle} />
      <div className="flex gap-1 rounded-md border border-[var(--hairline-strong)] p-1">
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 rounded px-4 py-2 text-sm font-bold transition ${tab === 'signin' ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/70 hover:text-white'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 rounded px-4 py-2 text-sm font-bold transition ${tab === 'signup' ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'text-white/70 hover:text-white'}`}
        >
          {signUpLabel}
        </button>
      </div>
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
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={tab === 'signin' ? handleSignIn : handleSignUp} disabled={loading} className="btn-solid w-full py-3 text-base">
          {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : signUpLabel}
        </button>
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
