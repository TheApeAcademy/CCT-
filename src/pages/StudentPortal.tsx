import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Home as HomeIcon,
  Trophy,
  IdCard,
  MessageCircle,
  HeartHandshake,
  Dumbbell,
  School,
  Music,
  Gamepad2,
  Send,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
import TabBar from '../components/ui/TabBar'
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  getMyClass,
  getLeaderboard,
  getOrCreateConversation,
  listMessages,
  sendMessage,
  submitConfession,
  listMyConfessions,
  type StudentRow,
  type LeaderboardRow,
  type MessageRow,
  type ConfessionRow,
  type ClassRow,
} from '../lib/ministry'
import { fileToResizedDataUrl } from '../lib/image'
import { renderIdCardPng } from '../lib/idCard'
import { playClick, playNav } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

export default function StudentPortal() {
  const { session, profile, loading } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session || profile?.role !== 'student') {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
          <User className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Kids&apos; Dashboard</h1>
        <p className="text-sm text-[var(--ink-muted)]">You need to join your class first to get your own dashboard.</p>
        <Link to="/join" className="btn-solid inline-flex">
          Join My Class
        </Link>
      </div>
    )
  }
  return <Dashboard />
}

type Tab = 'home' | 'leaderboard' | 'profile' | 'messages' | 'confess'

function Dashboard() {
  const [tab, setTab] = useState<Tab>('home')
  const [student, setStudent] = useState<StudentRow | null>(null)
  const [klass, setKlass] = useState<(ClassRow & { teacher_name: string }) | null>(null)
  const [rank, setRank] = useState<number | null>(null)

  const load = () => {
    getMyStudentProfile().then((s) => {
      setStudent(s)
      if (s) getLeaderboard(500).then((rows) => setRank(rows.findIndex((r) => r.student_id === s.id) + 1 || null))
    })
    getMyClass().then(setKlass)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {student?.avatar_url ? (
            <img src={student.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--gold)]/60" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
              <User className="h-6 w-6" strokeWidth={1.75} />
            </span>
          )}
          <div>
            <h1 className="font-display text-xl font-extrabold">{student?.full_name ?? 'My Dashboard'}</h1>
            <p className="text-sm text-[var(--ink-faint)]">{klass?.name ?? 'No class yet'}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      <TabBar
        value={tab}
        onChange={setTab}
        items={[
          { value: 'home', label: 'Home', icon: HomeIcon },
          { value: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { value: 'profile', label: 'My Card', icon: IdCard },
          { value: 'messages', label: 'My Teacher', icon: MessageCircle },
          { value: 'confess', label: 'Confession Box', icon: HeartHandshake },
        ]}
      />

      {tab === 'home' && <HomeTab student={student} klass={klass} rank={rank} />}
      {tab === 'leaderboard' && <LeaderboardTab myId={student?.id ?? null} />}
      {tab === 'profile' && student && <ProfileTab student={student} klass={klass} onSaved={load} />}
      {tab === 'messages' && klass && <MessagesTab teacherId={klass.teacher_id} teacherName={klass.teacher_name} />}
      {tab === 'confess' && <ConfessTab klass={klass} />}
    </div>
  )
}

