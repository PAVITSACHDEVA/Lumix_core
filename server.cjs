/**
 * ================================
 * Lumix Core – Production Backend
 * ================================
 * ✔ Secure Gemini API usage
 * ✔ Streaming responses
 * ✔ Rate limiting
 * ✔ Domain locking
 * ✔ Render / Node 22 safe
 */

import express from "express";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";
import cors from "cors";

/* ======================
   CONFIG
====================== */

// 🔐 Environment variable (ONLY in Render dashboard)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ❗ Allowed frontend origins (EDIT THIS)
const ALLOWED_ORIGINS = [
  "https://pavitsachdeva.github.io",
  "https://lumix-core.onrender.com"
];

// Gemini models (auto fallback)
const GEMINI_MODELS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash",
  "models/gemini-2.0-flash-lite"
];

/* ======================
   APP INIT
====================== */

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

/* ======================
   CORS + DOMAIN LOCK
====================== */

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow server-to-server
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("❌ Origin not allowed"), false);
    }
  })
);

/* ======================
   RATE LIMITING
====================== */

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,             // 30 requests per IP
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/", limiter);

/* ======================
   HEALTH CHECK
====================== */

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Lumix Core Backend" });
});

/* ======================
   STREAMING GEMINI
====================== */

app.post("/api/chat", async (req, res) => {
  try {
    const { message, modelIndex = 0 } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let lastError = null;

    for (let i = modelIndex; i < GEMINI_MODELS.length; i++) {
      const model = GEMINI_MODELS[i];

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: message }]
                }
              ]
            })
          }
        );

        if (!response.ok) {
          lastError = await response.text();
          continue; // fallback to next model
        }

        const data = await response.json();

        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          lastError = "Empty Gemini response";
          continue;
        }

        // 🔴 STREAM WORD-BY-WORD
        const words = text.split(" ");
        for (const w of words) {
          res.write(w + " ");
          await new Promise(r => setTimeout(r, 18));
        }

        res.end();
        return;
      } catch (err) {
        lastError = err.message;
      }
    }

    res.status(500).end(`❌ Gemini error: ${lastError}`);

  } catch (err) {
    res.status(500).end(`❌ Server error: ${err.message}`);
  }
});

/* ======================
   START SERVER
====================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Lumix Core backend running on port", PORT);
});
