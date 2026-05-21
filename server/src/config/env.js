import dotenv from "dotenv";

// Prefer server/.env over stale shell exports during local development.
dotenv.config({ override: process.env.NODE_ENV !== "production" });

const isProd = process.env.NODE_ENV === "production";

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (value) return value;
  console.error(`[env] Missing required variable: ${name}`);
  process.exit(1);
}

function dedupeMongoQuery(search) {
  if (!search) return "";
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const out = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (!out.has(key)) out.set(key, value);
  }
  const serialized = out.toString();
  return serialized ? `?${serialized}` : "";
}

export function normalizeMongoUri(uri) {
  if (!uri) return uri;
  const trimmed = uri.trim();
  const qIndex = trimmed.indexOf("?");
  const query = qIndex >= 0 ? trimmed.slice(qIndex) : "";
  let base = qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed;

  if (!base.includes("/digital_bazaar")) {
    if (/\.mongodb\.net\/?$/.test(base)) {
      base = base.replace(/\.mongodb\.net\/?$/, ".mongodb.net/digital_bazaar");
    } else if (/mongodb:\/\/[^/]+\/?$/.test(base)) {
      base = base.replace(/\/?$/, "/digital_bazaar");
    }
  }

  return base + dedupeMongoQuery(query);
}

function buildMongoUriFromParts() {
  const user = process.env.MONGO_USER?.trim();
  const password = process.env.MONGO_PASSWORD?.trim();
  const cluster = process.env.MONGO_CLUSTER?.trim();
  if (!user || !password || !cluster) return "";
  const host = cluster.replace(/^mongodb(\+srv)?:\/\//, "").replace(/\/$/, "");
  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/digital_bazaar?retryWrites=true&w=majority`;
}

// Prefer split Atlas vars (avoids truncated MONGO_URI in Render dashboard).
const builtFromParts = buildMongoUriFromParts();
if (builtFromParts) {
  process.env.MONGO_URI = builtFromParts;
} else if (!process.env.MONGO_URI?.trim()) {
  console.error("[env] MONGO_URI (or MONGO_USER + MONGO_PASSWORD + MONGO_CLUSTER) is required");
  process.exit(1);
}

process.env.MONGO_URI = normalizeMongoUri(process.env.MONGO_URI.trim());

if (isProd && !process.env.MONGO_URI.includes("digital_bazaar")) {
  console.error("[env] MONGO_URI must include /digital_bazaar");
  process.exit(1);
}

if (!process.env.CLIENT_URL?.trim()) {
  process.env.CLIENT_URL = "https://digitalbazaar-web.onrender.com";
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET?.trim() || (isProd ? requireEnv("JWT_SECRET") : "dev-jwt-secret"),
  CLIENT_URL: process.env.CLIENT_URL.replace(/\/$/, ""),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim() || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.trim() || "sk_test_placeholder",
  GROQ_API_KEY: process.env.GROQ_API_KEY?.trim() || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || "",
};
