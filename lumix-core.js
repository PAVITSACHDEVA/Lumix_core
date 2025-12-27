const sendBtn = document.getElementById('sendBtn');
const promptInput = document.getElementById('promptInput');
const chatHistory = document.getElementById('chat-history');

let history = [];

function appendMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.innerText = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addTyping() {
  const typing = document.createElement('div');
  typing.className = 'message bot typing';
  typing.innerText = 'Typing...';
  typing.id = 'typing-indicator';
  chatHistory.appendChild(typing);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

async function sendPrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  appendMessage(prompt, 'user');
  promptInput.value = '';
  addTyping();

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    removeTyping();

    const reply = data.reply || '[No response]';
    appendMessage(reply, 'bot');

    // Store history
    history.push({ prompt, reply });
    localStorage.setItem('chatHistory', JSON.stringify(history));
  } catch (err) {
    removeTyping();
    appendMessage('❌ Error: ' + err.message, 'bot');
  }
}

sendBtn.addEventListener('click', sendPrompt);
promptInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendPrompt();
});

// Load past messages
window.addEventListener('load', () => {
  const stored = localStorage.getItem('chatHistory');
  if (stored) {
    history = JSON.parse(stored);
    history.forEach(({ prompt, reply }) => {
      appendMessage(prompt, 'user');
      appendMessage(reply, 'bot');
    });
  }
});
