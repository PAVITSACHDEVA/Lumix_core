// =========================
// Lumix Core — Frontend Script
// =========================

const AI_NAME = "Lumix Core";
const BACKEND_URL = "https://lumix-core-5tl0.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- LOADER ---------- */
  const loading = document.getElementById("loading");
  const loaderFill = document.getElementById("loaderFill");
  const app = document.getElementById("app-container");

  let progress = 10;
  const fakeLoad = setInterval(() => {
    progress = Math.min(progress + 10, 90);
    loaderFill.style.width = progress + "%";
  }, 300);

  async function bootCheck() {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (!res.ok) throw new Error("Backend not ready");

      clearInterval(fakeLoad);
      loaderFill.style.width = "100%";

      setTimeout(() => {
        loading.style.display = "none";
        app.style.display = "block";
      }, 400);

    } catch {
      setTimeout(bootCheck, 1200);
    }
  }

  bootCheck();

  /* ---------- CHAT ---------- */
  const input = document.querySelector('[data-testid="chat-input"]');
  const sendBtn = document.querySelector('[data-testid="send-button"]');
  const chatBox = document.querySelector('[data-testid="chat-container"]');
  const themeToggle = document.getElementById("themeToggleHeader");

  themeToggle.onclick = () =>
    document.body.classList.toggle("light-mode");

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.innerHTML = `
      <div class="message-content">${text}</div>
    `;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    sendBtn.disabled = true;

    addMessage("Thinking…", "ai");

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text })
      });

      const data = await res.json();
      chatBox.lastChild.remove();
      addMessage(data.reply, "ai");

    } catch {
      chatBox.lastChild.remove();
      addMessage("❌ Backend error", "ai");
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = e => e.key === "Enter" && sendMessage();

  addMessage("Hello! I’m Lumix Core.", "ai");
});
