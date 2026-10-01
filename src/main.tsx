import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/baloo-2/latin-600.css'
import '@fontsource/baloo-2/latin-700.css'
import '@fontsource/baloo-2/latin-800.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-900.css'
import './index.css'
import App from './App.tsx'

/**
 * Password reset links land here first.
 *
 * Supabase sends people back to the site root carrying "?code=..." (PKCE - see
 * lib/supabase.ts for why the fragment-based flow is unusable under
 * HashRouter). That code has to be traded for a session before anything
 * renders, because the router owns the hash and would otherwise race us for
 * it. So this runs first, moves the app to #/reset-password, and scrubs the
 * code out of the address bar so a reset link can never be re-shared or land
 * in browser history in a usable state.
 *
 * Nothing here is imported unless a code is actually present: a child opening
 * the offline quiz never fetches the Supabase bundle because of this.
 */
async function consumePasswordResetLink(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const failed = params.get('error') ?? params.get('error_code')
  if (!code && !failed) return

  if (code) {
    try {
      const { supabase } = await import('./lib/supabase')
      await supabase.auth.exchangeCodeForSession(code)
    } catch {
      // Expired, already used, or opened in a different browser from the one
      // that asked for it. The reset screen handles having no session: it
      // explains the link is dead and offers a fresh one.
    }
  }

  window.history.replaceState(null, '', `${window.location.pathname}#/reset-password`)
}

consumePasswordResetLink().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
