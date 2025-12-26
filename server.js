import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.GEMINI_API_KEY;

console.log("🔑 GEMINI_API_KEY length:", API_KEY?.length);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI endpoint (REST v1 — STABLE)
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API error:", data);
      return res.status(500).json({ error: "Gemini backend error" });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
