const BACKEND_URL = "https://lumix-core-5tl0.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  const loading = document.getElementById("loading");
  const loaderFill = document.getElementById("loaderFill");
  const app = document.getElementById("app-container");

  const input = document.querySelector('[data-testid="chat-input"]');
  const sendBtn = document.querySelector('[data-testid="send-button"]');
  const chatBox = document.querySelector('[data-testid="chat-container"]');

  // ---- LOADER PROGRESS ----
  let progress = 0;
  const progressTimer = setInterval(() => {
    progress = Math.min(progress + 10, 90);
    loaderFill.style.width = progress + "%";
  }, 250);

  async function bootCheck() {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (!res.ok) throw new Error();

      clearInterval(progressTimer);
      loaderFill.style.width = "100%";

      setTimeout(() => {
        loading.classList.add("hidden");
        app.style.display = "flex";

        // 🔑 IMPORTANT FIX
        input.disabled = false;
        input.focus();

      }, 400);

    } catch {
      setTimeout(bootCheck, 1200);
    }
  }

  bootCheck();

  // ---- CHAT ----
  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

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
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = e => e.key === "Enter" && sendMessage();
});
