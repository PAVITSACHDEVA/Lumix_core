import { streamAI, getWeather } from "./api.js";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const stopBtn = document.getElementById("stopBtn");

let controller = null;

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

sendBtn.onclick = async () => {
  const q = input.value.trim();
  if (!q) return;

  addMessage(q, "user");
  input.value = "";

  // 🌦 WEATHER ROUTING
  if (/weather/i.test(q)) {
    addMessage("Which city?", "ai");
    return;
  }

  if (/^[a-zA-Z\s]+$/.test(q) && lastWasWeather) {
    const w = await getWeather(q);
    addMessage(
      `🌤 <b>${w.location}</b><br>
       🌡 ${w.temp}°C<br>
       ☁ ${w.condition}<br>
       💧 ${w.humidity}%`,
      "ai"
    );
    return;
  }

  // 🤖 AI STREAM
  const ai = addMessage("", "ai");
  const cursor = addCursor(ai);

  controller = streamAI({
    prompt: q,
    onToken(t) {
      cursor.remove();
      ai.innerHTML += t;
      ai.appendChild(cursor);
    },
    onEnd() {
      cursor.remove();
    },
    onError() {
      cursor.remove();
      ai.innerHTML += "<br>⚠️ Error";
    }
  });
};

stopBtn.onclick = () => controller?.abort();
