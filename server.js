const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

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
// Core Gemini Handler
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
        console.warn(`⚠️ ${model} failed with ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text =
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text;

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

// 🔹 Main Gemini route
app.post("/api/gemini", async (req, res) => {
  try {
    const reply = await callGemini(req.body.prompt);
    res.json({ reply });
  } catch {
    res.status(500).json({ error: "Gemini failed" });
  }
});

// 🔹 Alias route (FRONTEND FIX)
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
