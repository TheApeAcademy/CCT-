# MFM Children's Ministry

The digital home of MFM Wuye's Children's Ministry: four separate portals for children, teachers, ministry
admins and parents, built around a "Who Wants to Be a Millionaire" style Bible quiz.

The quiz itself is fully offline and installable as an app, so a Sunday school teacher can run a match with no
wifi in the room. Accounts, classes, messaging, attendance and the leaderboard are backed by Supabase and need a
connection.

A guided tour of every feature lives in the app itself at `/features` ("Everything Inside").

## The four portals

There is no shared navigation between them. Each is its own door with its own sign-in, deliberately.

- **Children (`/join` to sign up, `/student` for the dashboard).** No email address. A child types their name,
  gets a passcode built from it that they can actually remember (e.g. `joshmfm7`), and that name plus passcode is
  how they sign in from then on. Inside: Bible Journey lessons, a character collection, the quiz, achievements,
  a prayer globe, their digital ID card, messages to their teacher, "Ears for You" (the private box for telling
  a trusted adult something), and Bible Buddy.
- **Teachers (`/teacher`).** Sign up, fill in a short "Apply to Teach" form, wait for admin approval. Once
  approved: create classes (each with a join code and shareable link), manage the roster, take attendance, set
  and mark assignments, message students, and handle what comes in through Ears for You.
- **Admins (`/admin`).** For the ministry admin. Approves teacher applications, manages seasons, oversees every
  class, and promotes other admins. Admin access is never self-service; see "First admin account" below.
- **Parents (`/parent`).** Create an account, enter the Parent Link Code from their child's profile (it starts
  with `FAM`), and follow that child's streak, lessons, attendance, badges, and a simple monthly rating.

### First admin account

Admin access can't be requested from the UI on purpose. To make the first admin: open `/admin`, sign up with an
email and password, then run this once in the Supabase SQL editor for the `mfm-childrens-ministry` project
(replace the email):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

After that, that admin can promote anyone else straight from the Admins tab in the Control Centre.

## Supabase Edge Functions

Three functions live in `supabase/functions/`. They hold secrets that must never reach a browser.

```bash
supabase functions deploy join-class       --project-ref zdgbatkxjxiecqshnmwh --no-verify-jwt
supabase functions deploy student-register --project-ref zdgbatkxjxiecqshnmwh --no-verify-jwt
supabase functions deploy ai-companion     --project-ref zdgbatkxjxiecqshnmwh
```

- `student-register` and `join-class` create a child's account and claim their roster spot. They need the
  service role key, so they can't run client-side. Until they're deployed, children can't finish signing up.
- `ai-companion` is Bible Buddy. It keeps `verify_jwt` on, so only a signed-in child can call it, and it is the
  only thing that ever sees the Anthropic key. **It needs a secret set before it will answer anything:**

  ```bash
  supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref zdgbatkxjxiecqshnmwh
  ```

  Without it, Bible Buddy is deployed and reachable but replies that it isn't set up yet.

## The Bible Quiz

- **Fully offline.** Installable as a PWA; once installed it never needs wifi or a server to play.
- **Question Bank.** Add, edit, delete, import and export questions with categories and difficulty levels, from
  the Question Bank page or straight from the New Match screen. Ships with 370 questions across a starter pack
  and an expansion set. Answer options are re-ordered every time a question is drawn, so there's no position a
  child can learn to guess.
- **Seasons.** Run the quiz in seasons, e.g. one per term. Question sets and matches are tagged with whichever
  season is active, so History and Match Results can be grouped by season.
- **Ground rules with a curtain reveal.** Before every match, a "raise the curtain" screen shows the ground
  rules with an optional read-aloud, setting the tone before play begins.
- **Contestant photos.** A photo per team or contestant, shown through the intro, gameplay and results.
- **Multi-team relay.** As many teams or children as are playing. Each takes a turn on the same 10 questions in
  the same order, so scores are directly comparable.
- **Host-led gameplay.** The teacher runs the game on one shared screen: read the question aloud, the child
  answers, the teacher taps their choice. A ticking countdown that gets more urgent near the end, plus three
  lifelines (50/50, Ask the Church, Ask a Friend).
- **No elimination.** A wrong answer reveals the correct one and moves on. Everyone plays all 10 questions.
- **Match Results and History.** A final leaderboard plus a question-by-question recap, saved automatically with
  each child's or team's name, photo and score.
- **Training Mode.** Solo practice against the same question bank, with streaks.
- **Fun and juicy.** Synthesized sound effects and confetti, with no external audio assets.

## Getting started

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
npm run preview
```

`dist/` is a self-contained static site with a service worker. Host it anywhere and it works with no network
connection after the first load. On a phone or tablet, use "Add to Home Screen" to install it like a native app.

## Before committing

All three must be clean:

```bash
npx tsc -b
npx oxlint <the files you touched>
npm run build
```

## House style

No em dashes anywhere in the app's copy. Hyphens only.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4, framer-motion, lucide-react
- Dexie (IndexedDB) for the offline quiz data
- Supabase (Postgres, Auth, Row Level Security, Edge Functions) for accounts, classes, messaging, attendance and
  the leaderboard, in its own project (`mfm-childrens-ministry`), kept separate from any other app's data
- `vite-plugin-pwa` for offline caching and installability
