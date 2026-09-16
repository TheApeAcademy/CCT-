import { useEffect, useRef, useState } from 'react'
import { Music, Video, FileText, StickyNote, File as FileIcon, Trash2, Download, Upload, Play, ChevronUp, type LucideIcon } from 'lucide-react'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { DigitalBankFile } from '../db/types'

const BANK_CATEGORY_ICON: Record<DigitalBankFile['category'], LucideIcon> = {
  song: Music,
  video: Video,
  doc: FileText,
  note: StickyNote,
  other: FileIcon,
}

function guessBankCategory(mimeType: string): DigitalBankFile['category'] {
  if (mimeType.startsWith('audio/')) return 'song'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  return 'other'
}

/** Whether this entry can play/preview inline instead of only downloading. */
function isPreviewable(f: DigitalBankFile): boolean {
  return f.category === 'note' || f.mimeType.startsWith('audio/') || f.mimeType.startsWith('video/') || f.mimeType === 'application/pdf'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CATEGORY_LABEL: Record<'all' | DigitalBankFile['category'], string> = {
  all: 'All',
  song: 'Songs',
  video: 'Videos',
  doc: 'Docs',
  note: 'Notes',
  other: 'Other',
}

/**
 * Any file or note related to the ministry that doesn't belong in a
 * question set or a Bible reading plan - songs, videos, docs, quick
 * write-ups. Stored locally in this browser's IndexedDB for now (not
 * Supabase Storage), so it works offline like the rest of the quiz but
 * doesn't sync across devices yet. Shared across Admin, Teacher, and
 * Student portals - `canManage` gates upload/write/delete so a kid can
 * browse, play, and download but not add or remove anything.
 */
export default function DigitalBank({ canManage = true }: { canManage?: boolean }) {
  const [files, setFiles] = useState<DigitalBankFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | DigitalBankFile['category']>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')

  const load = () =>
    db.digitalBankFiles
      .orderBy('uploadedAt')
      .reverse()
      .toArray()
      .then((rows) => {
        setFiles(rows)
        setLoading(false)
      })
  useEffect(() => {
    load()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files
    if (!picked || picked.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(picked)) {
        await db.digitalBankFiles.add({
          name: file.name,
          category: guessBankCategory(file.type),
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          blob: file,
          uploadedAt: Date.now(),
        })
      }
      playClick()
      haptics.success()
      load()
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSaveNote = async () => {
    const title = noteTitle.trim()
    const body = noteBody.trim()
    if (!title || !body) return
    await db.digitalBankFiles.add({
      name: title,
      category: 'note',
      mimeType: 'text/plain',
      size: new Blob([body]).size,
      textContent: body,
      uploadedAt: Date.now(),
    })
    setNoteTitle('')
    setNoteBody('')
    setShowNoteForm(false)
    playClick()
    haptics.success()
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry? This only removes it from this device/browser.')) return
    await db.digitalBankFiles.delete(id)
    if (expandedId === id) setExpandedId(null)
    haptics.tap()
    load()
  }

  const toggleExpand = (id: number) => {
    playClick()
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const visible = filter === 'all' ? files : files.filter((f) => f.category === filter)
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="panel space-y-3 p-5">
          <p className="eyebrow">Add to the Digital Bank</p>
          <p className="text-xs text-[var(--ink-muted)]">
            Songs, videos, docs, or a quick note — anything related to the ministry. Stored locally on this
            device/browser for now, not shared across devices yet. Audio, video, and notes play instantly right here.
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="btn-solid inline-flex w-fit cursor-pointer items-center gap-2 px-4 py-2 text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Choose Files'}
              <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button
              onClick={() => {
                setShowNoteForm((v) => !v)
                playClick()
              }}
              className="btn-outline inline-flex w-fit items-center gap-2 px-4 py-2 text-sm"
            >
              <StickyNote className="h-4 w-4" /> {showNoteForm ? 'Cancel Note' : 'Write a Note'}
            </button>
          </div>
          {showNoteForm && (
            <div className="space-y-2 rounded-xl bg-[var(--ink-panel)] p-4">
              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
              />
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Write it here…"
                rows={4}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
              />
              <button
                onClick={handleSaveNote}
                disabled={!noteTitle.trim() || !noteBody.trim()}
                className="btn-solid px-4 py-2 text-sm disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'song', 'video', 'doc', 'note', 'other'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                filter === c ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'bg-[var(--ink-panel)] text-[var(--ink-muted)] hover:bg-[var(--ink-raised)]'
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--ink-faint)]">
          {files.length} item{files.length === 1 ? '' : 's'} · {formatBytes(totalSize)} on this device
        </span>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="space-y-2">
        {!loading && visible.length === 0 && <p className="text-sm text-[var(--ink-faint)]">Nothing here yet.</p>}
        {visible.map((f) => {
          const Icon = BANK_CATEGORY_ICON[f.category]
          const expanded = expandedId === f.id
          const previewable = isPreviewable(f)
          const download = () => {
            const blob = f.blob ?? new Blob([f.textContent ?? ''], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = f.category === 'note' ? `${f.name}.txt` : f.name
            a.click()
            URL.revokeObjectURL(url)
          }
          return (
            <div key={f.id} className="panel gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => (previewable ? toggleExpand(f.id!) : undefined)}
                  disabled={!previewable}
                  className={`flex min-w-0 flex-1 items-center gap-3 text-left ${previewable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{f.name}</p>
                    <p className="text-xs text-[var(--ink-faint)]">
                      {f.category === 'note' ? 'Note' : formatBytes(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 gap-2">
                  {previewable && (
                    <button onClick={() => toggleExpand(f.id!)} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm">
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {expanded ? 'Close' : f.category === 'note' ? 'Read' : 'Play'}
                    </button>
                  )}
                  <button onClick={download} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(f.id!)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-600 transition hover:scale-105 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
              {expanded && <InlinePreview file={f} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Renders the actual playable/readable content for an expanded row - a fresh object URL per mount, revoked on collapse/unmount so nothing leaks. */
function InlinePreview({ file }: { file: DigitalBankFile }) {
  const [url, setUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!file.blob) return
    const objectUrl = URL.createObjectURL(file.blob)
    urlRef.current = objectUrl
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
      urlRef.current = null
    }
  }, [file.blob])

  if (file.category === 'note') {
    return <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--ink-panel)] p-4 text-sm">{file.textContent}</p>
  }
  if (!url) return null
  if (file.mimeType.startsWith('audio/')) {
    return (
      <audio controls autoPlay className="mt-3 w-full">
        <source src={url} type={file.mimeType} />
      </audio>
    )
  }
  if (file.mimeType.startsWith('video/')) {
    return <video controls autoPlay className="mt-3 w-full rounded-lg" src={url} />
  }
  if (file.mimeType === 'application/pdf') {
    return <iframe title={file.name} src={url} className="mt-3 h-96 w-full rounded-lg border border-[var(--hairline-strong)]" />
  }
  return null
}
