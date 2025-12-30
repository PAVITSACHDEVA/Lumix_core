const API_BASE = "https://lumix-core-5tl0.onrender.com";

export function streamAIResponse({ prompt, userId, onToken, onEnd, onError }) {
  const controller = new AbortController();
  let buffer = "";

  fetch(`${API_BASE}/api/ai/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, userId }),
    signal: controller.signal
  })
    .then(async res => {
      if (!res.ok) throw new Error("Server error");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onEnd?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const token = line.slice(6);
            if (token === "END") continue;
            if (token === "ERROR") {
              onError?.("Internal AI Error");
              continue;
            }
            onToken(token);
          }
        }
      }
    })
    .catch(err => {
      if (err.name !== "AbortError") onError?.(err);
    });

  return controller;
}

export async function getWeather(city) {
  const r = await fetch(
    `${API_BASE}/api/weather?city=${encodeURIComponent(city)}`
  );
  if (!r.ok) throw new Error("Weather service unavailable");
  return r.json();
}