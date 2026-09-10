# MFM Children's Ministry Bible Quiz

A full Children's Ministry platform for MFM: teacher and student accounts, classes, a leaderboard, messaging, and
a private confession box, built around a "Who Wants to Be a Millionaire" style Bible quiz. The quiz itself is fully
offline (installable as an app, no server needed to play); accounts, classes, messaging, and the leaderboard need
an internet connection since they're backed by Supabase.

## Accounts & classes

There are three separate portals, all inside this one app:

- **🛡️ Admin (`/admin`)** — for the senior pastor / ministry admin only. Approves teacher applications, manages
  seasons, sees every class, and can promote other admins. Admin access is never self-service: signing up just
  creates a normal account, an existing admin has to promote it (see "First admin account" below).
- **👩‍🏫 Teacher (`/teacher`)** — sign up, fill out a short "Apply to Teach" form, and wait for admin approval.
  Once approved, a teacher can create classes (each gets a join code and a shareable link), build a roster, remove
  or move students between classes, message students, and answer confessions.
- **🧒 Student (`/join` to join, `/student` for the dashboard)** — no email needed. A kid opens their class's link
  or types the class code, taps their name on the roster, and sets a 4-6 digit PIN. From their dashboard they see
  their points and leaderboard position, edit their profile (photo, bio, favorite verse/quote), generate a
  shareable digital ID card, message their teacher, and use the anonymous-or-not confession box.

### First admin account

Admin access can't be requested from the UI on purpose. To make the first admin: open `/admin`, sign up with an
email and password, then run this once in the Supabase SQL editor for the `mfm-childrens-ministry` project
(replace the email):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

After that, that admin can promote anyone else straight from the Admins tab in the Control Centre.

### Deploying the join-class Edge Function

Claiming a roster spot and setting a PIN is handled by a Supabase Edge Function (`supabase/functions/join-class`)
that needs the service role key, so it can't run in the browser. It's written and ready in this repo but still
needs to be deployed once:

```bash
supabase functions deploy join-class --project-ref zdgbatkxjxiecqshnmwh --no-verify-jwt
```

(or deploy it from the Supabase dashboard). Until it's deployed, kids can't complete the "join my class" flow.

## Bible Quiz features

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
- Dexie (IndexedDB) for local, offline quiz data storage
- Supabase (Postgres, Auth, Edge Functions) for accounts, classes, messaging, and the leaderboard, in its own
  dedicated project (`mfm-childrens-ministry`), kept separate from any other apps
- `vite-plugin-pwa` for offline caching and installability
