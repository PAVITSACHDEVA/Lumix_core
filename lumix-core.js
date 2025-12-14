// =========================
// Lumix Core — Main Script
// =========================

/* ---------- BASIC CONFIG ---------- */

const AI_NAME = "Lumix Core";
const CREATOR_NAME = "Pavit";

/* ---------- DOM READY ---------- */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- SAFE DOM SELECT ---------- */

  const $ = (q) => document.querySelector(q);

  const input = $('[data-testid="chat-input"]');
  const sendBtn = $('[data-testid="send-button"]');
  const chatBox = $('[data-testid="chat-container"]');
  const micBtn = $('[data-testid="mic-button"]');
  const themeToggle = $("#themeToggleHeader");
  const loader = $("#loading");
  const loaderText = $("#loadingText");
  const loaderFill = $("#loaderFill");
  const modelLabel = $("#active-model");

  if (!input || !sendBtn || !chatBox) {
    console.error("❌ Required DOM elements missing");
    return;
  }

  /* ---------- LOADER ---------- */

  if (loader) {
    const phrases = [
      "Booting Lumix Core…",
      "Warming neural circuits…",
      "Connecting to Gemini…",
      "Almost ready…"
    ];
    let i = 0;
    setInterval(() => {
      if (loaderText) loaderText.textContent = phrases[i++ % phrases.length];
    }, 1800);

    let p = 0;
    const int = setInterval(() => {
      p += 12;
      if (loaderFill) loaderFill.style.width = `${p}%`;
      if (p >= 100) {
        clearInterval(int);
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 700);
      }
    }, 300);
  }

  /* ---------- THEME ---------- */

  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
  });

  /* ---------- MODEL SYSTEM ---------- */

  const MODELS = [
    { id: "models/gemini-2.5-flash", label: "Flash ⚡" },
    { id: "models/gemini-1.5-pro", label: "Pro 🧠" },
    { id: "models/gemini-1.5-flash-8b", label: "Lite 🚀" }
  ];

  let activeModel = 0;

  function updateModelUI() {
    if (modelLabel) modelLabel.textContent = MODELS[activeModel].label;
  }

  window.switchModel = (i) => {
    activeModel = i;
    updateModelUI();
  };

  updateModelUI();

  /* ---------- CHAT HELPERS ---------- */

  function escapeHTML(t) {
    return t.replace(/[&<>]/g, c =>
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

  function showThinking(label) {
    if (thinkingEl) return;
    thinkingEl = document.createElement("div");
    thinkingEl.className = "message ai";
    thinkingEl.innerHTML = `
      <div class="font-bold">${AI_NAME}</div>
      <div class="message-content thinking-indicator">
        <span id="thinking-text">${label}</span>
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

  /* ---------- GEMINI CALL ---------- */

  async function callGemini(prompt) {

    for (let i = 0; i < MODELS.length; i++) {
      const model = MODELS[(activeModel + i) % MODELS.length];
      showThinking(`Thinking with ${model.label}`);

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model.id,
            prompt
          })
        });

        if (!res.ok) continue;

        const data = await res.json();
        hideThinking();
        activeModel = MODELS.indexOf(model);
        updateModelUI();
        return data.text;

      } catch {
        continue;
      }
    }

    hideThinking();
    throw new Error("All models failed");
  }

  /* ---------- SEND MESSAGE ---------- */

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    sendBtn.disabled = true;

    try {
      const reply = await callGemini(text);
      addMessage(reply, "ai");
    } catch {
      addMessage("❌ Backend not reachable", "ai");
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ---------- MIC ---------- */

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
    "Hello! I'm Lumix Core — model switching, thinking mode, and fallback are now active.",
    "ai"
  );
});
