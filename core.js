// core.js — чистая логика StretchText (тестируется на node, не зависит от DOM).
//
// Поток: пользователь выделяет фразу -> fetchExpansions() получает от модели
// JSON {"expansions":[{s, long}]} -> buildOpenHtml() подставляет развёрнутый
// текст так, чтобы уже прочитанные слова не двигались (long начинается с s).

const DEFAULT_MODEL = "openai/gpt-5.4-nano";
const GEN_URL = "https://gen.pollinations.ai/v1/chat/completions";

function systemPrompt() {
  return [
    "You write stretchtext: expand a reader's chosen phrase in place.",
    "Return JSON only: {\"expansions\":[{\"s\":\"exact phrase from the text\",\"long\":\"expanded version\"}]}.",
    "Rules:",
    "- long must START WITH the exact phrase s, word for word, then add detail around and after it.",
    "- Never change or reword the phrase itself; new words appear around it so the reader never loses their place.",
    "- Keep the meaning and register of the original; 2-3x its length.",
    "- One expansion per submitted phrase only.",
  ].join("\n");
}

function userPrompt(text) {
  return (
    "Expand this phrase:\n\n\"" + text + "\"\n\n" +
    "Return the JSON object with exactly one expansion."
  );
}

async function fetchExpansions(text, apiKey, model = DEFAULT_MODEL) {
  if (!apiKey) throw new Error("API key missing. Open the extension options and paste your Pollinations key.");
  if (!text.trim() || text.trim().length > 500) {
    throw new Error("Select a phrase between 1 and 500 characters.");
  }
  const response = await fetch(GEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(text.trim()) },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let message = "Model error (" + response.status + ").";
    try {
      const parsed = JSON.parse(detail);
      message = parsed?.error?.message || parsed?.message || message;
    } catch {
      /* keep default */
    }
    if (response.status === 401) message += " Check your Pollinations API key.";
    throw new Error(message);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Model returned an empty answer.");
  return parseExpansions(content);
}

/** Достаёт JSON из ответа модели (маркдаун-обёртка допустима) и валидирует. */
function parseExpansions(raw) {
  let text = String(raw).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Model returned no JSON.");
  let parsed;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Model returned malformed JSON.");
  }
  const expansions = Array.isArray(parsed?.expansions) ? parsed.expansions : [];
  const clean = expansions
    .filter((e) => e && typeof e.s === "string" && typeof e.long === "string")
    .map((e) => ({ s: e.s.trim(), long: e.long.trim() }))
    .filter((e) => e.s && e.long && e.long.startsWith(e.s));
  if (!clean.length) throw new Error("Model returned no usable expansion.");
  return clean;
}

/** Подчёркивает исходную фразу внутри развёрнутого текста (визуальный якорь). */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOpenHtml(expansion, index) {
  const orig = escapeHtml(expansion.s);
  const long = escapeHtml(expansion.long);
  return (
    '<span class="sttp-open" data-sttp="' + index + '" title="Click to collapse">' +
    long +
    '<mark class="sttp-orig">' +
    orig +
    "</mark>" +
    "</span>"
  );
}

const css = `
.sttp-span { cursor: pointer; background: rgba(255, 220, 80, 0.35); border-radius: 2px; box-shadow: 0 0 0 1px rgba(255, 220, 80, 0.6); }
.sttp-span:hover { background: rgba(255, 220, 80, 0.55); }
.sttp-open { background: rgba(120, 220, 170, 0.18); border-radius: 2px; }
.sttp-orig { background: rgba(255, 220, 80, 0.5); padding: 0 1px; border-radius: 2px; }
.sttp-btn {
  position: fixed; z-index: 2147483647; padding: 6px 10px; font: 13px/1.4 system-ui, sans-serif;
  color: #111; background: #ffd41f; border: 1px solid #b89500; border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25); cursor: pointer;
}
.sttp-btn:hover { background: #ffdc4d; }
.sttp-toast {
  position: fixed; z-index: 2147483647; right: 16px; bottom: 16px; max-width: 320px;
  padding: 10px 12px; font: 13px/1.4 system-ui, sans-serif; color: #fff;
  background: #20242a; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.35);
}
`;
try {
  if (typeof CSSStyleSheet !== "undefined") {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }
} catch {
  /* не-DOM окружение (тесты) */
}

if (typeof module !== "undefined" && typeof document === "undefined") {
  module.exports = {
    parseExpansions,
    fetchExpansions,
    buildOpenHtml,
    css,
    DEFAULT_MODEL,
    GEN_URL,
  };
}