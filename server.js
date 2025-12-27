import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= HEALTH CHECK (RENDER NEEDS THIS) ================= */
/* ⚠️ MUST RETURN 200 OK */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ================= IN-MEMORY STORAGE ================= */
const userSettings = {};
const chatHistory = {};

/* ================= PROMPT BUILDER ================= */
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
- Respect conversation context
- Code ONLY in code blocks
- Maths step-by-step
- No --- or ***
- Finish answers properly
- Maximum ${settings.wordLimit} words

MODE:
${settings.mode === "exam" ? "Short, direct, exam-style answers." : ""}
${settings.mode === "project" ? "Structured answers with bold, italic, underline." : ""}

Conversation history:
${history}

User question:
${prompt}
`;
}

/* ================= AI ENDPOINT ================= */
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: "Prompt or userId missing" });
    }

    if (!chatHistory[userId]) chatHistory[userId] = [];

    chatHistory[userId].push({ role: "user", text: prompt });

    if (chatHistory[userId].length > 10) {
      chatHistory[userId].shift();
    }

    const fullPrompt = buildPrompt(userId, prompt);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: fullPrompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response from AI.";

    chatHistory[userId].push({ role: "model", text: reply });

    res.status(200).json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(200).json({
      reply: "⚠️ AI is temporarily unavailable. Please try again later."
    });
  }
});

/* ================= USER SETTINGS ================= */
app.post("/api/settings", (req, res) => {
  const { userId, theme, mode, wordLimit } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId missing" });
  }

  userSettings[userId] = {
    theme: theme || "dark",
    mode: mode || "normal",
    wordLimit: wordLimit || 150
  };

  res.status(200).json({ status: "saved", settings: userSettings[userId] });
});

/* ================= START SERVER ================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Lumix Core running on port ${PORT}`);
});
  