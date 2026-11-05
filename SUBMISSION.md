# App Submission — StretchText Page (Quest #17998)

Values used in the submission form.

- **App Name:** StretchText Page
- **App Description:** A browser extension that brings stretchtext (Ted Nelson, 1967) to any web page. Select a phrase and a Pollinations model writes more detail that grows right where the phrase stands; click the highlighted anchor and it shrinks back, so words you already read never move. The reader pays with their own Pollen: the extension holds no key, and every expansion is billed to the reader's own Pollinations key at the selected model's listed rate.
- **App URL:** https://agapovpavel387-code.github.io/stretchtext-quest/
- **GitHub Repository URL:** https://github.com/agapovpavel387-code/stretchtext-quest
- **App Category:** writing
- **Platform:** browser-ext
- **App Language:** en
- **Quest:** #17998

## Evidence of the Pollinations integration

| What | Where |
|---|---|
| Gateway URL | `core.js:8` — `https://gen.pollinations.ai/v1/chat/completions` |
| Reader-funded call | `core.js:29-52` — `fetchExpansions()` sends `Authorization: Bearer <reader's sk_ key>` |
| Live call on the App URL | `index.html` — Live demo block, calls `fetchExpansions()` |
| Extension call site | `content.js:56` |
| Tests | `node --test test/core.test.js` (8 passing) |

Every request is billed to the reader's own key; the extension ships no key of its own.
