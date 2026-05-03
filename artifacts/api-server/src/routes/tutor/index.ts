import { Router } from "express";

const router = Router();
const groqApiKey = process.env.GROQ_API_KEY;
const groqBaseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const groqModel = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

router.post("/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid request: missing messages array" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const response = await fetch(`${groqBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        stream: true,
        temperature: 0.2,
        max_tokens: 512,
        messages: [
          {
            role: "system",
            content:
              systemPrompt ??
              "You are a helpful linear regression tutor. Stay on the current lesson, answer in exactly 3 short sentences, and redirect out-of-scope questions back to the lesson.",
          },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Groq request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const token = parsed.choices?.[0]?.delta?.content;
        if (!token) continue;

        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI streaming error");
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
    res.end();
  }
});

export default router;