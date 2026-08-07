import { useState } from 'react'
import { getKidProfile, saveKidProfile, clearKidProfile, type KidProfile } from '../lib/kidProfile'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

export function useKidProfile() {
  const [profile, setProfile] = useState<KidProfile | null>(() => getKidProfile())

  const save = (p: KidProfile) => {
    saveKidProfile(p)
    setProfile(p)
  }

  const clear = () => {
    clearKidProfile()
    setProfile(null)
  }

  return { profile, save, clear }
}

export function KidSignupCard({ onDone, subtitle }: { onDone: (profile: KidProfile) => void; subtitle?: string }) {
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!className.trim()) {
      setError('Please enter your class.')
      return
    }
    playClick()
    haptics.success()
    onDone({ name: name.trim(), className: className.trim() })
  }

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-4xl">👋</p>
      <h1 className="font-display text-3xl font-extrabold">Sign Up</h1>
      {subtitle && <p className="text-white/60">{subtitle}</p>}
      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 text-left shadow-lg shadow-black/20">
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/80">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ellie"
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/80">Your class</label>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Primary 2, Junior Church"
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-amber-400/20 transition hover:scale-[1.02]"
        >
          Let's Go →
        </button>
      </div>
    </div>
  )
}

export function KidProfileBar({ profile, onSwitch }: { profile: KidProfile; onSwitch: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-sm">
      <p>
        Signed up as <span className="font-bold text-amber-300">{profile.name}</span>
        <span className="text-white/50"> · {profile.className}</span>
      </p>
      <button onClick={onSwitch} className="rounded-full bg-white/10 px-3 py-1 text-xs transition hover:bg-white/20">
        Not you? Switch
      </button>
    </div>
  )
}
