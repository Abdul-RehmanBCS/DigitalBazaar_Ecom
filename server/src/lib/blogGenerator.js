import { completeChat, getLLMConfig, getActiveProviderLabel } from "./llmClient.js";
import { generateBlogLocal } from "./blogGeneratorLocal.js";

function parseJsonFromLLM(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function generateWithLLM(title) {
  const system = `You are an expert blog writer for Digital Bazaar, an online store for digital products (UI kits, Figma templates, fonts, icons, SaaS assets, design resources).
Write helpful, original, SEO-friendly articles. Tone: professional, friendly, practical.
Return ONLY valid JSON — no markdown fences, no commentary.`;

  const user = `Create a full blog post for this title: "${title}"

Return JSON with these exact keys:
- "excerpt": string, compelling summary (max 160 characters)
- "content": string, full article with 4-6 paragraphs separated by double newlines (\\n\\n). You may use **bold** sparingly for key terms.
- "tags": array of 3-5 short tag strings relevant to digital products/design/tech
- "author": string, a realistic author full name
- "readTime": integer, estimated minutes to read (between 4 and 10)
- "metaTitle": string, SEO title (max 60 characters)
- "metaDescription": string, SEO meta description (max 155 characters)`;

  const raw = await completeChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    2800
  );

  if (!raw) return null;

  const parsed = parseJsonFromLLM(raw);
  const excerpt = String(parsed.excerpt || "").trim();
  const content = String(parsed.content || "").trim();
  if (!excerpt || !content) return null;

  return {
    excerpt,
    content,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6) : [],
    author: String(parsed.author || "Digital Bazaar Team").trim(),
    readTime: Math.min(15, Math.max(3, Number(parsed.readTime) || 6)),
    metaTitle: String(parsed.metaTitle || title).trim().slice(0, 70),
    metaDescription: String(parsed.metaDescription || excerpt).trim().slice(0, 160),
    provider: getActiveProviderLabel()
  };
}

/** Uses free cloud AI when a key exists; otherwise built-in writer (no API key needed). */
export async function generateBlogFromTitle(title) {
  if (getLLMConfig()) {
    try {
      const llm = await generateWithLLM(title);
      if (llm) return llm;
    } catch (err) {
      console.warn("[blog] LLM generation failed, using built-in writer:", err.message);
    }
  }

  return generateBlogLocal(title);
}
