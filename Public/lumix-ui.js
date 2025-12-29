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

/* ---------- SEND ---------- */
sendBtn.onclick = async () => {
  const q = input.value.trim();
  if (!q) return;

  addMessage(q, "user");
  input.value = "";

  /* WEATHER DETECT */
  if (/weather/i.test(q)) {
    addMessage("Which city?", "ai");
    return;
  }

  if (/^\d{6}$/.test(q)) {
    const w = await getWeather(q);
    addMessage(
      `🌤 Weather in ${w.location}\n🌡 ${w.temp}°C\n☁ ${w.condition}\n💧 Humidity ${w.humidity}%\n💨 Wind ${w.wind} km/h`,
      "ai"
    );
    return;
  }

  const ai = addMessage("", "ai");
  const cursor = addCursor(ai);

  controller = streamAIResponse({
    prompt: q,
    userId: USER_ID,
    onToken(t) {
      cursor.remove();
      ai.textContent += t;
      ai.appendChild(cursor);
    },
    onEnd() {
      cursor.remove();
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
