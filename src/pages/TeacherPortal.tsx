import { useEffect, useState } from 'react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import {
  getMyTeacherApplication,
  submitTeacherApplication,
  listMyClasses,
  createClass,
  archiveClass,
  listRoster,
  addRosterName,
  removeRosterEntry,
  listStudentsInClass,
  moveStudent,
  listMyConversations,
  listMessages,
  sendMessage,
  listTeacherInbox,
  replyToConfession,
  markConfessionSeen,
  type TeacherApplication,
  type ClassRow,
  type RosterEntry,
  type StudentRow,
  type ConversationSummary,
  type MessageRow,
  type ConfessionRow,
} from '../lib/ministry'
import { fileToResizedDataUrl } from '../lib/image'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export default function TeacherPortal() {
  const { session, profile, loading, refreshProfile } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session) return <TeacherAuth />
  if (profile?.role === 'teacher') return <TeacherDashboard />
  return <ApplicationGate onChange={refreshProfile} />
}

// ---------- sign in / sign up ----------

function TeacherAuth() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-4xl">👩‍🏫</p>
        <h1 className="font-display text-3xl font-extrabold">Teacher Portal</h1>
        <p className="mt-2 text-white/60">Sign in, or create an account and apply to teach.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === 'signin' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === 'signup' ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
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
          {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  )
}

// ---------- application gate (between signup and approval) ----------

function ApplicationGate({ onChange }: { onChange: () => void }) {
  const [app, setApp] = useState<TeacherApplication | null | 'loading'>('loading')

  const load = () => getMyTeacherApplication().then(setApp)
  useEffect(() => {
    load()
  }, [])

  if (app === 'loading') return <div className="py-20 text-center text-xl">Loading…</div>

  if (!app) {
    return (
      <ApplyForm
        onSubmitted={() => {
          load()
          onChange()
        }}
      />
    )
  }

  if (app.status === 'pending') {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-4xl">⏳</p>
        <h1 className="font-display text-3xl font-extrabold">Application Pending</h1>
        <p className="text-white/60">
          Thanks, {app.full_name}! Your application is with the ministry admin for review. You'll be able to sign in as soon as you're approved.
        </p>
        <button onClick={() => signOut()} className="rounded-full bg-white/10 px-6 py-2 text-sm hover:bg-white/20">
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-4xl">😕</p>
      <h1 className="font-display text-3xl font-extrabold">Application Not Approved</h1>
      <p className="text-white/60">Your application wasn't approved this time. Reach out to the ministry admin if you think this is a mistake.</p>
      <button onClick={() => signOut()} className="rounded-full bg-white/10 px-6 py-2 text-sm hover:bg-white/20">
        Sign Out
      </button>
    </div>
  )
}

function ApplyForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!fullName.trim()) return setError('Your full name is required.')
    setSubmitting(true)
    setError('')
    try {
      const { data } = await supabase.auth.getUser()
      await submitTeacherApplication({ full_name: fullName, email: data.user?.email ?? '', phone, message })
      playClick()
      haptics.success()
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <p className="text-4xl">📝</p>
        <h1 className="font-display text-3xl font-extrabold">Apply to Teach</h1>
        <p className="mt-2 text-white/60">Tell us about yourself. A ministry admin will review your application.</p>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number (optional)"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us a bit about yourself and why you'd like to teach (optional)"
          rows={4}
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}

// ---------- main dashboard ----------

type Tab = 'classes' | 'messages' | 'confessions' | 'profile'

function TeacherDashboard() {
  const [tab, setTab] = useState<Tab>('classes')
  const [openClass, setOpenClass] = useState<ClassRow | null>(null)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">👩‍🏫 Teacher Portal</h1>
        <button onClick={() => signOut()} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          Sign Out
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['classes', '🏫 Classes'],
            ['messages', '💬 Messages'],
            ['confessions', '🙏 Confessions'],
            ['profile', '⚙️ Profile'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setOpenClass(null)
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'classes' && (openClass ? <ClassDetail klass={openClass} onBack={() => setOpenClass(null)} /> : <ClassesTab onOpen={setOpenClass} />)}
      {tab === 'messages' && <MessagesTab />}
      {tab === 'confessions' && <ConfessionsTab />}
      {tab === 'profile' && <ProfileTab />}
    </div>
  )
}

