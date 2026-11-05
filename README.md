# StretchText Page

A browser extension that brings **stretchtext** (Ted Nelson, 1967) to any web page:
select a phrase, a Pollinations text model writes more detail that **grows right
where the phrase stands**, and a click on the highlighted anchor **shrinks it back**.
Words you already read never move, so you never lose your place.

Reading shrinks to the sentences that matter; the rest is one click away.

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

## How it works

1. Select a phrase on any page (up to 500 characters).
2. Click the **⬡ Stretch** button that appears next to the selection.
3. The model replies with an expanded version that starts with the exact phrase,
   so new words open up around what you already read.
4. Click the highlighted original phrase inside the expansion to collapse back.

## Bring your own Pollen

Every generated expansion is billed to **your** Pollinations API key at the
selected model's listed rate — the extension holds no key of its own.

1. Get a key at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys).
2. Right-click the extension icon → **Options**, paste the `sk_...` key
   (optionally pick a different text model, default `openai/gpt-5.4-nano`).

## Install (unpacked, Chromium)

1. Download or clone this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the repository folder.

## Development

```bash
node --test test/
```

Pure vanilla JS, no build step, no dependencies. The page logic lives in
`core.js` (unit-tested on Node), DOM wiring in `content.js`.

## Where the Pollinations call happens

- `core.js` line 8 — `const GEN_URL = "https://gen.pollinations.ai/v1/chat/completions"`.
- `core.js` line 29 — `fetchExpansions()` posts the reader's own `sk_` key in the `Authorization` header.
- `content.js` line 56 — the extension calls `fetchExpansions(phrase, apiKey, model)` on the selected phrase.
- `index.html` — the page at the App URL runs that call live: paste an `sk_` key, click **Stretch this sentence**.
- `test/core.test.js` — 8 tests: request shape, missing key, 401 mapping, JSON parsing.

Quest: [pollinations/pollinations#17998](https://github.com/pollinations/pollinations/issues/17998)