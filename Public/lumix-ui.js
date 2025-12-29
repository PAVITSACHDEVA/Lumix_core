import { streamAIResponse, getWeather } from "./api.js";

const USER_ID = "default-user";
let controller = null;
let activeTool = null;

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

/* ---------- SAFE FORMATTER (NO BLOCK TAGS) ---------- */
function formatAIText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

/* ---------- UI HELPERS ---------- */
function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = `message ${who}`;
  div.innerHTML = text;
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

  /* WEATHER ROUTING */
  if (activeTool === "weather") {
    const w = await getWeather(q);
    addMessage(
      formatAIText(
        `**Weather in ${w.location}**\nTemp: ${w.temp}°C\n${w.condition}\nHumidity: ${w.humidity}%`
      ),
      "ai"
    );
    activeTool = null;
    return;
  }

  if (/weather/i.test(q)) {
    activeTool = "weather";
    addMessage("Which city?", "ai");
    return;
  }

  /* AI STREAM */
  let buffer = "";
  const ai = addMessage("", "ai");
  const cursor = addCursor(ai);

  controller = streamAIResponse({
    prompt: q,
    userId: USER_ID,
    onToken(token) {
      buffer += token;
      cursor.remove();
      ai.innerHTML = formatAIText(buffer);
      ai.appendChild(cursor);
    },
    onEnd() {
      cursor.remove();
    }
  });
};

/* ESC TO STOP */
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && controller) {
    controller.abort();
    controller = null;
  }
});

addMessage("Lumix Core ready 🚀", "ai");
/* STOP BUTTON */