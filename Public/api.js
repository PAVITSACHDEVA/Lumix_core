// api.js
export function streamAIResponse({ prompt, userId, onToken, onEnd, onError }) {
  const controller = new AbortController();

  fetch("/api/ai/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, userId }),
    signal: controller.signal
  })
    .then(res => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return onEnd?.();

          const chunk = decoder.decode(value, { stream: true });
          chunk
            .split("\n\n")
            .forEach(line => {
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
      if (err.name !== "AbortError") onError?.(err);
    });

  return controller;
}
