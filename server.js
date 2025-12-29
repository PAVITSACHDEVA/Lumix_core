import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const memory = {};

app.post("/api/ai/stream", async (req, res) => {
  const { prompt, userId } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.flushHeaders();

  memory[userId] ??= [];
  memory[userId].push(prompt);

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    }
  );

  for await (const chunk of r.body) {
    const s = chunk.toString();
    const m = s.match(/"text":"([^"]+)"/g);
    if (!m) continue;
    m.forEach(x =>
      res.write(`data: ${x.replace(/"text":"|"/g,"")}\n\n`)
    );
  }

  res.write("event:end\ndata:END\n\n");
  res.end();
});

app.get("/api/weather", async (req,res)=>{
  const r = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${req.query.city}`
  );
  const d = await r.json();
  res.json({
    location: d.location.name,
    temp: d.current.temp_c,
    condition: d.current.condition.text,
    humidity: d.current.humidity
  });
});

app.listen(10000,()=>console.log("Lumix Core live"));
