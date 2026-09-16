import { useEffect, useState } from 'react'
import { Music, Video, FileText, File as FileIcon, Trash2, Download, Upload, type LucideIcon } from 'lucide-react'
import { db } from '../db/db'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'
import type { DigitalBankFile } from '../db/types'

const BANK_CATEGORY_ICON: Record<DigitalBankFile['category'], LucideIcon> = {
  song: Music,
  video: Video,
  doc: FileText,
  other: FileIcon,
}

function guessBankCategory(mimeType: string): DigitalBankFile['category'] {
  if (mimeType.startsWith('audio/')) return 'song'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  return 'other'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Any file related to the ministry that doesn't belong in a question set or
 * a Bible reading plan - songs, videos, docs, whatever. Stored locally in
 * this browser's IndexedDB for now (not Supabase Storage), so it works
 * offline like the rest of the quiz but doesn't sync across devices yet.
 * Shared across Admin, Teacher, and Student portals - `canManage` gates
 * upload/delete so a kid can browse and download but not remove anything.
 */
export default function DigitalBank({ canManage = true }: { canManage?: boolean }) {
  const [files, setFiles] = useState<DigitalBankFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | DigitalBankFile['category']>('all')

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

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file? This only removes it from this device/browser.')) return
    await db.digitalBankFiles.delete(id)
    haptics.tap()
    load()
  }

  const visible = filter === 'all' ? files : files.filter((f) => f.category === filter)
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="panel space-y-3 p-5">
          <p className="eyebrow">Upload a File</p>
          <p className="text-xs text-[var(--ink-muted)]">
            Songs, videos, docs — anything related to the ministry. Stored locally on this device/browser for now, not shared across devices yet.
          </p>
          <label className="btn-solid inline-flex w-fit cursor-pointer items-center gap-2 px-4 py-2 text-sm">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Choose Files'}
            <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'song', 'video', 'doc', 'other'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                filter === c ? 'bg-[var(--gold)] text-[var(--gold-ink)]' : 'bg-[var(--ink-panel)] text-[var(--ink-muted)] hover:bg-[var(--ink-raised)]'
              }`}
            >
              {c === 'song' ? 'Songs' : c === 'video' ? 'Videos' : c === 'doc' ? 'Docs' : c === 'other' ? 'Other' : 'All'}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--ink-faint)]">
          {files.length} file{files.length === 1 ? '' : 's'} · {formatBytes(totalSize)} on this device
        </span>
      </div>

      {loading && <p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
      <div className="space-y-2">
        {!loading && visible.length === 0 && <p className="text-sm text-[var(--ink-faint)]">No files here yet.</p>}
        {visible.map((f) => {
          const Icon = BANK_CATEGORY_ICON[f.category]
          const download = () => {
            const url = URL.createObjectURL(f.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = f.name
            a.click()
            URL.revokeObjectURL(url)
          }
          return (
            <div key={f.id} className="panel flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--hairline-strong)] text-[var(--gold)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{f.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {formatBytes(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
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
          )
        })}
      </div>
    </div>
  )
}
