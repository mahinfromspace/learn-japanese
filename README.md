# N4 Daily

A mobile-first, local-first JLPT N4 study app for kanji, vocabulary, grammar, reading, flashcards, and adaptive tests.

## Included

- 167 N4-specific kanji with canonical detail pages and quick previews
- 571 N4 vocabulary entries with readings, romaji, context notes, and examples
- 84 N5 and 132 N4 grammar points
- 81 original N4 reading drills across notices, email, work, travel, school, shopping, health, safety, timetables, and information-retrieval formats
- 10 or more contextual examples on every kanji detail page, grouped by on’yomi and kun’yomi
- Daily 5 kanji, 20 vocabulary words, and 5 grammar points
- Optional random extra kanji that do not change official completion estimates
- Touch flip cards, swipe rating, SRS due dates, rotating tests, and return-time one-question quizzes
- Searchable Library for kanji, vocabulary, grammar, readings, and sentences
- Local Data Studio for edits, custom content, archiving, selective resets, and JSON backup/import
- Installable PWA behavior and offline caching after the first production visit

The app opens on a login screen. Without Supabase keys it creates a local profile and stores progress on that device. With Supabase configured it uses email/password authentication, keeps a per-user local cache, and synchronizes the same progress document to Postgres.

## Run Locally

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

### Connect Supabase

1. Copy `.env.example` to `.env.local`.
2. Add the project URL and publishable key from Supabase.
3. In Supabase, open **SQL Editor** and run `supabase/schema.sql`.
4. In **Authentication → URL Configuration**, add your local and production URLs.
5. Restart `npm run dev`.

Never put the database password or service-role key in `.env.local`. The browser app only uses the publishable key. Keep `.env.local` out of Git.

To open the dev server to other devices on your local network:

```bash
npm run dev:network
```

## Verify

```bash
npm test
npm run lint
npm run build
```

The optional full browser check uses a packaged headless Chromium:

```bash
npm run test:browser
```

## Deploy

### Netlify

The included `netlify.toml` configures the build and SPA fallback.

1. Push the project to GitHub or upload it to Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel or Cloudflare Pages

Use `npm run build` and publish `dist`. Configure every unknown route to rewrite to `/index.html` so direct detail-page URLs work.

## Database Design

The included first deployment uses one protected JSON progress document per authenticated user. Row Level Security ensures users can only read and write their own row. Static lesson data stays versioned with the app. This keeps the first deployment simple while retaining the localStorage cache and JSON import/export.

When you later add N3/N2/N1 or a multi-editor content system, normalize the catalogs into separate kanji, vocabulary, grammar, reading, example, and relationship tables without changing the existing progress API all at once.

## Content Notes

The JLPT does not publish a fixed official vocabulary, kanji, or grammar list. The catalogs in this app are study targets assembled from the user-provided JLPT Sensei lists; examples, reading passages, explanations, and app behavior are original to this project. The official JLPT test-item descriptions informed the quiz and reading formats.

Data builders are kept in `scripts/` so list extraction and romaji preprocessing are reproducible. The generated catalog files are committed so the running app never needs those websites or a dictionary server.
