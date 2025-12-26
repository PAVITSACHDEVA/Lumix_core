import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.GEMINI_API_KEY;
console.log("🔑 GEMINI_API_KEY length:", API_KEY?.length);

const genAI = new GoogleGenerativeAI(API_KEY);

/* health check */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* AI endpoint */
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    // ✅ USE gemini-pro (NOT 1.5-flash)
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).json({ error: "Gemini backend error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
