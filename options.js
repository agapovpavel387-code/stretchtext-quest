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

saveButton.addEventListener("click", () => {
  const key = keyInput.value.trim();
  const model = modelInput.value.trim() || "openai/gpt-5.4-nano";
  if (!key) {
    setStatus("Paste your sk_ key first.", false);
    return;
  }
  chrome.storage.local.set({ sttpKey: key, sttpModel: model }, () => {
    setStatus("Saved. Select a phrase on any page and click “⬡ Stretch”.", true);
  });
});