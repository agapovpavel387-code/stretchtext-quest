const keyInput = document.getElementById("sttpKey");
const modelInput = document.getElementById("sttpModel");
const statusDiv = document.getElementById("status");
const saveButton = document.getElementById("save");

function setStatus(message, ok) {
  statusDiv.textContent = message;
  statusDiv.style.color = ok ? "#1a7f37" : "#b02a2a";
}

chrome.storage.local.get(["sttpKey", "sttpModel"], (cfg) => {
  keyInput.value = cfg?.sttpKey || "";
  modelInput.value = cfg?.sttpModel || "openai/gpt-5.4-nano";
  if (!cfg?.sttpKey) setStatus("No key yet — generate one at enter.pollinations.ai/keys.", false);
});

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, "");
}

saveButton.addEventListener("click", () => {
  const key = clean(keyInput.value);
  const model = clean(modelInput.value) || "openai/gpt-5.4-nano";
  if (!key.startsWith("sk_")) {
    setStatus("Ключ должен начинаться с sk_ (pk_ — публичный, не подходит).", false);
    return;
  }
  if (key.length < 20) {
    setStatus("Ключ подозрительно короткий — проверьте, что скопирован целиком.", false);
    return;
  }
  chrome.storage.local.set({ sttpKey: key, sttpModel: model }, () => {
    setStatus("Saved. Select a phrase on any page and click “⬡ Stretch”.", true);
  });
});