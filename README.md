# Children's Church Trivia

A "Who Wants to Be a Millionaire" style trivia game built for children's church. Fully offline, installable as an app, and free of any external dependencies at runtime.

## Features

- **Fully offline.** Installable as a PWA (Progressive Web App); once installed it never needs wifi or a server.
- **Question Bank.** Add, edit, delete, import, and export questions with categories and difficulty levels. Ships with a 30-question "Bible Basics" starter pack.
- **Multi-team relay.** Add as many teams or kids as are playing. Each takes a turn answering the same 10 questions, in order, so scores are directly comparable.
- **Host-led gameplay.** A Sunday school teacher runs the game on one shared screen: read the question aloud, the kid answers, the teacher taps their choice. A countdown timer per question and three lifelines (50/50, Ask the Church, Phone a Friend) keep it lively.
- **No elimination.** A wrong answer just reveals the correct one and moves on. Every team plays all 10 questions, so nobody sits out early.
- **Match Results.** A final leaderboard ranks every team, plus a full question-by-question recap showing the correct answer and how each team did.
- **History.** Every completed turn is saved automatically with the kid's or team's name, score, and a full recap.
- **Fun and juicy.** Synthesized sound effects and confetti, no external audio/image assets required.

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
