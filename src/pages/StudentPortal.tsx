import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, signOut } from '../lib/supabase'
import { useMinistryAuth } from '../lib/useMinistryAuth'
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

export default function StudentPortal() {
  const { session, profile, loading } = useMinistryAuth()

  if (loading) return <div className="py-20 text-center text-xl">Loading…</div>
  if (!session || profile?.role !== 'student') {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-4xl">🧒</p>
        <h1 className="font-display text-3xl font-extrabold">Kids' Dashboard</h1>
        <p className="text-white/60">You need to join your class first to get your own dashboard.</p>
        <Link
          to="/join"
          className="inline-block rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-3 font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-105"
        >
          🔑 Join My Class
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

  const load = () => {
    getMyStudentProfile().then(setStudent)
    getMyClass().then(setKlass)
  }
  useEffect(() => { load() }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {student?.avatar_url ? (
            <img src={student.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-400/60" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/20 text-2xl">🧒</span>
          )}
          <div>
            <h1 className="font-display text-xl font-extrabold">{student?.full_name ?? 'My Dashboard'}</h1>
            <p className="text-sm text-white/50">{klass?.name ?? 'No class yet'}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          Sign Out
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['home', '🏠 Home'],
            ['leaderboard', '🏆 Leaderboard'],
            ['profile', '🪪 My Card'],
            ['messages', '💬 My Teacher'],
            ['confess', '🙏 Confession Box'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-amber-400 text-purple-950' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'home' && <HomeTab student={student} klass={klass} />}
      {tab === 'leaderboard' && <LeaderboardTab myId={student?.id ?? null} />}
      {tab === 'profile' && student && <ProfileTab student={student} klass={klass} onSaved={load} />}
      {tab === 'messages' && klass && <MessagesTab teacherId={klass.teacher_id} teacherName={klass.teacher_name} />}
      {tab === 'confess' && <ConfessTab klass={klass} />}
    </div>
  )
}

function HomeTab({ student, klass }: { student: StudentRow | null; klass: (ClassRow & { teacher_name: string }) | null }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-purple-800/60 to-indigo-900/60 p-6 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-wide text-white/60">Your Points</p>
        <p className="font-display text-5xl font-extrabold text-amber-300">{(student?.total_points ?? 0).toLocaleString()} 👑</p>
        {klass && <p className="mt-2 text-white/60">in {klass.name}, with {klass.teacher_name}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/training" onClick={() => playClick()} className="rounded-2xl border border-white/5 bg-white/5 p-6 transition hover:scale-[1.02] hover:bg-white/10">
          <span className="text-3xl">🏋️</span>
          <p className="mt-2 font-display text-lg font-bold">Practice Bible Quiz</p>
          <p className="text-sm text-white/60">Unlimited solo practice, no pressure, no timer.</p>
        </Link>
        <Link to="/transition" onClick={() => playClick()} className="rounded-2xl border border-white/5 bg-white/5 p-6 transition hover:scale-[1.02] hover:bg-white/10">
          <span className="text-3xl">🎓</span>
          <p className="mt-2 font-display text-lg font-bold">Transition Class</p>
          <p className="text-sm text-white/60">Get ready for teenage church.</p>
        </Link>
        <Link to="/anthem" onClick={() => playClick()} className="rounded-2xl border border-white/5 bg-white/5 p-6 transition hover:scale-[1.02] hover:bg-white/10">
          <span className="text-3xl">🎶</span>
          <p className="mt-2 font-display text-lg font-bold">Our Anthem</p>
          <p className="text-sm text-white/60">Sing along with the children's ministry anthem.</p>
        </Link>
        <div className="rounded-2xl border border-dashed border-white/20 p-6 text-white/50">
          <span className="text-3xl">🎮</span>
          <p className="mt-2 font-display text-lg font-bold">Live Quiz Match</p>
          <p className="text-sm">Ask your teacher to start a live match on the big screen for your class!</p>
        </div>
      </div>
    </div>
  )
}

function LeaderboardTab({ myId }: { myId: string | null }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(setRows).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50">Loading…</p>
  if (rows.length === 0) return <p className="text-white/50">No quiz points recorded yet. Be the first to play!</p>

  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.student_id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${r.student_id === myId ? 'bg-amber-400/15 ring-1 ring-amber-400/40' : 'bg-white/5'}`}>
          <div className="flex items-center gap-3">
            <span className="w-8 text-center">{medal(i)}</span>
            {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="text-xl">👤</span>}
            <div>
              <p className="font-semibold">{r.full_name}</p>
              <p className="text-xs text-white/50">{r.class_name}</p>
            </div>
          </div>
          <p className="font-bold text-amber-300">{r.total_points.toLocaleString()} 👑</p>
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
        await navigator.share({ files: [file], title: 'My Children\'s Ministry ID Card' })
        return
      }
    } catch {
      // fall through to opening the image
    }
    window.open(cardUrl, '_blank')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            {avatar ? (
              <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/60" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-2xl">🧒</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          <p className="text-sm text-white/60">Tap your photo to change it</p>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A little about me…"
          rows={2}
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          value={verse}
          onChange={(e) => setVerse(e.target.value)}
          placeholder="Favorite Bible verse"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Favorite quote"
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        {saved && <p className="text-sm text-green-400">Saved! ✅</p>}
        <button onClick={save} disabled={saving} className="w-full rounded-2xl bg-amber-400 py-3 font-bold text-purple-950 transition hover:scale-[1.02] disabled:opacity-60">
          {saving ? 'Saving…' : 'Save My Profile'}
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 text-center shadow-lg shadow-black/20">
        <p className="font-display font-bold">🪪 My Digital ID Card</p>
        {cardUrl ? (
          <img src={cardUrl} alt="My ID card" className="mx-auto max-w-[280px] rounded-2xl shadow-xl" />
        ) : (
          <p className="text-sm text-white/50">Generate a shareable card with your photo, verse, and points.</p>
        )}
        <div className="flex justify-center gap-2">
          <button onClick={makeCard} disabled={rendering} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-60">
            {rendering ? 'Making…' : cardUrl ? '🔄 Re-generate' : '✨ Generate Card'}
          </button>
          {cardUrl && (
            <button onClick={shareCard} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-purple-950 hover:scale-105">
              📤 Share
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
      <h3 className="font-display text-lg font-bold">💬 Chat with {teacherName}</h3>
      <div className="space-y-2 rounded-2xl bg-black/20 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender_id === myId ? 'ml-auto bg-amber-400/20 text-right' : 'bg-white/10'}`}>
            {m.body}
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-sm text-white/40">Say hi to your teacher!</p>}
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

function ConfessTab({ klass }: { klass: (ClassRow & { teacher_name: string }) | null }) {
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<ConfessionRow[]>([])

  const load = () => listMyConfessions().then(setHistory)
  useEffect(() => { load() }, [])

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
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
        A safe place to tell your teacher anything, a prayer request, a confession, or just something on your mind. If you or someone you know is
        ever in danger, please tell a trusted adult right away.
      </div>
      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-black/20">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write anything on your mind…"
          rows={4}
          className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setAnonymous(true)}
            className={`rounded-xl border-2 p-3 text-left text-sm transition ${anonymous ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <p className="font-bold">🕶️ Anonymous</p>
            <p className="text-white/60">Your teacher won't know it's you.</p>
          </button>
          <button
            onClick={() => setAnonymous(false)}
            className={`rounded-xl border-2 p-3 text-left text-sm transition ${!anonymous ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <p className="font-bold">🙋 With my name</p>
            <p className="text-white/60">Your teacher can follow up with you.</p>
          </button>
        </div>
        <button
          onClick={submit}
          disabled={submitting || !klass}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send →'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-bold">My Messages</h3>
          {history.map((c) => (
            <div key={c.id} className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-white/70">{c.body}</p>
              {c.reply && (
                <div className="mt-2 rounded-lg bg-amber-400/10 p-3 text-sm">
                  <p className="mb-1 font-semibold text-amber-300">Your teacher's reply:</p>
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
