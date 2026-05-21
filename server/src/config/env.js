import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (value) return value;
  console.error(`[env] Missing required variable: ${name}`);
  process.exit(1);
}

export function normalizeMongoUri(uri) {
  if (!uri) return uri;
  if (uri.includes("/digital_bazaar")) return uri;
  if (/\.mongodb\.net\/?(\?|$)/.test(uri)) {
    return uri.replace(/(\.mongodb\.net)\/?(\?|$)/, "$1/digital_bazaar$2");
  }
  if (/mongodb:\/\/[^/]+\/?(\?|$)/.test(uri) && !uri.match(/mongodb:\/\/[^/]+\/[^/?]+/)) {
    return uri.replace(/(mongodb:\/\/[^/]+)\/?(\?|$)/, "$1/digital_bazaar$2");
  }
  return uri;
}

if (!process.env.MONGO_URI?.trim()) {
  console.error("[env] MONGO_URI is required");
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
