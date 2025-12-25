import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// Middleware
// =====================
app.use(cors());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60
  })
);

// =====================
// VERIFY API KEY ON BOOT
// =====================
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY IS MISSING");
}

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
    console.log("🧠 Trying model:", model);

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

    const rawText = await res.text();

    console.log("📦 Gemini raw response:", rawText);

    if (!res.ok) {
      console.warn(`⚠️ ${model} failed (${res.status})`);
      continue;
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      continue;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) return text;
  }

  throw new Error("No valid Gemini response");
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
    res.status(500).json({
      reply: "Gemini backend error (check server logs)"
    });
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