function ClassesTab({ onOpen }: { onOpen: (c: ClassRow) => void }) {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => listMyClasses().then(setClasses).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createClass(newName)
      setNewName('')
      playClick()
      haptics.success()
      load()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder='New class name, e.g. "Sparklers (Ages 6-8)"'
          className="flex-1 rounded-lg bg-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950 disabled:opacity-60">
          + Create
        </button>
      </div>
      {loading && <p className="text-white/50">Loading…</p>}
      {!loading && classes.length === 0 && <p className="text-white/50">No classes yet. Create your first one above.</p>}
      <div className="space-y-2">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpen(c)}
            className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-left transition hover:scale-[1.01] hover:bg-white/10"
          >
            <div>
              <p className="font-bold">
                {c.name} {c.archived && <span className="text-xs text-white/40">(archived)</span>}
              </p>
              <p className="text-sm text-white/60">Join code: {c.join_code}</p>
            </div>
            <span className="text-white/40">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ClassDetail({ klass, onBack }: { klass: ClassRow; onBack: () => void }) {
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)

  const joinLink = `${window.location.origin}${window.location.pathname}#/join/${klass.join_code}`

  const load = () => {
    Promise.all([listRoster(klass.id), listStudentsInClass(klass.id)]).then(([r, s]) => {
      setRoster(r)
      setStudents(s)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [klass.id])

  const addName = async () => {
    if (!newName.trim()) return
    await addRosterName(klass.id, newName)
    setNewName('')
    playClick()
    load()
  }

  const removeUnclaimed = async (id: string) => {
    if (!confirm('Remove this unclaimed roster spot?')) return
    await removeRosterEntry(id)
    load()
  }

  const removeStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the class? Their account stays, just unassigned.')) return
    await moveStudent(studentId, null)
    haptics.tap()
    load()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink)
      playClick()
      haptics.success()
    } catch {
      // ignore
    }
  }

  const toggleArchive = async () => {
    await archiveClass(klass.id, !klass.archived)
    load()
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-white/60 hover:text-white">
        ← Back to classes
      </button>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <h2 className="font-display text-xl font-bold">{klass.name}</h2>
        <p className="mt-1 text-sm text-white/60">Share this with your class so kids can join:</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-black/30 px-4 py-2 font-mono text-lg font-bold text-amber-300">{klass.join_code}</span>
          <button onClick={copyLink} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
            🔗 Copy join link
          </button>
          <button onClick={toggleArchive} className="ml-auto rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
            {klass.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>

      {loading && <p className="text-white/50">Loading…</p>}

      <div className="space-y-3">
        <h3 className="font-display font-bold">👦 Students ({students.length})</h3>
        {students.length === 0 && <p className="text-sm text-white/50">No one has joined yet.</p>}
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-3">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">👤</span>
                )}
                <div>
                  <p className="font-semibold">{s.full_name}</p>
                  <p className="text-xs text-white/50">{s.total_points.toLocaleString()} points</p>
                </div>
              </div>
              <button onClick={() => removeStudent(s.id)} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/30">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display font-bold">📋 Roster (waiting to join)</h3>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a kid's name"
            className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && addName()}
          />
          <button onClick={addName} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            + Add
          </button>
        </div>
        <div className="space-y-1">
          {roster
            .filter((r) => !r.claimed)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-2 text-sm">
                <span>{r.full_name}</span>
                <button onClick={() => removeUnclaimed(r.id)} className="text-xs text-white/40 hover:text-red-300">
                  ✕ remove
                </button>
              </div>
            ))}
          {roster.filter((r) => !r.claimed).length === 0 && <p className="text-sm text-white/40">Everyone on the roster has joined.</p>}
        </div>
      </div>
    </div>
  )
}

