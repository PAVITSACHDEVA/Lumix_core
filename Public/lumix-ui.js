import { streamAIResponse, getWeather } from "./api.js";

const USER_ID = "default-user";
let controller = null;

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const loading = document.getElementById("loading");

/* ---------- INIT ---------- */
window.onload = () => (loading.style.display = "none");

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = `message ${who}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

function addCursor(el) {
  const c = document.createElement("span");
  c.className = "typing-cursor";
  c.textContent = " ▍";
  el.appendChild(c);
  return c;
}

sendBtn.onclick = async () => {
  const q = input.value.trim();
  if (!q) return;

  addMessage(q, "user");
  input.value = "";

  // Weather intent (only if clearly weather)
  if (/weather/i.test(q)) {
    addMessage("Which city or PIN code?", "ai");
    return;
  }

  // PIN code → weather
  if (/^\d{6}$/.test(q)) {
    try {
      const w = await getWeather(q);
      addMessage(
        `🌤 Weather in ${w.location}\n` +
        `🌡 ${w.temp}°C\n` +
        `☁ ${w.condition}\n` +
        `💧 Humidity: ${w.humidity}%\n` +
        `💨 Wind: ${w.wind} km/h`,
        "ai"
      );
    } catch {
      addMessage("⚠️ Could not fetch weather.", "ai");
    }
    return;
  }

  // ✅ DEFAULT AI STREAM (THIS WAS MISSING)
  const ai = addMessage("", "ai");
  const cursor = addCursor(ai);

  controller = streamAIResponse({
    prompt: q,
    userId: USER_ID,
    onToken(token) {
      cursor.remove();
      ai.textContent += token;
      ai.appendChild(cursor);
    },
    onEnd() {
      cursor.remove();
    },
    onError() {
      cursor.remove();
      ai.textContent += "\n⚠️ Error";
    }
  });
};

/* ---------- CANCEL ---------- */
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && controller) {
    controller.abort();
    controller = null;
  }
});

addMessage("Lumix Core ready 🚀", "ai");
