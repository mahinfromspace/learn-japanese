# JapaneseForToday — AI tutor

## What is included

- Explain words and grammar, correct Japanese sentences, practise questions, and rehearse conversations.
- N4/N3 level and the existing romaji setting are passed to the tutor.
- Focused, tired, and curious study moods control the explanation style. Mood is selected, never inferred.
- Follow-up messages (five replies per conversation), loading/error states, and safe text-based Markdown rendering.
- Server-side Anthropic requests through a Netlify Function. No browser API key and no extra npm dependencies.
- Supabase verifies registered users before any paid AI request. No service-role key is needed.
- A Netlify rate-limit declaration allows eight requests per minute per IP/domain. It is a throttle, not a total spending cap.
- No database schema changes. AI conversations are not added to study scores or saved to the database.

## Install into the existing GitHub repository

1. Extract `JapaneseForToday-AI-Tutor.zip`.
2. Open the repository root: `mahinfromspace/learn-japanese`.
3. Choose **Add file → Upload files**. Drag the extracted `src`, `netlify`, `public`, and `tests` folders, plus `netlify.toml` and this guide, into the upload area. Upload their contents at the repository root; do not upload a new enclosing project folder. Existing matching files will be replaced.
4. Commit the changes. Netlify will build the existing site automatically.

This package contains only new/changed files. It is not a replacement for the whole repository. Do not delete existing folders. The existing progress-saving repair is left intact.

## Add the API key later

In the existing Netlify project, open **Environment variables** and add:

| Name | Value | Scope |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | The Anthropic API key | Functions / runtime |
| `SUPABASE_URL` | The same project URL already used by `VITE_SUPABASE_URL` | Functions / runtime |
| `SUPABASE_PUBLISHABLE_KEY` | The same publishable key already used by `VITE_SUPABASE_PUBLISHABLE_KEY` | Functions / runtime |
| `ANTHROPIC_MODEL` | Optional; defaults to `claude-haiku-4-5-20251001` | Functions / runtime |

Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are also accepted by the function if they are available at runtime. The explicit server variable names above avoid a build-only scope mismatch. Keep existing frontend variables too.

Never add an Anthropic key with a `VITE_` prefix, paste it in source files, or commit a real `.env` file. This implementation does not use `dangerouslyAllowBrowser`.

After changing environment variables, deploy again so the function receives the new configuration. Before the API key is configured, the tutor returns a friendly “not enabled yet” message; the rest of the app works normally.

## Check it

1. Sign in with an existing registered account and open **AI Tutor**.
2. Choose Explain, select a study mood, and submit the example.
3. Confirm the response follows the N4/N3 and romaji settings.
4. Try sentence correction and a follow-up in Conversation.
5. With the key unset, confirm that a clear disabled message appears and the draft can be retried.

Local checks:

```sh
npm ci
npm run build
node --test tests/ai-tutor.test.mjs
```

For local end-to-end function development, use Netlify Dev with environment variables in an uncommitted local `.env` file. Vite alone serves only the frontend, not Netlify Functions.

The included tests mock Supabase verification and Anthropic responses; they never call a paid model. Real generation still needs the API key and a deployed function. For stricter cost control, set a spending limit in the Anthropic account.

## Files

- `src/pages/TutorPage.jsx` — tutor interface and request handling
- `src/pages/tutor.css` — responsive tutor styling and six-item mobile navigation
- `src/App.jsx` — `/tutor` route
- `src/components/Layout.jsx` — AI Tutor navigation
- `netlify/functions/ai-tutor.mjs` — authenticated server endpoint
- `netlify.toml` — function directory and `/api/ai-tutor` rewrite
- `public/sw.js` — new cache version; excludes API and cross-origin requests from caching
- `tests/ai-tutor.test.mjs` — server behaviour regression checks

References: https://docs.netlify.com/build/functions/api/ and https://platform.claude.com/docs/en/api/messages/create
