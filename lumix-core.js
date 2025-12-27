const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

const loadingDots = document.getElementById('loading-dots');
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.querySelector('[data-testid="send-button"]');
  const input = document.querySelector('[data-testid="chat-input"]');

  if (!sendBtn || !input) {
    console.error("❌ Send button or input not found");
    return;
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

sendBtn.addEventListener('click', () => {
  const prompt = userInput.value.trim();
  if (!prompt) return;
  
  appendMessage(prompt, 'user-msg');
  userInput.value = '';
  loadingDots.style.display = 'block';

  fetch('https://lumix-core-5tl0.onrender.com/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
    .then(res => res.json())
    .then(data => {
      loadingDots.style.display = 'none';
      if (data.reply) {
        animateTyping(data.reply, 'ai-msg');
      } else {
        appendMessage("⚠️ Error: No response from AI.", 'ai-msg');
      }
    })
    .catch(() => {
      loadingDots.style.display = 'none';
      appendMessage("❌ Network error.", 'ai-msg');
    });
});

function appendMessage(msg, className) {
  const div = document.createElement('div');
  div.className = className;
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function animateTyping(text, className) {
  const div = document.createElement('div');
  div.className = className;
  chatBox.appendChild(div);
  let index = 0;
  const interval = setInterval(() => {
    div.textContent += text.charAt(index++);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (index >= text.length) clearInterval(interval);
  }, 25);
}
