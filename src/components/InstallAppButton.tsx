import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { playClick } from '../lib/sound'
import { haptics } from '../lib/haptics'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

/**
 * A real, discoverable "Install App" button instead of relying on people to
 * notice the tiny install icon Chrome/Edge tuck into the address bar.
 * Android and desktop Chrome/Edge get a genuine one-tap install (captures
 * `beforeinstallprompt`, which the browser only fires when the manifest and
 * service worker already qualify - both already true here). iOS has no such
 * API at all (Apple's choice, not a gap in this app) - Safari only offers
 * Add to Home Screen manually, so this shows a quick how-to instead. Renders
 * nothing once already installed/running standalone, or on a browser that
 * supports neither path (e.g. desktop Firefox).
 */
export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (installed) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [installed])

  if (installed) return null
  if (!deferredPrompt && !isIOS()) return null

  const handleClick = async () => {
    playClick()
    haptics.tap()
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
      return
    }
    setShowIosHint((v) => !v)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        className="btn-outline flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
        title="Install this app on your device"
      >
        <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
        Install App
      </button>
      {showIosHint && (
        <div className="panel absolute right-0 top-full z-50 mt-2 w-64 p-4 text-left text-sm">
          <p className="font-semibold">Add to Home Screen</p>
          <p className="mt-1 text-[var(--ink-muted)]">
            Tap the Share icon in Safari, then &quot;Add to Home Screen&quot;. It&apos;ll open full-screen from your
            home screen from then on, no browser bar.
          </p>
          <button onClick={() => setShowIosHint(false)} className="mt-2 text-xs font-semibold text-[var(--gold)]">
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
