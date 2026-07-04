# Not Yet — Interactive Prototype

An outline to order. This is a free, static, interactive prototype of the "Not Yet" estate-planning
record — organized into **Divisions** you can add to, renew, update, or delete at any time — plus a
demo of the proposed **Not Yet Protocol** for keeping the record private while its owner is alive and
releasing it correctly, in tiers, once they've passed.

## What this is (and isn't)

- **Is:** a working, click-around prototype of the product structure — real add/edit/delete/renew
  functionality, built to react to and refine.
- **Isn't:** production software. It stores everything in the visitor's own browser
  (`localStorage`) with no server, no real encryption, and no real death verification. See
  Section 3 of the companion document, *"Not Yet – Product Outline (Divisions & Trust
  Protocol).docx,"* for what a real implementation would need (backend encryption, identity
  verification, legal review).

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `styles.css` | All styling |
| `i18n.js` | Every piece of on-screen text, in English, Spanish, Portuguese, French, and Italian, plus the voice-command phrase bank |
| `divisions.js` | The structural list of Divisions (icon, tier) — names/descriptions/hints now live in `i18n.js` so they can be translated |
| `app.js` | All app logic (rendering, storage, the Trust & Release demo, audio recording, dictation, voice control) |

No build step, no dependencies, no server required — it's plain HTML/CSS/JS.

## Accessibility features (added 2026-07-04)

Built for seniors who may not be fluent with computers, or who have a physical
condition (arthritis, carpal tunnel, tremor) that makes typing hard:

- **Language toggle** — a globe/dropdown in the top bar switches the entire app
  between English, Español, Português, Français, and Italiano. The choice is
  remembered on that device.
- **Voice dictation** — a 🎤 button next to the Title and Details fields in the
  Add/Edit Entry form turns on speech-to-text, so a whole entry can be filled in
  without typing.
- **Voice notes** — a "Record" button in the Add/Edit Entry form captures a short
  audio clip (using the device microphone) and attaches it to that entry, for
  things like a spoken message to a family member or a recipe read aloud.
  Playback controls appear on the entry card afterward.
- **Voice control** — the floating microphone button (bottom-right corner) listens
  for spoken commands in the current language: "home", "add entry", "save",
  "cancel", "stop listening", "read aloud", or any Division's name spoken aloud
  ("Personal Data", "Wills and Trusts," etc.) to jump straight there.
- **Read aloud** — each Division page has a "Read aloud" button that speaks its
  name, description, and hint text out loud.

**Real-world limits to know about:**

- Voice dictation, voice control, and read-aloud all use the browser's built-in
  Web Speech API. It works well in Chrome, Edge, and Safari (14.1+), but **Firefox
  disables speech recognition by default** — dictation and voice control won't
  work there, though read-aloud still will.
- Voice notes use the standard `MediaRecorder` API, which is broadly supported
  (Chrome, Edge, Firefox, Safari 14.1+), but the browser will ask for microphone
  permission the first time.
- Voice recordings are stored as part of the entry, inside this browser's local
  storage — the same place everything else lives. Local storage has a practical
  size limit (a few MB depending on the browser), so this prototype is fine for a
  handful of short voice notes but is not a substitute for real cloud file storage
  in a production version.
- None of this changes the core privacy model: everything (typed, dictated, or
  recorded) still stays in the visitor's own browser and is never uploaded
  anywhere unless they use "Export My Data."

## Run it locally

Just double-click `index.html`, or from a terminal in this folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000` in a browser.

## Publish it for free with GitHub Pages

1. Go to [github.com](https://github.com) and sign in (or create a free account).
2. Click **New repository**. Name it something like `not-yet` and make it **Public**. Don't add a
   README (this folder already has one).
3. On the new repo's page, click **Add file → Upload files**, then drag in all four files from this
   folder (`index.html`, `styles.css`, `divisions.js`, `app.js`) and click **Commit changes**.
4. Go to **Settings → Pages** (left sidebar). Under "Build and deployment," set **Source** to
   **Deploy from a branch**, branch **main**, folder **/(root)**, then **Save**.
5. GitHub will publish the site at `https://<your-username>.github.io/not-yet/` within a minute or
   two — that link is free, permanent, and shareable with anyone (Ed, family, or early testers).

No coding required for any of these steps — it's all clicking buttons on github.com.

## Extending it

- Add a new Division: open `divisions.js` and add an entry to `CORE_DIVISIONS` or
  `RECOMMENDED_DIVISIONS` with a `key`, `icon`, `name`, `tier` (1, 2, or 3), `desc`, and `hint`.
- Everything else (sidebar, tiles, forms) picks up new Divisions automatically.
