import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import ChatLog from "../models/ChatLog.js";
import { completeChat, getActiveProviderLabel } from "../lib/llmClient.js";
import { env } from "../config/env.js";

const CLIENT_URL = env.CLIENT_URL;

const STOP_WORDS = new Set([
  "what", "which", "where", "when", "how", "why", "who", "the", "and", "for", "are", "you", "your",
  "can", "does", "do", "did", "will", "would", "could", "should", "have", "has", "had", "this", "that",
  "with", "from", "about", "into", "some", "any", "all", "show", "tell", "give", "need", "want",
  "find", "search", "looking", "recommend", "suggest", "please", "help", "me", "my", "get", "see",
  "list", "buy", "shop", "store", "there", "here", "also", "just", "like", "best", "good", "cheap"
]);

function productLine(p) {
  const link = `${CLIENT_URL}/products/${p.slug}`;
  return `• **${p.title}** — $${p.price} (${p.category?.name || "General"}) — [View](${link})`;
}

function formatCatalogEntry(p) {
  const tags = (p.tags || []).join(", ") || "none";
  return `- ${p.title} | $${p.price} | ${p.category?.name || "General"} | slug:${p.slug} | tags:${tags}`;
}

function extractSearchTerms(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/s$/, "").replace(/ies$/, "y").replace(/ing$/, ""))
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function detectIntent(message) {
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings|sup|yo|good\s+(morning|afternoon|evening))\b/.test(lower)) {
    return { type: "greeting" };
  }
  if (/\b(thank|thanks|thx|appreciate)\b/.test(lower)) return { type: "thanks" };
  if (/\b(categor|types of products|what do you sell|what do you offer)\b/.test(lower)) return { type: "categories" };
  if (/\b(order|orders|purchased|bought|my purchase)\b/.test(lower)) return { type: "orders" };
  if (/\b(pay|payment|stripe|card|checkout|refund|billing)\b/.test(lower)) return { type: "payment" };
  if (/\b(ship|shipping|deliver|delivery|download|instant access)\b/.test(lower)) return { type: "delivery" };
  if (/^(help|i need help|support|contact)\b/.test(lower) || /\b(help me|customer support)\b/.test(lower)) {
    return { type: "support" };
  }

  const budgetMatch = lower.match(/(?:under|below|less than|max|budget|cheaper than)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (budgetMatch || /\b(price|prices|pricing|cost|how much|expensive|afford)\b/.test(lower)) {
    return { type: "pricing", maxPrice: budgetMatch ? parseFloat(budgetMatch[1]) : null };
  }

  const productSignals =
    /\b(find|search|looking for|recommend|suggest|show me|need a|want a|any)\b/.test(lower) ||
    /\b(ui\s*kit|uikit|template|ebook|e-book|source\s*code|prompt|figma|icon|bundle|asset|kit)\b/i.test(lower) ||
    extractSearchTerms(message).length >= 1;

  if (/\b(blog|article|articles|guides?)\b/.test(lower) && !productSignals) return { type: "blog" };

  if (
    /\b(all products|product list|full catalog|what products|what do you have|show everything)\b/.test(lower) ||
    /^what products do you have\??$/.test(lower)
  ) {
    return { type: "product_browse" };
  }

  if (productSignals) return { type: "product_search" };

  if (/^(how|why|when|where|can i|do you|is it|are there)\b/.test(lower)) return { type: "faq" };

  return { type: "general" };
}

