import { streamAIResponse } from "./api.js";

const USER_ID = "default-user";
let controller = null;

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const loading = document.getElementById("loading");

window.onload = () => {
  loading.style.display = "none"; // ✅ FIXED
};

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

sendBtn.onclick = () => {
  const q = input.value.trim();
  if (!q) return;

  addMessage(q, "user");
  input.value = "";

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

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && controller) {
    controller.abort();
    controller = null;
  }
});

addMessage("Lumix Core ready 🚀", "ai");
