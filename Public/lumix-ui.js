import { streamAIResponse, getWeather } from "./api.js";

const USER_ID = "user-" + Math.floor(Math.random() * 10000);
let controller = null;
let activeTool = null;

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const stopBtn = document.getElementById("stopBtn");

function formatAIText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

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

async function handleSend() {
  const q = input.value.trim();
  if (!q || controller) return;

  addMessage(q, "user");
  input.value = "";

  if (activeTool === "weather") {
    const aiMsg = addMessage("<i>Searching weather...</i>", "ai");
    try {
      const w = await getWeather(q);
      aiMsg.innerHTML = formatAIText(
        `**Weather in ${w.location}**\nTemp: ${w.temp}°C\n${w.condition}\nHumidity: ${w.humidity}%`
      );
    } catch (e) {
      aiMsg.innerHTML = "Sorry, couldn't fetch the weather for that location.";
    }
    activeTool = null;
    return;
  }

  if (/weather/i.test(q)) {
    activeTool = "weather";
    addMessage("Sure! Which city should I check?", "ai");
    return;
  }

  let buffer = "";
  const ai = addMessage("", "ai");
  const cursor = addCursor(ai);
  
  if (stopBtn) stopBtn.disabled = false;

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
      if (stopBtn) stopBtn.disabled = true;
      controller = null;
    },
    onError(err) {
      cursor.remove();
      ai.innerHTML += "<br><span style='color:#ef4444'>⚠️ Connection error. Please try again.</span>";
      if (stopBtn) stopBtn.disabled = true;
      controller = null;
    }
  });
}

sendBtn.onclick = handleSend;

input.onkeydown = (e) => {
  if (e.key === "Enter") handleSend();
};

if (stopBtn) {
  stopBtn.onclick = () => {
    if (controller) {
      controller.abort();
      controller = null;
      stopBtn.disabled = true;
    }
  };
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && controller) {
    controller.abort();
    controller = null;
    if (stopBtn) stopBtn.disabled = true;
  }
});

setTimeout(() => {
  addMessage("Welcome! Lumix Core is online and ready for your requests.", "ai");
}, 500);