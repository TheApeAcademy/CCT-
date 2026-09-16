import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: "MFM Children's Ministry Bible Quiz",
        short_name: 'Bible Quiz',
        description: "Who Wants to Be a Millionaire style Bible quiz for MFM Children's Ministry Sunday school",
        theme_color: '#1b1030',
        background_color: '#1b1030',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // index.html deliberately NOT precached here (js/css/images still
        // are, for offline play) - this is exactly what bit the /admin
        // routing fix: a precached copy of index.html is served straight
        // from the service worker's cache on every load, so shipping a new
        // index.html (like the redirect script that fixes bare-path URLs)
        // silently didn't reach anyone whose browser already had the app
        // installed/cached, even with skipWaiting+clientsClaim, until an
        // extra reload happened to fall on the right side of the update
        // race. The runtimeCaching rule below replaces it with NetworkFirst
        // for the actual page load: online, it always fetches the latest
        // index.html from the server (matching its own cache-control:
        // max-age=0 already); offline, it falls back to whatever the last
        // successful online load cached, so the offline quiz still works.
        globPatterns: ['**/*.{js,css,svg,png,webp,woff2}'],
        // vite-plugin-pwa registers its own SPA-fallback NavigationRoute
        // (pointed at the now-unprecached index.html) by default, and
        // ahead of runtimeCaching in the generated route order - it would
        // silently swallow every navigation before the NetworkFirst rule
        // below ever got a turn. Denying every path from that default
        // route is what actually hands navigations to my rule instead.
        navigateFallbackDenylist: [/.*/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              // Explicit rather than relying on NetworkFirst's own default
              // cacheability check - this cache is the only thing standing
              // between a fully offline cold-start (opening the installed
              // app/icon with zero network) and a browser error page, so it
              // needs to actually populate on every successful online load.
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
