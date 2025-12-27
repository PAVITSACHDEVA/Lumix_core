const chatBox = document.getElementById("chat-box");
const form = document.getElementById("chat-form");
const promptInput = document.getElementById("prompt");
const loader = document.getElementById("loader");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user");
  promptInput.value = "";

  showLoader(true);

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    const text = data.reply || "Something went wrong. Try again.";
    addTypingEffect(text, "ai");
  } catch (err) {
    addMessage("Error fetching response.", "ai");
  } finally {
    showLoader(false);
  }
});

function addMessage(text, type) {
  const message = document.createElement("div");
  message.classList.add("message", type);
  message.innerText = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addTypingEffect(text, type) {
  const message = document.createElement("div");
  message.classList.add("message", type);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;

  let i = 0;
  const interval = setInterval(() => {
    message.innerText += text.charAt(i);
    chatBox.scrollTop = chatBox.scrollHeight;
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 15);
}

function showLoader(state) {
  loader.hidden = !state;
}
