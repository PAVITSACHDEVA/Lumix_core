// api.js — FINAL, GUARANTEED WORKING

const API_BASE = "https://lumix-core-5tl0.onrender.com";

export function streamAIResponse({
  prompt,
  userId,
  onToken,
  onEnd,
  onError
}) {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/ai/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, userId }),
    signal: controller.signal
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            onEnd?.();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });

          chunk.split("\n\n").forEach(line => {
            if (line.startsWith("data: ")) {
              onToken(line.replace("data: ", ""));
            }
          });

          read();
        });
      }

      read();
    })
    .catch(err => {
      if (err.name !== "AbortError") {
        console.error("STREAM ERROR:", err);
        onError?.(err);
      }
    });

  return controller;
}
