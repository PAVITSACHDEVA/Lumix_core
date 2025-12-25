import express from "express";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 10000;

/* =======================
   CORS (GitHub Pages)
======================= */
const ALLOWED_ORIGINS = [
  "https://pavitsachdeva.github.io"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* =======================
   Middleware
======================= */
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60
  })
);

/* =======================
   Gemini Call (FIXED)
======================= */
async function callGemini(prompt) {
  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

  const response = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  const raw = await response.text();
  console.log("📦 Gemini raw:", raw);

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}`);
  }

  const data = JSON.parse(raw);
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("No text in Gemini response");

  return text;
}

/* =======================
   API ROUTES
======================= */
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt) {
      return res.status(400).json({ reply: "Prompt missing" });
    }

    const reply = await callGemini(prompt);
    res.json({ reply });

  } catch (err) {
    console.error("❌ Gemini failed:", err.message);
    res.status(500).json({ reply: "Gemini backend error" });
  }
});

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    keyPresent: !!process.env.GEMINI_API_KEY,
    model: "gemini-1.5-flash"
  });
});

/* =======================
   Start Server
======================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
