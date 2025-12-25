import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());

// Optional rate limit (good practice)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60
  })
);

// ======================
// SAFE MODEL LIST
// ======================
// ❌ No experimental / preview / 2.x / 3.x models
const MODELS = [
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro"
];

// ======================
// Gemini Route
// ======================
app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

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
        console.warn(`⚠️ Model failed: ${model} (${response.status})`);
        continue; // try next model
      }

      const data = await response.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn(`⚠️ Empty response from ${model}`);
        continue;
      }

      // ✅ SUCCESS
      return res.json({
        model,
        text
      });

    } catch (err) {
      console.error(`❌ Error with ${model}`, err);
    }
  }

  // ❌ All models failed
  res.status(500).json({
    error: "All Gemini models failed"
  });
});

// ======================
// Health Check (IMPORTANT)
// ======================
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    models: MODELS
  });
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Lumix Core backend running on port ${PORT}`);
});
