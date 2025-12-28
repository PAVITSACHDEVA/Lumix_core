const WEATHER_API_KEY = "86af92bb29ea4c278df101649250409";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const avatarToggle = document.getElementById("avatar-panel-toggle");
const loading = document.getElementById("loading");
const themeButtons = [
  document.getElementById("themeToggleHeader"),
  document.getElementById("themeToggleLoading")
].filter(Boolean);

/* THEME */
function toggleTheme() {
  document.body.classList.toggle("light-mode");
}
themeButtons.forEach(b => b.onclick = toggleTheme);

/* LOADER */
window.onload = () => {
  setTimeout(() => loading.style.display = "none", 1200);
};

/* AVATAR PANEL */
avatarToggle.onclick = () => {
  document.body.classList.toggle("panel-open");
};

/* CHAT UI ONLY */
function addMessage(text, who="ai") {
  const div = document.createElement("div");
  div.className = `message ${who}`;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* SEND (placeholder for backend) */
sendBtn.onclick = () => {
  const q = input.value.trim();
  if (!q) return;
  addMessage(q, "user");
  input.value = "";
  addMessage("🧠 Backend will respond here…", "ai");
};

/* ENTER */
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

/* INIT */
addMessage("Hello! Lumix Core UI is ready.", "ai");
/* ================= PROMPT BUILDER ================= */