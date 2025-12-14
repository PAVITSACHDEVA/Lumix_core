document.addEventListener("DOMContentLoaded", () => {
  console.log("Lumix Core frontend loaded.");

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const themeToggle = document.getElementById("themeToggle");

  if (!sendBtn || !input || !chatBox) {
    console.error("Required DOM elements missing");
    return;
  }

  // SEND MESSAGE
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message);
    input.value = "";

    try {
      const res = await fetch("https://lumix-core-5tl0.onrender.com/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      appendMessage("Lumix", data.reply || "No response");
    } catch (err) {
      console.error(err);
      appendMessage("Error", "Backend not reachable");
    }
  }

  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className =
      "p-3 rounded-lg bg-white/10 border border-white/10";
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // THEME TOGGLE (OPTIONAL)
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("bg-black");
    document.body.classList.toggle("bg-white");
    document.body.classList.toggle("text-black");
  });
});
