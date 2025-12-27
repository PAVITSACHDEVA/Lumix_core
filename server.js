import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

/* ---------------- MEMORY ---------------- */
const userSettings = {};
const chatHistory = {};

/* ---------------- HELPERS ---------------- */
function buildPrompt(userId, prompt) {
  const settings = userSettings[userId] || {
    theme: "dark",
    mode: "normal",
    wordLimit: 150
  };

  const history = (chatHistory[userId] || [])
    .map(m => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n");

  return `
You are Lumix Core AI.

RULES:
- Respect context
- Code in code blocks only
- Maths step-by-step
- No --- or ***
- Finish answers
- Max ${settings.wordLimit} words

MODE:
${settings.mode === "exam" ? "Short, direct, no formatting." : ""}
${settings.mode === "project" ? "Use bold, italic, underline. Structured." : ""}

Conversation:
${history}

User:
${prompt}
`;
}

/* ---------------- AI ENDPOINT ---------------- */
app.post("/api/ai", async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt || !userId) return res.status(400).json({ error: "Bad request" });

  if (!chatHistory[userId]) chatHistory[userId] = [];
  chatHistory[userId].push({ role: "user", text: prompt });
  if (chatHistory[userId].length > 10) chatHistory[userId].shift();

  const fullPrompt = buildPrompt(userId, prompt);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
        })
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    chatHistory[userId].push({ role: "model", text: reply });

    res.json({ reply });
  } catch (err) {
    res.json({ reply: "⚠️ AI offline. Try again later." });
  }
});

/* ---------------- SETTINGS ---------------- */
app.post("/api/settings", (req, res) => {
  const { userId, theme, mode, wordLimit } = req.body;
  if (!userId) return res.status(400).json({ error: "User missing" });

  userSettings[userId] = {
    theme: theme || "dark",
    mode: mode || "normal",
    wordLimit: wordLimit || 150
  };

  res.json({ status: "saved" });
});

app.listen(PORT, () => {
  console.log(`🚀 Lumix Core running on ${PORT}`);
});
