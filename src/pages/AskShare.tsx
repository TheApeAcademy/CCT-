import { useEffect, useState } from 'react'
import { submitQuestion, fetchMySubmission, getMyClaimTokens, type QaSubmission } from '../lib/supabase'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

type Mode = 'anonymous' | 'reachable'

export default function AskShare() {
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<Mode>('anonymous')
  const [displayName, setDisplayName] = useState('')
  const [contactNote, setContactNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [justSubmitted, setJustSubmitted] = useState(false)

  const [myMessages, setMyMessages] = useState<QaSubmission[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const loadHistory = async () => {
    const tokens = getMyClaimTokens()
    if (tokens.length === 0) return
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const results = await Promise.all(tokens.map((t) => fetchMySubmission(t)))
      setMyMessages(results.filter((r): r is QaSubmission => !!r))
    } catch {
      setHistoryError('Could not check for replies. Make sure you have an internet connection.')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please write your question or thought first.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await submitQuestion({
        message: message.trim(),
        isAnonymous: mode === 'anonymous',
        displayName: mode === 'reachable' ? displayName : undefined,
        contactNote: mode === 'reachable' ? contactNote : undefined,
      })
      playClick()
      haptics.success()
      setMessage('')
      setDisplayName('')
      setContactNote('')
      setJustSubmitted(true)
      loadHistory()
    } catch {
      setError('Could not send right now. This needs an internet connection, please try again.')
      haptics.error()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-4xl">💌</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Ask & Share</h1>
        <p className="mx-auto mt-2 max-w-xl text-white/60">
          A safe place to drop a question, an opinion, a challenge, or anything on your mind. Only your Sunday
          school teacher reads these, and they'll answer you right here in the app.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
        ⚠️ This needs an internet connection to send and check messages (unlike the rest of the app). If you or
        someone you know is ever in danger, please tell a trusted adult right away instead of waiting for a reply
        here.
      </div>

      {justSubmitted && (
        <div className="animate-page-in rounded-2xl bg-green-900/30 p-4 text-center text-green-300 ring-1 ring-green-400/30">
          ✅ Sent! Your teacher will see this soon. Check back below for a reply.
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/80">Your message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write anything on your mind..."
            rows={5}
            className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white/80">How private should this be?</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => setMode('anonymous')}
              className={`rounded-xl border-2 p-3 text-left text-sm transition ${
                mode === 'anonymous' ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-bold">🕶️ Fully anonymous</p>
              <p className="text-white/60">Nothing is tied to you at all. Your teacher can answer but won't know who asked.</p>
            </button>
            <button
              onClick={() => setMode('reachable')}
              className={`rounded-xl border-2 p-3 text-left text-sm transition ${
                mode === 'reachable' ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-bold">🙋 Less anonymous</p>
              <p className="text-white/60">Share your name so your teacher can find you to talk more or help you out.</p>
            </button>
          </div>
        </div>

        {mode === 'reachable' && (
          <div className="animate-page-in space-y-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="Which class or how your teacher can find you (optional)"
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send →'}
        </button>
      </div>

      {getMyClaimTokens().length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Your Messages</h2>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="rounded-full bg-white/10 px-4 py-2 text-sm transition hover:scale-105 hover:bg-white/20"
            >
              {loadingHistory ? 'Checking…' : '🔄 Check for replies'}
            </button>
          </div>
          {historyError && <p className="text-sm text-red-400">{historyError}</p>}
          <div className="space-y-2">
            {myMessages.map((m) => (
              <div key={m.id} className="rounded-xl bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-white/70">{m.message}</p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      m.status === 'answered' ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {m.status === 'answered' ? '✓ Answered' : 'Waiting'}
                  </span>
                </div>
                {m.answer && (
                  <div className="mt-3 rounded-lg bg-amber-400/10 p-3 text-sm">
                    <p className="mb-1 font-semibold text-amber-300">Your teacher's reply:</p>
                    <p className="text-white/90">{m.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
