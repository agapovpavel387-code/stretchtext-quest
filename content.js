// content.js — интеракция с документом: выделение -> кнопка -> развёртка.
// Требует core.js (погружен раньше в manifest).

const sttp = (() => {
  let apiKey = "";
  let model = "";

  chrome?.storage?.local?.get(["sttpKey", "sttpModel"], (cfg) => {
    apiKey = cfg?.sttpKey || "";
    model = cfg?.sttpModel || "";
  });

  let btn = null;
  const stretchStore = new Map(); // index -> {s, long} для повторного открытия

  function hideButton() {
    if (btn) {
      btn.remove();
      btn = null;
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "sttp-toast";
    toast.textContent = message;
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  function currentSelectionText() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return "";
    return selection.toString().replace(/\s+/g, " ").trim();
  }

  function placeButton(x, y, text) {
    hideButton();
    if (!text || text.length > 500) return;
    btn = document.createElement("button");
    btn.className = "sttp-btn";
    btn.textContent = "⬡ Stretch";
    btn.style.left = Math.min(x + 8, window.innerWidth - 130) + "px";
    btn.style.top = Math.max(y + 8, 0) + "px";
    document.documentElement.appendChild(btn);
    btn.addEventListener("mousedown", (event) => event.preventDefault());
    btn.addEventListener("click", async () => {
      const phrase = text;
      hideButton();
      clearSelection();
      if (!apiKey) {
        showToast("StretchText: no API key. Right-click the extension icon → Options, paste your Pollinations key.");
        return;
      }
      try {
        const expansions = await fetchExpansions(phrase, apiKey, model);
        swapPhrase(phrase, expansions[0]);
      } catch (error) {
        showToast("StretchText: " + error.message);
      }
    });
  }

  function clearSelection() {
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
  }

  /** Заменяет исходный текст фразы на открытую развёртку (на месте). */
  function swapPhrase(phrase, expansion) {
    const ranges = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType !== Node.TEXT_NODE || !node.data) continue;
      if (isInsideStretch(node.parentElement)) continue;
      const index = node.data.indexOf(phrase);
      if (index >= 0) {
        ranges.push({ node, index, length: phrase.length });
        break;
      }
    }
    if (!ranges.length) {
      showToast("StretchText: could not locate the phrase in the page text.");
      return;
    }
    const { node, index, length } = ranges[0];
    const parent = node.parentElement;
    const span = document.createElement("span");
    span.className = "sttp-span";
    span.textContent = phrase;
    span.addEventListener("click", () => {
      stretchStore.set(0, expansion);
      span.outerHTML = buildOpenHtml(expansion, 0);
    });
    const rest = document.createTextNode(node.data.slice(index + length));
    node.data = node.data.slice(0, index);
    parent.insertBefore(span, node.nextSibling);
    parent.insertBefore(rest, span.nextSibling);
    parent.normalize?.();
  }

  function isInsideStretch(element) {
    let current = element;
    while (current) {
      if (current.classList?.contains("sttp-open") || current.classList?.contains("sttp-span")) return true;
      current = current.parentElement;
    }
    return false;
  }

  document.addEventListener("mouseup", (event) => {
    const text = currentSelectionText();
    if (text && text.length <= 500 && !isInsideStretch(event.target)) {
      const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
      placeButton(rect.right, rect.bottom, text);
    } else {
      setTimeout(hideButton, 150);
    }
  });

  document.addEventListener("mousedown", (event) => {
    if (btn && !btn.contains(event.target)) hideButton();
  });

  document.addEventListener("scroll", hideButton, { passive: true });

  // Сворачивание открытых развёрток по клику на отметке исходной фразы.
  document.addEventListener("click", (event) => {
    const mark = event.target.closest?.(".sttp-orig");
    if (!mark) return;
    const open = mark.closest?.(".sttp-open");
    if (!open) return;
    const index = Number(open.dataset.sttp || 0);
    const expansion = stretchStore.get(index);
    const phrase = expansion?.s || mark.textContent;
    open.replaceWith(buildCollapsedSpan(expandObject(expansion, phrase), index));
  });

  function expandObject(expansion, phrase) {
    return expansion || { s: phrase, long: phrase };
  }

  function buildCollapsedSpan(expansion, index) {
    const span = document.createElement("span");
    span.className = "sttp-span";
    span.textContent = expansion.s;
    span.addEventListener("click", () => {
      stretchStore.set(index, expansion);
      span.outerHTML = buildOpenHtml(expansion, index);
    });
    return span;
  }

  return { swapPhrase, hideButton, showToast };
})();