// server.cjs
const express = require("express");
const fetch = require("node-fetch");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   SECURITY
======================= */

app.use(cors({
  origin: [
    "https://pavitsachdeva.github.io",
    "http://localhost:5500"
  ]
}));

app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/", limiter);

/* =======================
   HEALTH CHECK
======================= */

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

/* =======================
   GEMINI PROXY
======================= */
iuytrdesdfhudfsghiouytrdfgkl;ojhgfd 
app.post("/api/gemini", async (req, res) => {
  const { prompt, model } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty response");

    res.json({ text });

  } catch (e) {
    console.error("Gemini error:", e.message);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

/* =======================
   START SERVER
======================= */

app.listen(PORT, () =>
  console.log(`✅ Lumix Core backend running on port ${PORT}`)
);
