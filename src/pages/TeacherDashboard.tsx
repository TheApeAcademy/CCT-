import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, fetchMyTeacherApproval, type QaSubmissionFull } from '../lib/supabase'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

type Filter = 'new' | 'answered' | 'all'

export default function TeacherDashboard() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [approved, setApproved] = useState<boolean | null>(null)
  const [checkingApproval, setCheckingApproval] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setApproved(null)
      return
    }
    setCheckingApproval(true)
    fetchMyTeacherApproval(session.user.id)
      .then(setApproved)
      .catch(() => setApproved(false))
      .finally(() => setCheckingApproval(false))
  }, [session])

  const signOut = () => supabase.auth.signOut()

  if (checkingSession) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session) return <LoginForm />
  if (checkingApproval || approved === null) return <div className="py-20 text-center text-xl">Checking your account…</div>
  if (!approved) return <PendingApproval email={session.user.email ?? ''} onSignOut={signOut} />
  return <Inbox onSignOut={signOut} teacherEmail={session.user.email ?? ''} />
}

function LoginForm() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)

  const switchTab = (t: 'signin' | 'signup') => {
    setTab(t)
    setError('')
    setSignedUp(false)
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) {
      setError(signInError.message)
      haptics.error()
    } else {
      playClick()
      haptics.success()
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
    if (signUpError) {
      setError(signUpError.message)
      haptics.error()
    } else {
      playClick()
      haptics.success()
      setSignedUp(true)
      setNeedsEmailConfirm(!data.session)
    }
    setLoading(false)
  }

  if (signedUp) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-4xl">📝</p>
        <h1 className="font-display text-3xl font-extrabold">Almost there!</h1>
        <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 text-left shadow-lg shadow-black/20">
          {needsEmailConfirm && <p>1. Check your email and confirm your address.</p>}
          <p>{needsEmailConfirm ? '2.' : '1.'} A church admin needs to approve your account before you can see kids' messages.</p>
          <p className="text-white/60">You'll be able to sign in as soon as you're approved. Try signing in in a little while.</p>
        </div>
        <button
          onClick={() => switchTab('signin')}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
        >
          Go to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-4xl">👩‍🏫</p>
        <h1 className="font-display text-3xl font-extrabold">Teacher Dashboard</h1>
        <p className="mt-2 text-white/60">Sign in to read and answer kids' messages.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => switchTab('signin')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'signin' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchTab('signup')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === 'signup' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && (tab === 'signin' ? handleSignIn() : handleSignUp())}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={tab === 'signin' ? handleSignIn : handleSignUp}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {loading ? (tab === 'signin' ? 'Signing in…' : 'Signing up…') : tab === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
        {tab === 'signup' && (
          <p className="text-center text-xs text-white/40">
            New accounts need approval from a church admin before they can see the inbox.
          </p>
        )}
      </div>
    </div>
  )
}

function PendingApproval({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-4xl">⏳</p>
      <h1 className="font-display text-3xl font-extrabold">Pending Approval</h1>
      <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <p className="text-white/70">
          Your account (<span className="text-amber-300">{email}</span>) is signed in, but a church admin still
          needs to approve you before you can see kids' messages.
        </p>
        <p className="text-sm text-white/50">Check back later, or ask your admin to approve your account.</p>
      </div>
      <button onClick={onSignOut} className="rounded-full bg-white/10 px-6 py-2 text-sm hover:bg-white/20">
        Sign Out
      </button>
    </div>
  )
}

function Inbox({ onSignOut, teacherEmail }: { onSignOut: () => void; teacherEmail: string }) {
  const [submissions, setSubmissions] = useState<QaSubmissionFull[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('new')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('church_qa_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setSubmissions((data ?? []) as QaSubmissionFull[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleReply = async (id: string) => {
    const answer = replyDrafts[id]?.trim()
    if (!answer) return
    setSendingId(id)
    const { error: updateError } = await supabase.from('church_qa_submissions').update({ answer, status: 'answered' }).eq('id', id)
    setSendingId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    playClick()
    haptics.success()
    setReplyDrafts((d) => ({ ...d, [id]: '' }))
    load()
  }

  const filtered = submissions.filter((s) => filter === 'all' || s.status === filter)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">👩‍🏫 Teacher Dashboard</h1>
          <p className="text-sm text-white/50">{teacherEmail}</p>
        </div>
        <button onClick={onSignOut} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          Sign Out
        </button>
      </div>

      <div className="flex gap-2">
        {(['new', 'answered', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === f ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {f === 'new' ? 'New' : f === 'answered' ? 'Answered' : 'All'}
          </button>
        ))}
        <button onClick={load} className="ml-auto rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          🔄 Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-center text-white/50">Loading inbox…</p>}
      {!loading && filtered.length === 0 && <p className="text-center text-white/50">Nothing here.</p>}

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-white/40">{new Date(s.created_at).toLocaleString()}</p>
                {s.is_anonymous ? (
                  <p className="text-sm font-semibold text-white/60">🕶️ Anonymous</p>
                ) : (
                  <p className="text-sm font-semibold text-amber-300">
                    🙋 {s.display_name || 'Unnamed'}
                    {s.contact_note && <span className="text-white/50"> · {s.contact_note}</span>}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  s.status === 'answered' ? 'bg-green-500/30 text-green-300' : 'bg-amber-400/30 text-amber-300'
                }`}
              >
                {s.status === 'answered' ? 'Answered' : 'New'}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap">{s.message}</p>

            {s.answer && (
              <div className="mt-3 rounded-lg bg-green-900/20 p-3 text-sm">
                <p className="mb-1 font-semibold text-green-300">Your reply:</p>
                <p>{s.answer}</p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <input
                value={replyDrafts[s.id] ?? ''}
                onChange={(e) => setReplyDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                placeholder={s.status === 'answered' ? 'Update your reply...' : 'Write a reply...'}
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                onKeyDown={(e) => e.key === 'Enter' && handleReply(s.id)}
              />
              <button
                onClick={() => handleReply(s.id)}
                disabled={sendingId === s.id}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950 transition hover:scale-105 disabled:opacity-60"
              >
                {sendingId === s.id ? 'Sending…' : 'Reply'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
