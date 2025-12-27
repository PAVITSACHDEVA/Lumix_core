import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// -------------------- MIDDLEWARE --------------------
app.use(cors({ origin: "*" }));
app.use(express.json());

// -------------------- HEALTH CHECK --------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// -------------------- AI ENDPOINT --------------------
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    console.log("🟢 Prompt:", prompt);

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔴 Gemini ERROR:", data);
      return res.status(500).json({ error: data.error });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response";

    console.log("🟢 Gemini replied");

    res.json({ reply });
  } catch (err) {
    console.error("🔴 Server ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Lumix Core backend running on ${PORT}`);
});
