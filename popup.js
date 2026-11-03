const dot = document.getElementById("dot");
const msg = document.getElementById("msg");

chrome.storage.local.get(["sttpKey"], (cfg) => {
  const hasKey = Boolean(cfg?.sttpKey);
  dot.className = "dot " + (hasKey ? "ok" : "no");
  msg.textContent = hasKey
    ? "Ready. Select a phrase on any page, then click “⬡ Stretch”."
    : "No API key yet. Open options and paste your Pollinations key.";
});

document.getElementById("options").addEventListener("click", (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});