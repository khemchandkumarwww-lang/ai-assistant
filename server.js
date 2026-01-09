import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  res.setHeader("Content-Type", "text/plain");

  try {
    const messages = [
      { role: "system", content: "Short, fast, helpful AI responses." },
      ...history.slice(-8),
      { role: "user", content: message }
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        stream: true
      })
    });

    for await (const chunk of r.body) {
      const t = chunk.toString();
      if (t.includes("data: ")) {
        const line = t.replace("data: ", "").trim();
        if (line === "[DONE]") break;
        const json = JSON.parse(line);
        const token = json.choices?.[0]?.delta?.content;
        if (token) res.write(token);
      }
    }
    res.end();
  } catch (e) {
    res.status(500).end("AI error");
  }
});

app.listen(3000, () =>
  console.log("Server running on port 3000")
);