function HomeTab({ student, klass, rank }: { student: StudentRow | null; klass: (ClassRow & { teacher_name: string }) | null; rank: number | null }) {
  return (
    <div className="space-y-4">
      <div className="stat-strip grid-cols-2">
        <div className="stat-cell">
          <div className="stat-cell-value">{(student?.total_points ?? 0).toLocaleString()}</div>
          <div className="stat-cell-label">Points</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-value">{rank ? `#${rank}` : '—'}</div>
          <div className="stat-cell-label">Leaderboard Rank</div>
        </div>
      </div>
      {klass && (
        <p className="text-center text-sm text-[var(--ink-muted)]">
          in {klass.name}, with {klass.teacher_name}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <HomeLink to="/training" icon={Dumbbell} title="Practice Bible Quiz" description="Unlimited solo practice, no pressure, no timer." />
        <HomeLink to="/transition" icon={School} title="Transition Class" description="Get ready for teenage church." />
        <HomeLink to="/anthem" icon={Music} title="Our Anthem" description="Sing along with the children's ministry anthem." />
        <div className="panel flex items-start gap-4 p-5 opacity-60">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
            <Gamepad2 className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-display text-lg font-bold">Live Quiz Match</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Ask your teacher to start a live match on the big screen for your class!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeLink({ to, icon: Icon, title, description }: { to: string; icon: typeof Dumbbell; title: string; description: string }) {
  return (
    <Link to={to} onClick={() => playClick()} className="panel panel-interactive flex items-start gap-4 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
      </div>
    </Link>
  )
}

function LeaderboardTab({ myId }: { myId: string | null }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(setRows).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
  if (rows.length === 0) return <p className="text-sm text-[var(--ink-muted)]">No quiz points recorded yet. Be the first to play!</p>

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.student_id} className={`panel flex items-center justify-between px-4 py-3 ${r.student_id === myId ? 'border-[var(--gold)]/40' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="w-6 text-center font-display font-bold text-[var(--ink-faint)]">{i + 1}</span>
            {r.avatar_url ? (
              <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--gold)]">
                <User className="h-4 w-4" strokeWidth={1.75} />
              </span>
            )}
            <div>
              <p className="font-semibold">{r.full_name}</p>
              <p className="text-xs text-[var(--ink-faint)]">{r.class_name}</p>
            </div>
          </div>
          <p className="font-bold text-[var(--gold)]">{r.total_points.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

function ProfileTab({ student, klass, onSaved }: { student: StudentRow; klass: (ClassRow & { teacher_name: string }) | null; onSaved: () => void }) {
  const [bio, setBio] = useState(student.bio ?? '')
  const [verse, setVerse] = useState(student.favorite_verse ?? '')
  const [quote, setQuote] = useState(student.favorite_quote ?? '')
  const [avatar, setAvatar] = useState(student.avatar_url)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setAvatar(await fileToResizedDataUrl(file))
  }

  const save = async () => {
    setSaving(true)
    try {
      await updateMyStudentProfile({ bio, favorite_verse: verse, favorite_quote: quote, avatar_url: avatar ?? undefined })
      playClick()
      haptics.success()
      setSaved(true)
      onSaved()
      window.setTimeout(() => setSaved(false), 1800)
    } finally {
      setSaving(false)
    }
  }

  const makeCard = async () => {
    setRendering(true)
    try {
      const url = await renderIdCardPng({
        fullName: student.full_name,
        className: klass?.name ?? null,
        points: student.total_points,
        avatarUrl: avatar,
        favoriteVerse: verse || null,
        favoriteQuote: quote || null,
        churchName: "MFM Children's Ministry",
      })
      setCardUrl(url)
      playNav()
    } finally {
      setRendering(false)
    }
  }

  const shareCard = async () => {
    if (!cardUrl) return
    try {
      const blob = await (await fetch(cardUrl)).blob()
      const file = new File([blob], 'my-id-card.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Children's Ministry ID Card" })
        return
      }
    } catch {
      // fall through to opening the image
    }
    window.open(cardUrl, '_blank')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel space-y-3 p-5">
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
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about me…" rows={2} className={inputClass} />
        <input value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="Favorite Bible verse" className={inputClass} />
        <input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Favorite quote" className={inputClass} />
        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-400">
            <Check className="h-4 w-4" /> Saved
          </p>
        )}
        <button onClick={save} disabled={saving} className="btn-solid w-full py-3">
          {saving ? 'Saving…' : 'Save My Profile'}
        </button>
      </div>

      <div className="panel space-y-3 p-5 text-center">
        <p className="eyebrow">My Digital ID Card</p>
        {cardUrl ? (
          <img src={cardUrl} alt="My ID card" className="mx-auto max-w-[260px] rounded-lg shadow-xl" />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">Generate a shareable card with your photo, verse, and points.</p>
        )}
        <div className="flex justify-center gap-2">
          <button onClick={makeCard} disabled={rendering} className="btn-outline flex items-center gap-1.5 text-sm">
            <Sparkles className="h-4 w-4" /> {rendering ? 'Making…' : cardUrl ? 'Re-generate' : 'Generate Card'}
          </button>
          {cardUrl && (
            <button onClick={shareCard} className="btn-solid flex items-center gap-1.5 text-sm">
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MessagesTab({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!myId) return
    getOrCreateConversation(teacherId, myId).then((id) => {
      setConversationId(id)
      listMessages(id).then(setMessages)
    })
  }, [teacherId, myId])

  const send = async () => {
    if (!draft.trim() || !conversationId) return
    await sendMessage(conversationId, draft)
    setDraft('')
    playClick()
    listMessages(conversationId).then(setMessages)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold">Chat with {teacherName}</h3>
      <div className="panel space-y-2 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-[var(--gold)]/15 text-right' : 'bg-white/5'}`}>
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-sm text-[var(--ink-faint)]">Say hi to your teacher!</p>}
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

function ConfessTab({ klass }: { klass: (ClassRow & { teacher_name: string }) | null }) {
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<ConfessionRow[]>([])

  const load = () => listMyConfessions().then(setHistory)
  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    if (!body.trim() || !klass) return
    setSubmitting(true)
    try {
      await submitConfession({ class_id: klass.id, teacher_id: klass.teacher_id, body, is_anonymous: anonymous })
      setBody('')
      playClick()
      haptics.success()
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[var(--gold)]/25 bg-[var(--gold)]/10 p-4 text-sm text-[var(--gold)]">
        A safe place to tell your teacher anything, a prayer request, a confession, or just something on your mind. If you or someone you know is
        ever in danger, please tell a trusted adult right away.
      </div>
      <div className="panel space-y-3 p-5">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write anything on your mind…" rows={4} className={inputClass} />
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setAnonymous(true)}
            className={`rounded-md border p-3 text-left text-sm transition ${anonymous ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-[var(--hairline-strong)] hover:border-white/30'}`}
          >
            <p className="font-bold">Anonymous</p>
            <p className="text-[var(--ink-muted)]">Your teacher won&apos;t know it&apos;s you.</p>
          </button>
          <button
            onClick={() => setAnonymous(false)}
            className={`rounded-md border p-3 text-left text-sm transition ${!anonymous ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-[var(--hairline-strong)] hover:border-white/30'}`}
          >
            <p className="font-bold">With My Name</p>
            <p className="text-[var(--ink-muted)]">Your teacher can follow up with you.</p>
          </button>
        </div>
        <button onClick={submit} disabled={submitting || !klass} className="btn-solid w-full py-3">
          {submitting ? 'Sending…' : 'Send'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow">My Messages</p>
          {history.map((c) => (
            <div key={c.id} className="panel p-4">
              <p className="text-sm text-white/80">{c.body}</p>
              {c.reply && (
                <div className="mt-2 rounded-md bg-[var(--gold)]/10 p-3 text-sm">
                  <p className="mb-1 font-semibold text-[var(--gold)]">Your teacher&apos;s reply:</p>
                  <p>{c.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
