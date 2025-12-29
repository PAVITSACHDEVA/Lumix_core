import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

/* ---------- HEALTH ---------- */
app.get("/health", (_, res) => res.send("OK"));

/* ---------- MEMORY ---------- */
const chatHistory = {};

/* ---------- PROMPT ---------- */
function buildPrompt(userId, prompt) {
  const history = (chatHistory[userId] || [])
    .map(m => `${m.role}: ${m.text}`)
    .join("\n");

  return `
You are Lumix Core AI.
Be helpful and clear.

Conversation:
${history}

User:
${prompt}
`;
}

/* ---------- AI STREAM (FIXED, NO CUT-OFF) ---------- */
app.post("/api/ai/stream", async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt || !userId) return res.sendStatus(400);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  chatHistory[userId] ??= [];
  chatHistory[userId].push({ role: "user", text: prompt });
  if (chatHistory[userId].length > 10) chatHistory[userId].shift();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: buildPrompt(userId, prompt) }] }
        ]
      })
    }
  );

  let buffer = "";

  for await (const chunk of response.body) {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        const parts = json.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.text) {
            res.write(`data: ${p.text}\n\n`);
          }
        }
      } catch {
        /* ignore partial JSON */
      }
    }
  }

  res.write("event: end\ndata: END\n\n");
  res.end();
});

/* ---------- WEATHER API ---------- */
app.get("/api/weather", async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "City required" });

  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(city)}`;
    const r = await fetch(url);
    const data = await r.json();

    if (data.error) return res.status(400).json({ error: data.error.message });

    res.json({
      location: `${data.location.name}, ${data.location.region}`,
      temp: data.current.temp_c,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      wind: data.current.wind_kph
    });
  } catch {
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Lumix Core backend running on ${PORT}`)
);
