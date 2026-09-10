import { useEffect, useState } from 'react'
import {
  GraduationCap,
  ClipboardList,
  MessageCircle,
  HeartHandshake,
  Settings,
  ArrowLeft,
  Link2,
  Archive,
  Send,
  Check,
  X,
  User,
} from 'lucide-react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import AuthCard from '../components/ui/AuthCard'
import TabBar from '../components/ui/TabBar'
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

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function TeacherPortal() {
  const { session, profile, loading, refreshProfile } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session) return <AuthCard icon={GraduationCap} title="Teacher Portal" subtitle="Sign in, or create an account and apply to teach." />
  if (profile?.role === 'teacher') return <TeacherDashboard />
  return <ApplicationGate onChange={refreshProfile} />
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
      <StatusScreen
        icon={ClipboardList}
        title="Application Pending"
        body={`Thanks, ${app.full_name}! Your application is with the ministry admin for review. You'll be able to sign in as soon as you're approved.`}
      />
    )
  }

  return (
    <StatusScreen
      icon={X}
      title="Application Not Approved"
      body="Your application wasn't approved this time. Reach out to the ministry admin if you think this is a mistake."
    />
  )
}

function StatusScreen({ icon: Icon, title, body }: { icon: typeof ClipboardList; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <p className="text-sm text-[var(--ink-muted)]">{body}</p>
      <button onClick={() => signOut()} className="btn-outline">
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
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Apply to Teach</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Tell us about yourself. A ministry admin will review your application.</p>
      </div>
      <div className="panel space-y-3 p-5">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" className={inputClass} />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us a bit about yourself and why you'd like to teach (optional)"
          rows={4}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting} className="btn-solid w-full py-3 text-base">
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
        <div>
          <p className="eyebrow">Teacher</p>
          <h1 className="font-display text-2xl font-extrabold">Portal</h1>
        </div>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      <TabBar
        value={tab}
        onChange={(t) => {
          setTab(t)
          setOpenClass(null)
        }}
        items={[
          { value: 'classes', label: 'Classes', icon: GraduationCap },
          { value: 'messages', label: 'Messages', icon: MessageCircle },
          { value: 'confessions', label: 'Confessions', icon: HeartHandshake },
          { value: 'profile', label: 'Profile', icon: Settings },
        ]}
      />

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
  useEffect(() => {
    load()
  }, [])

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
          className={inputClass}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating} className="btn-solid shrink-0 text-sm">
          Create
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && classes.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No classes yet. Create your first one above.</p>}
      <div className="space-y-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => onOpen(c)} className="panel panel-interactive flex w-full items-center justify-between p-4 text-left">
            <div>
              <p className="font-bold">
                {c.name} {c.archived && <span className="text-xs text-[var(--ink-faint)]">(archived)</span>}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">Join code: {c.join_code}</p>
            </div>
            <span className="text-[var(--ink-faint)]">&rarr;</span>
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
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id])

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
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to classes
      </button>

      <div className="panel p-5">
        <h2 className="font-display text-xl font-bold">{klass.name}</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Share this with your class so kids can join:</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded border border-[var(--hairline-strong)] px-4 py-2 font-mono text-lg font-bold text-[var(--gold)]">{klass.join_code}</span>
          <button onClick={copyLink} className="btn-outline flex items-center gap-1.5 px-3 py-2 text-sm">
            <Link2 className="h-4 w-4" /> Copy join link
          </button>
          <button onClick={toggleArchive} className="btn-outline ml-auto flex items-center gap-1.5 px-3 py-2 text-sm">
            <Archive className="h-4 w-4" /> {klass.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}

      <div className="space-y-3">
        <p className="eyebrow">Students ({students.length})</p>
        {students.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No one has joined yet.</p>}
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="panel flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
                    <User className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                )}
                <div>
                  <p className="font-semibold">{s.full_name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">{s.total_points.toLocaleString()} points</p>
                </div>
              </div>
              <button onClick={() => removeStudent(s.id)} className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/25">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="eyebrow">Roster (Waiting To Join)</p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a kid's name"
            className={`${inputClass} py-2 text-sm`}
            onKeyDown={(e) => e.key === 'Enter' && addName()}
          />
          <button onClick={addName} className="btn-outline shrink-0 text-sm">
            Add
          </button>
        </div>
        <div className="space-y-1">
          {roster
            .filter((r) => !r.claimed)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-[var(--hairline)] px-4 py-2 text-sm">
                <span>{r.full_name}</span>
                <button onClick={() => removeUnclaimed(r.id)} className="text-xs text-[var(--ink-faint)] hover:text-red-400">
                  Remove
                </button>
              </div>
            ))}
          {roster.filter((r) => !r.claimed).length === 0 && <p className="text-sm text-[var(--ink-faint)]">Everyone on the roster has joined.</p>}
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
      {conversations.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No conversations yet. Students can message you once they join a class.</p>}
      {conversations.map((c) => (
        <button key={c.id} onClick={() => setOpen(c)} className="panel panel-interactive flex w-full items-center gap-3 p-4 text-left">
          {c.other_avatar ? (
            <img src={c.other_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
              <User className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to messages
      </button>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="panel space-y-2 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-[var(--gold)]/15 text-right' : 'bg-white/5'}`}>
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-sm text-[var(--ink-faint)]">No messages yet.</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className={inputClass}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="btn-solid flex shrink-0 items-center gap-1.5 text-sm">
          <Send className="h-4 w-4" /> Send
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
  useEffect(() => {
    load()
  }, [])

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
      <p className="text-sm text-[var(--ink-muted)]">Private notes from students in your classes. Anonymous ones never reveal who sent them, even to you.</p>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-[var(--ink-muted)]">Nothing here yet.</p>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="panel p-5" onClick={() => c.status === 'new' && seen(c.id)}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--ink-muted)]">{c.is_anonymous ? 'Anonymous' : 'A student'}</p>
              <span
                className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  c.status === 'replied' ? 'bg-emerald-500/15 text-emerald-400' : c.status === 'seen' ? 'bg-white/10 text-white/60' : 'bg-[var(--gold)]/15 text-[var(--gold)]'
                }`}
              >
                {c.status}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            {c.reply && (
              <div className="mt-3 rounded-md bg-emerald-500/10 p-3 text-sm">
                <p className="mb-1 font-semibold text-emerald-400">Your reply:</p>
                <p>{c.reply}</p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={drafts[c.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                placeholder={c.reply ? 'Update your reply…' : 'Write a reply…'}
                className={`${inputClass} py-2 text-sm`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.key === 'Enter' && reply(c.id)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  reply(c.id)
                }}
                className="btn-solid shrink-0 text-sm"
              >
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
    <div className="panel mx-auto max-w-md space-y-4 p-5">
      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--gold)]/60" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
              <User className="h-7 w-7" strokeWidth={1.75} />
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>
        <p className="text-sm text-[var(--ink-muted)]">Tap your photo to change it</p>
      </div>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} />
      {saved && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-400">
          <Check className="h-4 w-4" /> Saved
        </p>
      )}
      <button onClick={save} className="btn-solid w-full py-3">
        Save Profile
      </button>
    </div>
  )
}
