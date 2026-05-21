import OpenAI from "openai";

/**
 * Free AI providers (user supplies key in .env — never commit real keys):
 * - Groq: https://console.groq.com/keys  (recommended, fast)
 * - Gemini: https://aistudio.google.com/apikey
 * - OpenAI: paid / limited free credits
 */
export function getLLMConfig() {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      provider: "groq",
      client: new OpenAI({ apiKey: groq, baseURL: "https://api.groq.com/openai/v1" }),
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
    };
  }

  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      provider: "openai",
      client: new OpenAI({ apiKey: openai }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini"
    };
  }

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) {
    return {
      provider: "gemini",
      apiKey: gemini,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-lite"
    };
  }

  return null;
}

export function getActiveProviderLabel() {
  const c = getLLMConfig();
  return c ? c.provider : "fallback";
}

async function geminiComplete(config, messages, maxTokens) {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const chatMessages = messages.filter((m) => m.role !== "system");

  const contents = chatMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.65 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

export async function completeChat(messages, maxTokens = 520) {
  const config = getLLMConfig();
  if (!config) return null;

  if (config.provider === "gemini") {
    return geminiComplete(config, messages, maxTokens);
  }

  const completion = await config.client.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.65
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}
