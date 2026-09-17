import { useEffect, useState } from 'react'
import { FileText, PenLine, Image as ImageIcon, Mic, Wallet, Upload, Plus, X, Trash2, type LucideIcon } from 'lucide-react'
import {
  listMyVaultItems,
  addVaultNote,
  uploadVaultFile,
  getVaultFileUrl,
  deleteVaultItem,
  listMyNotes,
  createNote,
  deleteNote,
  type VaultCategory,
  type VaultItemRow,
  type NoteKind,
  type PrivateNoteRow,
} from '../lib/ministry'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

const inputClass = 'w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-4 py-3 outline-none focus:border-[var(--gold)]'

const VAULT_CATEGORY_ICON: Record<VaultCategory, LucideIcon> = {
  assignment: FileText,
  note: PenLine,
  photo: ImageIcon,
  audio: Mic,
  other: Wallet,
}

/**
 * A private place to keep files that matter - finished assignments, notes,
 * photos, voice notes. Text notes are stored inline; anything with an
 * actual file goes to the private `vault` storage bucket, under a folder
 * named for the signed-in user's own auth id. Shared as-is between the
 * kids' Home phone and the Teacher Home dashboard - the backing table is
 * keyed on auth.uid() only, so it works unchanged for either role.
 */
export function DigitalBankSection() {
  const [items, setItems] = useState<VaultItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')

  const load = () => listMyVaultItems().then(setItems).finally(() => setLoading(false))
  useEffect(() => {
    load()
  }, [])

  const onPick = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const category: VaultCategory = file.type.startsWith('image/') ? 'photo' : file.type.startsWith('audio/') ? 'audio' : 'other'
      await uploadVaultFile(file, category, file.name)
      playClick()
      haptics.success()
      load()
    } finally {
      setUploading(false)
    }
  }

  const saveNote = async () => {
    if (!noteBody.trim()) return
    await addVaultNote(noteTitle || 'Note', noteBody)
    setNoteTitle('')
    setNoteBody('')
    setAdding(false)
    playClick()
    load()
  }

  const openItem = async (item: VaultItemRow) => {
    if (!item.file_path) return
    const url = await getVaultFileUrl(item.file_path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const remove = async (item: VaultItemRow) => {
    await deleteVaultItem(item)
    haptics.success()
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Digital Bank</p>
        <div className="flex items-center gap-1.5">
          <label className="flex cursor-pointer items-center gap-1 rounded-full border border-[var(--hairline-strong)] px-2.5 py-1 text-xs font-bold text-[var(--ink-muted)] transition hover:text-[var(--fg)]">
            <Upload className="h-3 w-3" /> {uploading ? 'Uploading…' : 'Add file'}
            <input type="file" className="hidden" disabled={uploading} onChange={(e) => onPick(e.target.files?.[0])} />
          </label>
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-[var(--hairline-strong)] px-2.5 py-1 text-xs font-bold text-[var(--ink-muted)] transition hover:text-[var(--fg)]"
          >
            <Plus className="h-3 w-3" /> Note
          </button>
        </div>
      </div>

      {adding && (
        <div className="mt-2 space-y-2 rounded-2xl border border-[var(--hairline)] bg-[var(--ink-panel)] p-4">
          <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title (optional)" className={inputClass} />
          <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write it down…" rows={3} className={inputClass} />
          <button onClick={saveNote} className="btn-solid w-full py-2 text-sm">
            Save to Bank
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {!loading && items.length === 0 && !adding && (
          <p className="col-span-full text-center text-sm text-[var(--ink-muted)]">
            Empty for now - save finished assignments, notes, photos, or voice notes here.
          </p>
        )}
        {items.map((item) => {
          const Icon = VAULT_CATEGORY_ICON[item.category]
          return (
            <div key={item.id} className="group relative rounded-2xl border border-[var(--hairline)] bg-[var(--ink-panel)] p-4">
              <button
                onClick={() => remove(item)}
                className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:text-white group-hover:flex"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => (item.file_path ? openItem(item) : undefined)} className="flex w-full flex-col items-start gap-2 text-left">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'color-mix(in srgb, var(--gold) 18%, transparent)', color: 'var(--gold)' }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="w-full truncate text-sm font-bold">{item.title}</p>
                {item.note && <p className="line-clamp-2 text-xs text-[var(--ink-muted)]">{item.note}</p>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Fully private free-text notes (Notebook / Diary / Prayer Journal on the
 * kids' side, Notes on the Teacher dashboard) - no teacher/admin policy
 * exists on this table at all, by design; it's keyed on auth.uid() alone.
 */
export function NotesSection({
  kind,
  title,
  icon: Icon,
  accent,
  placeholder,
}: {
  kind: NoteKind
  title: string
  icon: LucideIcon
  accent: string
  placeholder: string
}) {
  const [notes, setNotes] = useState<PrivateNoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')

  const load = () =>
    listMyNotes(kind)
      .then(setNotes)
      .finally(() => setLoading(false))
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    if (!draftBody.trim()) return
    await createNote(kind, draftTitle, draftBody)
    setDraftTitle('')
    setDraftBody('')
    setAdding(false)
    playClick()
    load()
  }

  const remove = async (id: string) => {
    await deleteNote(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} /> {title}
        </p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-[var(--hairline-strong)] px-2.5 py-1 text-xs font-bold text-[var(--ink-muted)] transition hover:text-[var(--fg)]"
        >
          {adding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {adding ? 'Cancel' : 'New'}
        </button>
      </div>

      {adding && (
        <div className="mt-2 space-y-2 rounded-2xl border border-[var(--hairline)] bg-[var(--ink-panel)] p-4">
          <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Title (optional)" className={inputClass} />
          <textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} placeholder={placeholder} rows={4} className={inputClass} />
          <button onClick={save} className="btn-solid w-full py-2 text-sm">
            Save Entry
          </button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {!loading && notes.length === 0 && !adding && <p className="text-sm text-[var(--ink-muted)]">Nothing written yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="group relative rounded-2xl border border-[var(--hairline)] bg-[var(--ink-panel)] p-4">
            <button onClick={() => remove(n.id)} className="absolute right-3 top-3 hidden text-[var(--ink-faint)] transition hover:text-red-400 group-hover:block">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {n.title && <p className="pr-6 font-bold">{n.title}</p>}
            <p className="mt-1 whitespace-pre-wrap pr-6 text-sm text-[var(--ink-muted)]">{n.body}</p>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">
              {new Date(n.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
