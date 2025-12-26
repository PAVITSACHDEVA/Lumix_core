import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ---------- CORS (FIXED) ---------- */
app.use(cors({
  origin: "*",               // allow github.io, about:blank, localhost
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ---------- ENV CHECK ---------- */
const API_KEY = process.env.GEMINI_API_KEY;
console.log("🔑 GEMINI_API_KEY length:", API_KEY?.length || 0);

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
}

/* ---------- GEMINI INIT ---------- */
const genAI = new GoogleGenerativeAI(API_KEY);

/* ---------- HEALTH ---------- */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    keyPresent: !!API_KEY,
    model: "gemini-1.5-flash (SDK)"
  });
});

/* ---------- AI ENDPOINT ---------- */
app.post("/api/ai", async (req, res) => {
  try {
    let { prompt } = req.body;

    if (typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt type" });
    }

    prompt = prompt.trim();

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is empty" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ reply: text });

  } catch (err) {
    console.error("❌ Gemini error FULL:", err);
    res.status(500).json({ error: err.message || "Gemini backend error" });
  }
});

/* ---------- START ---------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
