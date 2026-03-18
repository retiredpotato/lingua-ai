async function geminiCall(systemPrompt, messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      messages: Array.isArray(messages)
        ? messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
        : [{ role: "user", content: messages }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}