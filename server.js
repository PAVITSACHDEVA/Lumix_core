import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ---------- GEMINI ---------- */
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

/* ---------- ROUTES ---------- */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/ai", async (req, res) => {
  console.log("🟡 /api/ai HIT");
  console.log("🟡 BODY:", req.body);

  try {
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      console.log("🔴 Invalid prompt");
      return res.status(400).json({ error: "Invalid prompt" });
    }

    console.log("🟢 Prompt:", prompt);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("🟢 Gemini replied");

    res.json({ reply: text });
  } catch (err) {
    console.error("🔴 Gemini ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- START ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
