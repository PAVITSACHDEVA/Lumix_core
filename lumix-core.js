const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loadingDots = document.getElementById('loading-dots');

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
