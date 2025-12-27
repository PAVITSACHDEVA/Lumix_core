/* ---------------- USER ID ---------------- */
let userId = localStorage.getItem("lumix_user");
if (!userId) {
  userId = "user_" + crypto.randomUUID();
  localStorage.setItem("lumix_user", userId);
}

/* ---------------- DOM ---------------- */
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const loading = document.getElementById("loading-dots");

/* ---------------- MARKDOWN ---------------- */
function renderMarkdown(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/\n/g, "<br>");
}

/* ---------------- CHAT ---------------- */
function addMsg(text, cls) {
  const d = document.createElement("div");
  d.className = cls;
  d.innerHTML = renderMarkdown(text);
  chatBox.appendChild(d);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const prompt = input.value.trim();
  if (!prompt) return;

  addMsg(prompt, "user-msg");
  input.value = "";
  loading.style.display = "block";

  const res = await fetch("https://lumix-core-5tl0.onrender.com/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, userId })
  });

  const data = await res.json();
  loading.style.display = "none";
  addMsg(data.reply, "ai-msg");
}

sendBtn.onclick = sendMessage;
input.onkeydown = e => e.key === "Enter" && sendMessage();

/* ---------------- SETTINGS ---------------- */
async function saveSettings(s) {
  await fetch("https://lumix-core-5tl0.onrender.com/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...s })
  });
}

function setMode(mode) {
  saveSettings({ mode });
}

function setTheme(theme) {
  document.body.className = theme;
  saveSettings({ theme });
}
