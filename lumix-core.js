// =========================
// Lumix Core — Frontend Script
// =========================

const AI_NAME = "Lumix Core";
const BACKEND_URL = "https://lumix-core-5tI0.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- DOM HELPERS ---------- */
  const $ = (q) => document.querySelector(q);

  const input = $('[data-testid="chat-input"]');
  const sendBtn = $('[data-testid="send-button"]');
  const chatBox = $('[data-testid="chat-container"]');
  const micBtn = $('[data-testid="mic-button"]');
  const themeToggle = $("#themeToggleHeader");

  /* ---------- BASIC CHECK ---------- */
  if (!input || !sendBtn || !chatBox) {
    console.error("❌ Required DOM elements missing");
    return;
  }

  /* ---------- THEME ---------- */
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
  });

  /* ---------- UI HELPERS ---------- */
  function escapeHTML(text) {
    return text.replace(/[&<>]/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
    );
  }

  function addMessage(text, sender = "ai") {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.innerHTML = `
      <div class="font-bold">${sender === "ai" ? AI_NAME : "You"}</div>
      <div class="message-content">${escapeHTML(text)}</div>
    `;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* ---------- THINKING ---------- */
  let thinkingEl = null;

  function showThinking() {
    if (thinkingEl) return;
    thinkingEl = document.createElement("div");
    thinkingEl.className = "message ai";
    thinkingEl.innerHTML = `
      <div class="font-bold">${AI_NAME}</div>
      <div class="message-content thinking-indicator">
        <span>Thinking</span>
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
      </div>
    `;
    chatBox.appendChild(thinkingEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function hideThinking() {
    thinkingEl?.remove();
    thinkingEl = null;
  }

  /* ---------- BACKEND AI CALL ---------- */
  async function askBackend(prompt) {
    const res = await fetch(`${BACKEND_URL}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      throw new Error("Backend error");
    }

    const data = await res.json();
    return data.reply;
  }

  /* ---------- SEND MESSAGE ---------- */
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    sendBtn.disabled = true;

    showThinking();

    try {
      const reply = await askBackend(text);
      hideThinking();
      addMessage(reply, "ai");
    } catch (err) {
      hideThinking();
      addMessage("❌ AI backend not reachable", "ai");
      console.error(err);
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ---------- MIC (OPTIONAL) ---------- */
  if ("webkitSpeechRecognition" in window && micBtn) {
    const rec = new webkitSpeechRecognition();
    rec.onresult = e => {
      input.value = e.results[0][0].transcript;
      sendMessage();
    };
    micBtn.onclick = () => rec.start();
  }

  /* ---------- INIT ---------- */
  addMessage(
    "Hello! I'm Lumix Core. Ask me anything.",
    "ai"
  );
});
  