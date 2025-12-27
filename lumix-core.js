document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const loadingDots = document.getElementById('loading-dots');

  if (!sendBtn || !userInput) {
    console.error("❌ Send button or input not found");
    return;
  }

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

  async function sendMessage() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    appendMessage(prompt, 'user-msg');
    userInput.value = '';
    loadingDots.style.display = 'block';

    try {
      const res = await fetch('https://lumix-core-5tl0.onrender.com/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      loadingDots.style.display = 'none';

      if (data.reply) {
        animateTyping(data.reply, 'ai-msg');
      } else {
        appendMessage("⚠️ No response from AI.", 'ai-msg');
      }
    } catch (err) {
      loadingDots.style.display = 'none';
      appendMessage("❌ Network error.", 'ai-msg');
    }
  }

  sendBtn.addEventListener('click', sendMessage);

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