function MessagesTab() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [open, setOpen] = useState<ConversationSummary | null>(null)

  useEffect(() => {
    listMyConversations().then(setConversations)
  }, [])

  if (open) return <ThreadView conversationId={open.id} title={open.other_name} onBack={() => setOpen(null)} />

  return (
    <div className="space-y-2">
      {conversations.length === 0 && <p className="text-white/50">No conversations yet. Students can message you once they join a class.</p>}
      {conversations.map((c) => (
        <button key={c.id} onClick={() => setOpen(c)} className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-4 text-left transition hover:bg-white/10">
          {c.other_avatar ? <img src={c.other_avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="text-2xl">👤</span>}
          <p className="font-semibold">{c.other_name}</p>
        </button>
      ))}
    </div>
  )
}

function ThreadView({ conversationId, title, onBack }: { conversationId: string; title: string; onBack: () => void }) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)

  const load = () => listMessages(conversationId).then(setMessages)
  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [conversationId])

  const send = async () => {
    if (!draft.trim()) return
    await sendMessage(conversationId, draft)
    setDraft('')
    playClick()
    load()
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-white/60 hover:text-white">
        ← Back to messages
      </button>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="space-y-2 rounded-2xl bg-black/20 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-amber-400/20 text-right' : 'bg-white/10'}`}>
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-sm text-white/40">No messages yet.</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-lg bg-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950">
          Send
        </button>
      </div>
    </div>
  )
}

function ConfessionsTab() {
  const [items, setItems] = useState<ConfessionRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = () => listTeacherInbox().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const reply = async (id: string) => {
    const text = drafts[id]?.trim()
    if (!text) return
    await replyToConfession(id, text)
    playClick()
    haptics.success()
    setDrafts((d) => ({ ...d, [id]: '' }))
    load()
  }

  const seen = async (id: string) => {
    await markConfessionSeen(id)
    load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Private notes from students in your classes. Anonymous ones never reveal who sent them, even to you.</p>
      {loading && <p className="text-white/50">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-white/50">Nothing here yet.</p>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20" onClick={() => c.status === 'new' && seen(c.id)}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white/60">{c.is_anonymous ? '🕶️ Anonymous' : '🙋 A student'}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.status === 'replied' ? 'bg-green-500/30 text-green-300' : c.status === 'seen' ? 'bg-white/10 text-white/60' : 'bg-amber-400/30 text-amber-300'}`}>
                {c.status}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            {c.reply && (
              <div className="mt-3 rounded-lg bg-green-900/20 p-3 text-sm">
                <p className="mb-1 font-semibold text-green-300">Your reply:</p>
                <p>{c.reply}</p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={drafts[c.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                placeholder={c.reply ? 'Update your reply…' : 'Write a reply…'}
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.key === 'Enter' && reply(c.id)}
              />
              <button onClick={(e) => { e.stopPropagation(); reply(c.id) }} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950">
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileTab() {
  const { profile, refreshProfile } = useMinistryAuth()
  const [fullName, setFullName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setAvatar(profile.avatar_url)
    }
  }, [profile])

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    const dataUrl = await fileToResizedDataUrl(file)
    setAvatar(dataUrl)
  }

  const save = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    await supabase.from('profiles').update({ full_name: fullName.trim(), avatar_url: avatar }).eq('id', data.user.id)
    playClick()
    haptics.success()
    setSaved(true)
    refreshProfile()
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/60" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-2xl">👤</span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>
        <p className="text-sm text-white/60">Tap your photo to change it</p>
      </div>
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
      />
      {saved && <p className="text-sm text-green-400">Saved! ✅</p>}
      <button onClick={save} className="w-full rounded-2xl bg-amber-400 py-3 font-bold text-purple-950 transition hover:scale-[1.02]">
        Save Profile
      </button>
    </div>
  )
}
