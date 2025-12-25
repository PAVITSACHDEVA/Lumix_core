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
// SAFE GEMINI MODELS
// =====================
const MODELS = [
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro"
];

// =====================
// Core Gemini Function
// =====================
async function callGemini(prompt) {
  for (const model of MODELS) {
    try {
      console.log("🧠 Trying model:", model);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
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

      if (!response.ok) {
        console.warn(`⚠️ ${model} failed (${response.status})`);
        continue;
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) return text;

    } catch (err) {
      console.error(`❌ Error with ${model}`, err);
    }
  }

  throw new Error("All Gemini models failed");
}

// =====================
// API ROUTES
// =====================
app.post("/api/gemini", async (req, res) => {
  try {
    const reply = await callGemini(req.body.prompt);
    res.json({ reply });
  } catch {
    res.status(500).json({ error: "Gemini failed" });
  }
});

// 🔹 ALIAS for frontend (/api/ai)
app.post("/api/ai", async (req, res) => {
  try {
    const reply = await callGemini(req.body.prompt);
    res.json({ reply });
  } catch {
    res.status(500).json({ error: "Gemini failed" });
  }
});

// =====================
// Health Check
// =====================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    models: MODELS
  });
});

// =====================
// Start Server
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Lumix Core backend running on port ${PORT}`);
});
