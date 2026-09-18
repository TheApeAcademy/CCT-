import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { supabase, getMyProfile, type UserRole } from '../lib/supabase'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass =
  'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

// Where someone lands once the new password is saved, so the last step of
// recovery is the portal they were trying to reach, not the front page.
const PORTAL: Record<string, { path: string; label: string }> = {
  admin: { path: '/admin', label: 'Go to the Admin Control Centre' },
  teacher: { path: '/teacher', label: 'Go to the Teacher Portal' },
  parent: { path: '/parent', label: 'Go to the Parent Dashboard' },
  student: { path: '/student', label: "Go to the Children's Dashboard" },
}

/**
 * The second half of password recovery. main.tsx has already traded the
 * "?code=" on the reset link for a real session by the time anyone gets here,
 * so this screen's only job is to take the new password.
 *
 * Arriving with no session is the normal failure, not an edge case: reset
 * links are single use and expire, and people open old emails. That gets a
 * plain explanation and a way back rather than an error.
 */
export default function ResetPassword() {
  const [checking, setChecking] = useState(true)
  const [authorised, setAuthorised] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setAuthorised(!!data.session))
      .catch(() => setAuthorised(false))
      .finally(() => setChecking(false))
  }, [])

  const save = async () => {
    if (password.length < 6) return setError('Your new password must be at least 6 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    setSaving(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setSaving(false)
      return setError(err.message)
    }
    // Read the role now rather than guessing which portal to offer. If it
    // cannot be read for any reason the buttons below fall back to Home.
    const profile = await getMyProfile().catch(() => null)
    setRole(profile?.role ?? null)
    setSaving(false)
    setDone(true)
    playClick()
    haptics.success()
  }

  const destination = (role && PORTAL[role]) || null

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <KeyRound className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
          {done ? 'Password Updated' : !checking && !authorised ? 'This Link Has Expired' : 'Choose a New Password'}
        </h1>
      </div>

      {checking && <p className="panel p-5 text-center text-sm text-[var(--ink-muted)]">Checking your link…</p>}

      {!checking && !authorised && !done && (
        <div className="panel space-y-3 p-5 text-sm">
          <p className="text-[var(--fg)]/80">
            This reset link is no longer valid. They can only be used once, and they expire an hour after they are sent.
          </p>
          <p className="text-[var(--ink-muted)]">Go back to your sign-in page and ask for a fresh one.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/teacher" className="btn-outline">
              Teacher
            </Link>
            <Link to="/admin" className="btn-outline">
              Admin
            </Link>
            <Link to="/parent" className="btn-outline">
              Parent
            </Link>
          </div>
        </div>
      )}

      {!checking && authorised && !done && (
        <div className="panel space-y-3 p-5">
          <input
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
          <input
            id="confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <p className="text-xs text-[var(--ink-muted)]">At least 6 characters.</p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button onClick={save} disabled={saving} className="btn-solid w-full py-3 text-base">
            {saving ? 'Saving…' : 'Save New Password'}
          </button>
        </div>
      )}

      {done && (
        <div className="panel space-y-3 p-5 text-sm">
          <p className="text-[var(--fg)]/80">
            That is done. You are signed in on this device already, and the old password no longer works anywhere.
          </p>
          <Link to={destination?.path ?? '/'} className="btn-solid w-full justify-center py-3 text-base">
            {destination?.label ?? 'Back to Home'}
          </Link>
        </div>
      )}
    </div>
  )
}
