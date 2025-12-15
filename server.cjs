/**
 * ================================
 * Lumix Core – Production Backend
 * ================================
 * ✔ Render safe
 * ✔ Node 22 safe
 * ✔ Streaming
 * ✔ Rate limiting
 * ✔ Domain lock
 */

const express = require("express");
const fetch = require("node-fetch");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

/* ======================
   CONFIG
====================== */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ALLOWED_ORIGINS = [
  "https://pavitsachdeva.github.io",
  "https://lumix-core.onrender.com"
];

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
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed"), false);
    }
  })
);

/* ======================
   RATE LIMIT
====================== */

app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  })
);

/* ======================
   HEALTH
====================== */

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Lumix Core Backend" });
});

/* ======================
   CHAT (STREAMING)
====================== */

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).end("Invalid message");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: message }] }
              ]
            })
          }
        );

        if (!r.ok) {
          lastError = await r.text();
          continue;
        }

        const j = await r.json();
        const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = "Empty response";
          continue;
        }

        for (const word of text.split(" ")) {
          res.write(word + " ");
          await new Promise(r => setTimeout(r, 16));
        }

        return res.end();
      } catch (e) {
        lastError = e.message;
      }
    }

    res.status(500).end("Gemini failed: " + lastError);
  } catch (e) {
    res.status(500).end("Server error");
  }
});

/* ======================
   START
====================== */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("🚀 Lumix Core backend running on port", PORT)
);
//