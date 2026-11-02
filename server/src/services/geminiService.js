const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function askGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing. Add it to server/.env.");
    error.status = 503;
    throw error;
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();

  if (!text) {
    const error = new Error("The AI returned an empty response. Please try again.");
    error.status = 502;
    throw error;
  }
  return text;
}

export async function generateSummary(originalText) {
  const prompt = `
You are a careful study assistant. Summarize the student's source material.
Rules:
- Use clear, simple English.
- Use a short title followed by organized bullet points.
- Preserve important definitions, facts, and relationships.
- Do not invent facts that are not in the source.
- If the source is unclear, say so rather than guessing.
- Aim for a concise revision summary.
SOURCE MATERIAL:
${originalText}
`;
  return askGemini(prompt);
}

export async function generateFlashcards(originalText, topic) {
  const prompt = `
Create 8 to 10 useful study flashcards from the source material.
Return ONLY valid JSON, with no markdown fences and no extra commentary.
Use exactly this shape:
{"cards":[{"question":"...","answer":"..."},{"question":"...","answer":"..."}]}
Rules:
- Each question tests one key concept.
- Answers should be concise but accurate.
- Use only facts supported by the source material.
- Do not repeat questions.
Topic: ${topic || "Study material"}
SOURCE MATERIAL:
${originalText}
`;
  const raw = await askGemini(prompt);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const error = new Error("The AI response wasn't valid flashcard JSON. Please try again.");
    error.status = 502;
    throw error;
  }

  if (!Array.isArray(parsed.cards)) {
    const error = new Error("The AI response did not contain a cards array. Please try again.");
    error.status = 502;
    throw error;
  }

  const cards = parsed.cards
    .filter(card => typeof card.question === "string" && typeof card.answer === "string")
    .map(card => ({
      question: card.question.trim(),
      answer: card.answer.trim()
    }))
    .filter(card => card.question && card.answer)
    .slice(0, 10);

  if (cards.length < 3) {
    const error = new Error("The AI generated too few valid flashcards. Try a longer source paragraph.");
    error.status = 502;
    throw error;
  }
  return cards;
}
