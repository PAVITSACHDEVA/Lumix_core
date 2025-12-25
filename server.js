import express from "express";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 10000;

// =====================
// CORS (FIXED PROPERLY)
// =====================
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
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // 🔥 VERY IMPORTANT: preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// =====================
// Middleware
// =====================
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60
  })
);

// =====================
// SAFE MODELS
// =====================
const MODELS = [
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro"
];

// =====================
// Gemini Call
// =====================
async function callGemini(prompt) {
  for (const model of MODELS) {
    console.log("🧠 Trying:", model);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!res.ok) continue;

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) return text;
  }

  throw new Error("Gemini failed");
}

// =====================
// API ROUTES
// =====================
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt) {
      return res.status(400).json({ reply: "Prompt missing" });
    }

    const reply = await callGemini(prompt);
    res.json({ reply });

  } catch (err) {
    console.error("❌ Gemini error:", err.message);
    res.status(500).json({ reply: "Gemini backend error" });
  }
});

// Alias
app.post("/api/gemini", async (req, res) => {
  try {
    const reply = await callGemini(req.body.prompt);
    res.json({ reply });
  } catch {
    res.status(500).json({ reply: "Gemini failed" });
  }
});

// =====================
// Health
// =====================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    keyPresent: !!process.env.GEMINI_API_KEY,
    models: MODELS
  });
});

// =====================
// Start
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
