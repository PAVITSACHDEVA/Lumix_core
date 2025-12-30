import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ROOT ================= */
/* Just a simple alive check */
app.get("/", (req, res) => {
  res.status(200).send("Lumix Core backend is alive 🚀");
});

/* ================= RENDER HEALTH CHECK ================= */
/* 🔴 THIS FIXES YOUR DEPLOY STUCK ISSUE */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/* ================= MEMORY ================= */
const chatHistory = {};

/* ================= AI STREAM ================= */
app.post("/api/ai/stream", async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt and userId required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    chatHistory[userId] ??= [];
    chatHistory[userId].push(prompt);
    if (chatHistory[userId].length > 6) chatHistory[userId].shift();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    chatHistory[userId].join("\n") +
                    "\nUser: " +
                    prompt
                }
              ]
            }
          ]
        })
      }
    );

    for await (const chunk of response.body) {
      const text = chunk.toString();
      const matches = text.match(/"text"\s*:\s*"([^"]+)"/g);
      if (!matches) continue;

      for (const m of matches) {
        const token = m.replace(/"text"\s*:\s*"|"/g, "");
        res.write(`data: ${token}\n\n`);
      }
    }

    res.write("event: end\ndata: END\n\n");
    res.end();

  } catch (err) {
    console.error("AI STREAM ERROR:", err);
    res.write("event: end\ndata: ERROR\n\n");
    res.end();
  }
});

/* ================= WEATHER ================= */
app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) {
      return res.status(400).json({ error: "City required" });
    }

    const r = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(city)}`
    );
    const d = await r.json();

    res.json({
      location: d.location.name,
      temp: d.current.temp_c,
      condition: d.current.condition.text,
      humidity: d.current.humidity,
      wind: d.current.wind_kph
    });

  } catch (err) {
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Lumix Core backend running on port ${PORT}`);
});
