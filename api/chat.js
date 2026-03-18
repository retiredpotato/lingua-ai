const https = require("https");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { system, messages } = req.body;

  const payload = JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: system },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const options = {
    hostname: "api.groq.com",
    path: "/openai/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve) => {
    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            res.status(400).json({ error: parsed.error.message });
          } else {
            res.json({ text: parsed.choices[0].message.content });
          }
        } catch (e) {
          res.status(500).json({ error: "Failed to parse response: " + data });
        }
        resolve();
      });
    });

    request.on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(payload);
    request.end();
  });
};