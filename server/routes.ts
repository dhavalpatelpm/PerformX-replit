import type { Express } from "express";
import { createServer, type Server } from "node:http";

function buildSystemPrompt(context: any): string {
  const p = context?.profile;
  const t = context?.todayStats;
  const streaks = context?.topStreaks ?? [];

  const profileBlock = p
    ? `User: ${p.name} | Profession: ${p.profession} | Age: ${p.age} | Weight: ${p.weightKg}kg | Height: ${p.heightCm}cm | BMI: ${p.bmi}`
    : "User profile not set up yet.";

  const todayBlock = t
    ? `Today (${t.dayName}, ${t.date}): ${t.completed}/${t.total} habits done (${t.percentage}%)`
    : "No habit data today.";

  const streakBlock = streaks.length
    ? streaks.map((s: any) => `  - ${s.name} (${s.category}): ${s.streak}-day streak`).join("\n")
    : "  No active streaks yet.";

  return `You are PerformX AI — a concise, motivational performance coach embedded in the PerformX habit tracking app for athletes, powerlifters, and health-focused individuals.

Live user data:
${profileBlock}
${todayBlock}
Active Streaks:
${streakBlock}
Total habits tracked: ${context?.totalHabits ?? 0}
Categories: ${context?.categories ?? "none"}

Rules:
- Keep every response under 4 sentences. Be specific, not generic.
- Reference the user's actual numbers whenever relevant.
- Address them by first name only.
- Be encouraging but direct — no fluff.
- For nutrition questions, suggest Indian foods fitting their goals.
- Never say you are an AI or mention Gemini/Google.
- Always end on a forward-looking, motivating note.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ai/chat", async (req, res) => {
    const { message, history = [], context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "AI not configured" });
    }
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = buildSystemPrompt(context);

    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const msg of history) {
      const role = msg.role === "user" ? "user" : "model";
      if (contents.length > 0 && contents[contents.length - 1].role === role) continue;
      contents.push({ role, parts: [{ text: msg.text }] });
    }
    contents.push({ role: "user", parts: [{ text: message.trim() }] });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: 350, temperature: 0.85 },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error("Gemini error:", err);
        return res.status(500).json({ error: "AI request failed" });
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "I couldn't generate a response right now. Please try again.";

      return res.json({ reply });
    } catch (err) {
      console.error("AI route error:", err);
      return res.status(500).json({ error: "Failed to reach AI" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
