// ===============================
// Lumix Core Backend Server
// ===============================

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// -------------------------------
// Path Fix (ESM)
// -------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------
// App Init
// -------------------------------
const app = express();

// -------------------------------
// Middleware
// -------------------------------
app.use(cors());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// -------------------------------
// Serve Frontend (for Render only)
// -------------------------------
app.use(express.static(__dirname));

// -------------------------------
// Health Check
// -------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Lumix Core Backend",
  });
});

// -------------------------------
// AI SETUP (Gemini)
// -------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// -------------------------------
// AI API ROUTE
// -------------------------------
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

// -------------------------------
// PORT (Render compatible)
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Lumix Core backend running on port ${PORT}`);
});
