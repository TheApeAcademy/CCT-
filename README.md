# MFM Children's Ministry Bible Quiz

A "Who Wants to Be a Millionaire" style Bible quiz built for MFM Children's Ministry, for Sunday school teachers and students. Fully offline, installable as an app, and free of any external dependencies at runtime.

## Features

- **Fully offline.** Installable as a PWA (Progressive Web App); once installed it never needs wifi or a server.
- **Seasons.** Run the quiz in seasons (e.g. one per term). Question sets and matches are tagged with the active season, so results can be grouped by season in History and Match Results. Manage seasons from the 🗓️ Seasons page.
- **Question Bank.** Add, edit, delete, import, and export questions with categories and difficulty levels, from a dedicated page or directly from the New Game screen so admins can add questions right before a match. Ships with a 30-question "Bible Basics" starter pack.
- **Ground rules with a curtain reveal.** Before every match, a "raise the curtain" screen shows the ground rules with an optional read-aloud (Web Speech API), setting the tone before play begins.
- **Contestant photos.** Upload a photo per team/contestant when setting up a match; photos show up during intro, gameplay, and on the results screens.
- **Multi-team relay.** Add as many teams or kids as are playing. Each takes a turn answering the same 10 questions, in order, so scores are directly comparable.
- **Host-led gameplay.** A Sunday school teacher runs the game on one shared screen: read the question aloud, the kid answers, the teacher taps their choice. A per-second ticking countdown timer (that gets faster and more alarming near the end) and three lifelines (50/50, Ask the Church, Phone a Friend) keep it lively.
- **No elimination.** A wrong answer just reveals the correct one and moves on. Every team plays all 10 questions, so nobody sits out early.
- **Match Results.** A final leaderboard ranks every team, plus a full question-by-question recap showing the correct answer and how each team did.
- **History.** Every completed turn is saved automatically with the kid's or team's name, photo, score, and a full recap.
- **Anthem.** A children's ministry anthem with lyrics and a read-aloud, on the 🎶 Anthem page.
- **Fun and juicy.** Synthesized sound effects and confetti, no external audio/image assets required.

## Branding assets

`public/church-logo.svg` and `public/cover.svg` are placeholder artwork drawn to match the app's colors. Swap them
for the ministry's real logo and cover photo by replacing those two files (keep the same filenames and the app
picks them up automatically).

## Getting started

```bash
npm install
npm run dev
```

## Building for production / offline use

```bash
npm run build
npm run preview
```

The production build in `dist/` is a self-contained static site with a service worker. Host it anywhere (or open it locally) and it will work with no network connection after the first load. On a phone or tablet, open it in the browser and use "Add to Home Screen" to install it like a native app.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Dexie (IndexedDB) for local, offline data storage
- `vite-plugin-pwa` for offline caching and installability
