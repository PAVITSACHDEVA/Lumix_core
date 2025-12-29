const API_BASE = "https://lumix-core-5tl0.onrender.com";

export function streamAI({ prompt, onToken, onEnd, onError }) {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/ai/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, userId: "default" }),
    signal: controller.signal
  })
    .then(res => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return onEnd();
          const chunk = decoder.decode(value);
          chunk.split("\n\n").forEach(line => {
            if (line.startsWith("data: "))
              onToken(line.replace("data: ", ""));
          });
          read();
        });
      }
      read();
    })
    .catch(e => e.name !== "AbortError" && onError(e));

  return controller;
}

export async function getWeather(city) {
  const r = await fetch(`${API_BASE}/api/weather?city=${city}`);
  return r.json();
}
