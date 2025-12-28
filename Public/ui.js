// ui.js
import { fetchAIResponse } from "./api.js";

const chatBox = document.querySelector(".chat-box");
const input = document.querySelector('[data-testid="chat-input"]');
const sendBtn = document.querySelector('[data-testid="send-button"]');

/* ------------------ HELPERS ------------------ */

function addMessage(text, sender = "ai") {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

/**
 * Word-by-word streaming typing
 */
async function streamTyping(element, text, speed = 35) {
  element.textContent = "";
  const words = text.split(" ");

  for (let i = 0; i < words.length; i++) {
    element.textContent += (i === 0 ? "" : " ") + words[i];
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise(r => setTimeout(r, speed));
  }
}

/* =================================================
   MODE 1: UI / CSS TESTING
   (Keeps current code behavior)
   ================================================= */

export function uiOnlyMode() {
  sendBtn.onclick = () => {
    if (!input.value.trim()) return;
    addMessage(input.value, "user");
    addMessage("UI test message ✨", "ai");
    input.value = "";
  };
}

/* =================================================
   MODE 2: AI MODE (replace sendBtn.onclick)
   ================================================= */

export function aiMode() {
  sendBtn.onclick = async () => {
    const prompt = input.value.trim();
    if (!prompt) return;

    addMessage(prompt, "user");
    input.value = "";

    const aiBubble = addMessage("...", "ai");

    try {
      const reply = await fetchAIResponse(prompt);
      await streamTyping(aiBubble, reply);
    } catch (err) {
      aiBubble.textContent = "⚠️ AI error";
      console.error(err);
    }
  };
}
/* ------------------ INITIALIZATION ------------------ */
// Uncomment one of the following based on desired mode
// uiOnlyMode();
aiMode();