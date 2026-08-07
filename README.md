# Children's Church Trivia

A "Who Wants to Be a Millionaire" style trivia game built for children's church — fully offline, installable as an app, and free of any external dependencies at runtime.

## Features

- **Fully offline** — installable as a PWA (Progressive Web App); once installed it never needs wifi or a server.
- **Question Bank** — add, edit, delete, import, and export questions with categories and difficulty levels. Ships with a 30-question "Bible Basics" starter pack.
- **Host-led gameplay** — a classic 10-level money ladder with checkpoints, a countdown timer per question, and three lifelines: 50/50, Ask the Church, and Phone a Friend.
- **Walk away or push your luck** — bank points after each correct answer, or keep going for a bigger prize.
- **History** — every completed game is saved automatically with the kid's/team's name, score, level reached, lifelines used, and a full question-by-question recap. Includes a simple leaderboard.
- **Fun & juicy** — synthesized sound effects and confetti, no external audio/image assets required.

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

The production build in `dist/` is a self-contained static site with a service worker — host it anywhere (or open it locally) and it will work with no network connection after the first load. On a phone or tablet, open it in the browser and use "Add to Home Screen" to install it like a native app.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Dexie (IndexedDB) for local, offline data storage
- `vite-plugin-pwa` for offline caching and installability
