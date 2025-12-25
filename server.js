import express from "express";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
   Gemini SDK (THE FIX)
======================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

/* =======================
   API
======================= */
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt) {
      return res.status(400).json({ reply: "Prompt missing" });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (err) {
    console.error("❌ Gemini SDK error:", err);
    res.status(500).json({ reply: "Gemini backend error" });
  }
});

/* =======================
   Health
======================= */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    keyPresent: !!process.env.GEMINI_API_KEY,
    model: "gemini-1.5-flash (SDK)"
  });
});

/* =======================
   Start
======================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
