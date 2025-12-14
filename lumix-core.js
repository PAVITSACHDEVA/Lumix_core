const API_BASE = "https://lumix-core-5tl0.onrender.com";

// Wake Render backend
fetch(`${API_BASE}/health`).catch(() => {
  console.log("Warming up backend...");
});

document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const loader = document.getElementById("loader");
  const themeToggle = document.getElementById("themeToggle");
  const micBtn = document.getElementById("micBtn");

const API_URL = `${API_BASE}/api/gemini`;


  // ---------------- THEME TOGGLE ----------------
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
  });

  // ---------------- SEND MESSAGE ----------------
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    append("You", message);
    input.value = "";
    loader.classList.remove("hidden");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      append("Lumix", data.reply || "No response");
    } catch {
      append("Error", "Backend not reachable (Render sleeping?)");
    } finally {
      loader.classList.add("hidden");
    }
  }

  function append(sender, text) {
    const div = document.createElement("div");
    div.className = "p-3 rounded-lg bg-white/10";
    div.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ---------------- MICROPHONE ----------------
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    micBtn.addEventListener("click", () => {
      recognition.start();
      micBtn.textContent = "🎙️";
    });

    recognition.onresult = e => {
      input.value = e.results[0][0].transcript;
      micBtn.textContent = "🎤";
    };

    recognition.onerror = () => {
      micBtn.textContent = "🎤";
    };
  } else {
    micBtn.disabled = true;
    micBtn.textContent = "🚫";
  }
});
