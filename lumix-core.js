/* ================= FORCE PAGE TO BE INTERACTIVE ================= */
document.body.style.overflow = "auto";

/* ================= USER ID ================= */
let userId = localStorage.getItem("lumix_user");
if (!userId) {
  userId = "user_" + crypto.randomUUID();
  localStorage.setItem("lumix_user", userId);
}

/* ================= DOM ================= */
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const loading = document.getElementById("loading-dots");

/* ================= MARKDOWN RENDER ================= */
function renderMarkdown(text) {
  return text
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/\n/g, "<br>");
}

/* ================= CHAT UI ================= */
function addMessage(text, className) {
  const div = document.createElement("div");
  div.className = className;
  div.innerHTML = renderMarkdown(text);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ================= SEND MESSAGE ================= */
async function sendMessage() {
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user-msg");
  input.value = "";
  loading.style.display = "block";

  try {
    const res = await fetch("https://lumix-core-5tl0.onrender.com/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userId })
    });

    const data = await res.json();
    addMessage(data.reply || "⚠️ No response", "ai-msg");
  } catch (err) {
    addMessage("❌ Network error", "ai-msg");
  }

  loading.style.display = "none";
}

/* ================= EVENTS ================= */
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

/* ================= SETTINGS ================= */
async function saveSettings(settings) {
  await fetch("https://lumix-core-5tl0.onrender.com/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...settings })
  });
}

function setMode(mode) {
  saveSettings({ mode });
}

function setTheme(theme) {
  document.body.className = theme;
  saveSettings({ theme });
}

/* ================= FINAL SAFETY ================= */
document.addEventListener("DOMContentLoaded", () => {
  input.disabled = false;
  input.readOnly = false;
  input.style.pointerEvents = "auto";
  input.focus();
});
/* ================= INITIALIZE THEME ================= */