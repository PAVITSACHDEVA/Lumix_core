import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ✅ Proper CORS (this is the fix) */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());

app.use(express.json());

console.log("🔑 GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* Health check */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    keyPresent: !!process.env.GEMINI_API_KEY,
    model: "models/gemini-1.5-flash",
  });
});

/* Gemini endpoint */
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash",
    });

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("❌ Gemini SDK error:", err);
    res.status(500).json({ error: "Gemini backend error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
