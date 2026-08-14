# JapaneseForToday

A mobile-first JLPT N4 and N3 study app for kanji, vocabulary, grammar, real-life reading, flashcards, custom sessions, and adaptive tests.

## Included

- 167 N4 kanji plus the exact user-provided 370-kanji N3 catalog
- 571 N4 vocabulary entries plus the exact user-provided 192-word N3 catalog
- 84 N5, 132 N4, and 182 N3 grammar points
- 81 N4 reading drills and 15 longer N3 exam-style passages based on forms, notices, work, travel, services, and everyday incidents
- Adjustable daily kanji, vocabulary, and grammar counts up to the complete active catalog
- A custom-session builder that can study or test any selected learned or unlearned items across levels
- Vocabulary tests that keep the Japanese spelling and hiragana together and test meaning/recognition instead of kanji reading recall
- Reading aids shown openly for kanji and vocabulary, while sentence and reading-passage help stays behind an optional reveal
- Per-item SRS history, selective progress repair, full JSON backup/import, and editable local catalogs
- A comparable 1,000-point profile score and authenticated Supabase leaderboard
- Persistent Supabase sessions, local fallback profiles, a password visibility button, and no post-login quiz popup
- Responsive navigation with a back action on every signed-in subpage, smoother motion, PWA caching, and Vercel/Netlify SPA routing

## Run locally

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Connect or update Supabase

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. In Supabase, open **SQL Editor** and run `supabase/schema.sql`.
4. In **Authentication → URL Configuration**, add the local and production URLs.
5. Restart the app.

Existing `user_progress` rows remain compatible. Running the updated schema adds the privacy-safe `user_scores` table used by the leaderboard. Row Level Security lets each user edit only their own progress and score; signed-in users can read display names and overall scores for comparison. Email addresses are not stored in the leaderboard table.

The browser app must only use the publishable/anon key. Never add a database password or service-role key to `.env.local`, and never commit that file.

## Verify

```bash
npm test
npm run lint
npm run build
npm run test:browser
```

The browser check covers N3 switching, custom study, open vocabulary readings, global back navigation, the lack of a login quiz popup, responsive layouts, profile scoring, and the password eye control.

If source lesson data changes, rebuild generated pronunciation aids:

```bash
npm run data:romaji
npm run data:support
```

## Deploy

### Vercel

The included `vercel.json` provides the single-page-app rewrite.

- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment

### Netlify

The existing `netlify.toml` and `public/_redirects` provide the same SPA fallback.

- Build command: `npm run build`
- Publish directory: `dist`

## Overall score

The profile score is capped at 1,000 points and factors in kanji completion (220), vocabulary completion (220), grammar completion (180), reading completion (160), quiz/reading accuracy (140), and study consistency across 30 active days (80). The same formula is used for every user.

## Data design

Static lesson catalogs stay versioned with the app. Per-user progress is cached in localStorage and synchronized as one JSON document in `user_progress`; the compact leaderboard projection is stored separately in `user_scores`. This keeps the existing Supabase/Vercel architecture intact while adding N3 and comparison features.
