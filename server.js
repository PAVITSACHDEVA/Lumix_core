// ===============================
// Lumix Core Backend Server
// ===============================
console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
// Health Check
// -------------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Lumix Core Backend" });
});

// -------------------------------
// Gemini Setup
// -------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// -------------------------------
// AI Route
// -------------------------------
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-001", // ✅ FIXED
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

// -------------------------------
// Start Server (Render)
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Lumix Core backend running on port ${PORT}`);
});