async function searchProducts(query) {
  const terms = extractSearchTerms(query);
  if (!terms.length) return [];

  const categories = await Category.find({
    $or: terms.map((t) => ({ name: { $regex: t, $options: "i" } }))
  }).select("_id name");

  const orConditions = terms.flatMap((t) => [
    { title: { $regex: t, $options: "i" } },
    { description: { $regex: t, $options: "i" } },
    { tags: { $regex: t, $options: "i" } }
  ]);
  if (categories.length) orConditions.push({ category: { $in: categories.map((c) => c._id) } });

  const found = await Product.find({ $or: orConditions })
    .limit(20)
    .select("title price slug category description tags")
    .populate("category", "name");

  const scored = found
    .map((p) => {
      const titleL = p.title.toLowerCase();
      const hay = `${titleL} ${(p.description || "").toLowerCase()} ${(p.tags || []).join(" ").toLowerCase()}`;
      let score = 0;
      for (const t of terms) {
        if (titleL.includes(t)) score += 4;
        else if (hay.includes(t)) score += 2;
        if (categories.some((c) => c.name.toLowerCase().includes(t))) score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map((x) => x.p);
}

async function productsUnderBudget(maxPrice) {
  return Product.find({ price: { $lte: maxPrice } })
    .sort({ price: 1 })
    .limit(5)
    .select("title price slug category description tags")
    .populate("category", "name");
}

async function buildStoreContext(message, intent) {
  const categories = await Category.find().select("name description");
  let products = [];
  let maxPrice = intent.maxPrice ?? null;

  if (intent.type === "product_search") {
    products = await searchProducts(message);
  } else if (intent.type === "product_browse") {
    products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title price slug category description tags")
      .populate("category", "name");
  } else if (intent.type === "pricing" && maxPrice) {
    products = await productsUnderBudget(maxPrice);
  }

  return { categories, products, intent, maxPrice };
}

function buildSystemPrompt({ categories, products, intent, maxPrice }, message) {
  const catBlock = categories.map((c) => `• ${c.name}`).join("\n");
  const showCatalog = ["product_search", "product_browse", "pricing"].includes(intent.type);
  const catalogBlock = showCatalog && products.length
    ? products.map(formatCatalogEntry).join("\n")
    : "(do not list products unless user asks — see rules below)";

  return `You are the shopping assistant for **Digital Bazaar** (digital products: UI kits, templates, ebooks, code, prompts).

USER MESSAGE: "${message}"
DETECTED INTENT: ${intent.type}

CATEGORIES: ${catBlock || "none"}

${showCatalog && products.length ? `RELEVANT PRODUCTS ONLY (max 3 in reply):\n${catalogBlock}` : "No product list for this question — answer the question directly."}
${maxPrice ? `Budget filter: under $${maxPrice}` : ""}

RULES (critical):
1. ANSWER THE USER'S ACTUAL QUESTION FIRST — do not ignore it
2. ONLY mention products if intent is product_search, product_browse, or pricing — and list AT MOST 3 items
3. For orders/payments/delivery/help: 2–4 sentences, NO product list
4. For greetings/general: brief welcome, ask what they need — NO product dump
5. Use exact titles/prices from catalog; link: [Title](${CLIENT_URL}/products/SLUG)
6. If no matching products, say so and suggest different keywords
7. Never list the entire catalog`;
}

const DETERMINISTIC_INTENTS = new Set(["greeting", "thanks", "categories", "orders", "payment", "delivery", "support", "faq", "blog"]);

async function smartFallback(message, storeCtx) {
  const { categories, products, intent, maxPrice } = storeCtx;
  const lower = message.toLowerCase().trim();

  if (intent.type === "greeting") {
    return {
      answer: `Hello! 👋 Welcome to **Digital Bazaar**.\n\nI can help you find products, explain orders & payments, or point you to our guides.\n\n→ [Shop products](${CLIENT_URL}/products) · [Blog](${CLIENT_URL}/blog)\n\nWhat would you like to know?`,
      category: "greeting"
    };
  }

  if (intent.type === "thanks") {
    return { answer: "You're welcome! 😊 Let me know if you need anything else.", category: "thanks" };
  }

  if (intent.type === "categories") {
    if (!categories.length) return { answer: "Categories are being updated. Check back soon!", category: "categories" };
    const list = categories.map((c) => `• **${c.name}** — ${c.description || "Browse items"}`).join("\n");
    return { answer: `Our categories:\n\n${list}\n\nAsk e.g. "templates under $20" for specific picks.`, category: "categories" };
  }

  if (intent.type === "orders") {
    return {
      answer:
        "📦 **Orders:** After payment, downloads are instant. Open **Dashboard** (when logged in) to access all purchases anytime.",
      category: "orders"
    };
  }

  if (intent.type === "payment") {
    return {
      answer:
        "💳 **Payments:** We use secure **Stripe** (credit/debit cards). Digital products unlock immediately after checkout. For refunds, contact support with your order ID.",
      category: "payment"
    };
  }

  if (intent.type === "delivery") {
    return {
      answer:
        "📥 **Delivery:** Everything is **100% digital** — no shipping. After checkout, download from your **Dashboard**. Links stay available for lifetime access.",
      category: "delivery"
    };
  }

  if (intent.type === "support") {
    return {
      answer:
        "🛟 I can help with product search, orders, payments, and downloads.\n\nBrowse [All Products](" +
        CLIENT_URL +
        "/products) or read tips on our [Blog](" +
        CLIENT_URL +
        "/blog).\n\nWhat do you need?",
      category: "support"
    };
  }

  if (intent.type === "blog") {
    return {
      answer:
        "📖 Our **Blog** has guides on UI design, pricing, SEO, SaaS, and selling digital products.\n\n→ [Read the Blog](" +
        CLIENT_URL +
        "/blog)\n\nAsk me about a topic and I can suggest articles or products.",
      category: "blog"
    };
  }

  if (intent.type === "faq" || intent.type === "general") {
    return {
      answer:
        `I understand you're asking about the store. I can explain **orders**, **payments**, **downloads**, or **find products** for you.\n\nTry:\n• "How does delivery work?"\n• "UI kit under $30"\n• [Browse all products](${CLIENT_URL}/products)`,
      category: "general"
    };
  }

  if (intent.type === "pricing") {
    const stats = await Product.aggregate([
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }
    ]);
    const min = stats[0]?.min ?? 0;
    const max = stats[0]?.max ?? 0;

    if (maxPrice && products.length) {
      const list = products.map(productLine).join("\n");
      return { answer: `Under **$${maxPrice}**:\n\n${list}`, category: "pricing" };
    }
    if (maxPrice && !products.length) {
      return { answer: `No products found under **$${maxPrice}**. Our range is **$${min}–$${max}** — try a higher budget or browse [products](${CLIENT_URL}/products).`, category: "pricing" };
    }
    return {
      answer: `Our prices range from **$${min}** to **$${max}**. Tell me a budget (e.g. "under $20") and I'll suggest matching items.`,
      category: "pricing"
    };
  }

  if (intent.type === "product_browse") {
    if (!products.length) return { answer: "Our catalog is being updated. Please check back soon!", category: "products" };
    const list = products.map(productLine).join("\n");
    return {
      answer: `Here are some of our latest products:\n\n${list}\n\nSee everything on [All Products](${CLIENT_URL}/products).`,
      category: "products"
    };
  }

  if (intent.type === "product_search") {
    if (products.length) {
      const list = products.map(productLine).join("\n");
      return {
        answer: `Based on your question, these are the best matches:\n\n${list}\n\nWant more detail on one? Ask by name.`,
        category: "products"
      };
    }
    const terms = extractSearchTerms(message);
    return {
      answer: terms.length
        ? `I couldn't find products matching **${terms.join(", ")}**. Try different keywords or browse [all products](${CLIENT_URL}/products).`
        : `Tell me what you're looking for (e.g. "Figma UI kit" or "ebook under $15") and I'll search for you.`,
      category: "products"
    };
  }

  return {
    answer: `How can I help? Ask about products, orders, payments, or delivery — or browse [here](${CLIENT_URL}/products).`,
    category: "general"
  };
}

function buildChatMessages(message, history, systemPrompt) {
  const prior = (history || [])
    .filter((m) => m?.role && m?.text)
    .slice(-8)
    .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

  return [{ role: "system", content: systemPrompt }, ...prior, { role: "user", content: message }];
}

function inferCategory(intent, answer) {
  if (intent.type !== "general" && intent.type !== "faq") return intent.type;
  const text = answer.toLowerCase();
  if (text.includes("view](")) return "products";
  return "general";
}

async function generateReply(message, history) {
  const intent = detectIntent(message);
  const storeCtx = await buildStoreContext(message, intent);

  const useRuleEngine =
    DETERMINISTIC_INTENTS.has(intent.type) ||
    intent.type === "product_search" ||
    intent.type === "product_browse" ||
    intent.type === "pricing";

  if (useRuleEngine) {
    return smartFallback(message, storeCtx);
  }

  const systemPrompt = buildSystemPrompt(storeCtx, message);

  try {
    const aiAnswer = await completeChat(buildChatMessages(message, history, systemPrompt));
    if (aiAnswer) {
      return { answer: aiAnswer, category: inferCategory(intent, aiAnswer) };
    }
  } catch (err) {
    console.warn(`[chat] AI (${getActiveProviderLabel()}) failed:`, err.message);
  }

  return smartFallback(message, storeCtx);
}

export const chat = asyncHandler(async (req, res) => {
  const { message, sessionId, history } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message is required" });

  const { answer, category } = await generateReply(message.trim(), history);

  let logId = null;
  try {
    const log = await ChatLog.create({
      sessionId: sessionId || "anonymous",
      userMessage: message.trim(),
      botResponse: answer,
      category
    });
    logId = log._id;
  } catch (_) {
    /* non-critical */
  }

  res.json({ answer, logId, category, provider: getActiveProviderLabel() });
});

export const getChatStatus = asyncHandler(async (_req, res) => {
  res.json({
    provider: getActiveProviderLabel(),
    aiEnabled: getActiveProviderLabel() !== "fallback",
    hint:
      getActiveProviderLabel() === "fallback"
        ? "Add GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY to server/.env"
        : null
  });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const { logId, helpful } = req.body;
  if (!logId || typeof helpful !== "boolean") {
    return res.status(400).json({ message: "logId and helpful (boolean) are required" });
  }
  const log = await ChatLog.findByIdAndUpdate(logId, { helpful }, { new: true });
  if (!log) return res.status(404).json({ message: "Chat log not found" });
  res.json({ ok: true });
});

export const getChatStats = asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalChats,
    todayChats,
    weekChats,
    uniqueSessions,
    helpfulStats,
    categoryBreakdown,
    dailyChats,
    recentChats
  ] = await Promise.all([
    ChatLog.countDocuments(),
    ChatLog.countDocuments({ createdAt: { $gte: today } }),
    ChatLog.countDocuments({ createdAt: { $gte: last7 } }),
    ChatLog.distinct("sessionId"),
    ChatLog.aggregate([{ $match: { helpful: { $ne: null } } }, { $group: { _id: "$helpful", count: { $sum: 1 } } }]),
    ChatLog.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ChatLog.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    ChatLog.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .select("sessionId userMessage botResponse category helpful createdAt")
  ]);

  const helpfulYes = helpfulStats.find((h) => h._id === true)?.count || 0;
  const helpfulNo = helpfulStats.find((h) => h._id === false)?.count || 0;
  const feedbackTotal = helpfulYes + helpfulNo;

  res.json({
    totalChats,
    todayChats,
    weekChats,
    uniqueSessions: uniqueSessions.length,
    helpfulRate: feedbackTotal ? Math.round((helpfulYes / feedbackTotal) * 100) : null,
    helpfulYes,
    helpfulNo,
    categoryBreakdown,
    dailyChats,
    recentChats,
    aiProvider: getActiveProviderLabel()
  });
});
