import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // ✅ SERVE FRONTEND

app.get("/health", (_, res) => res.status(200).send("OK"));

const chatHistory = {};

function buildPrompt(userId, prompt) {
  const history = (chatHistory[userId] || [])
    .map(m => `${m.role}: ${m.text}`)
    .join("\n");

  return `
You are Lumix Core AI.
Use conversation context.

Conversation:
${history}

User:
${prompt}
`;
}

app.post("/api/ai/stream", async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt || !userId) return res.sendStatus(400);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  chatHistory[userId] ??= [];
  chatHistory[userId].push({ role: "user", text: prompt });
  if (chatHistory[userId].length > 10) chatHistory[userId].shift();

  const fullPrompt = buildPrompt(userId, prompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:streamGenerateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
      })
    }
  );

  for await (const chunk of response.body) {
    const text = chunk.toString();
    const matches = text.match(/"text":\s*"([^"]+)"/g);
    if (!matches) continue;

    for (const m of matches) {
      const token = m.replace(/"text":\s*"|"/g, "");
      res.write(`data: ${token}\n\n`);
    }
  }

  res.write("event: end\ndata: END\n\n");
  res.end();
});

app.listen(PORT, () =>
  console.log(`🚀 Lumix Core running on ${PORT}`)
);
// End of server.js