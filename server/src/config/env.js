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

process.env.MONGO_URI = normalizeMongoUri(
  process.env.MONGO_URI?.trim() || requireEnv("MONGO_URI")
);

if (isProd && !process.env.MONGO_URI.includes("digital_bazaar")) {
  console.error("[env] MONGO_URI must include /digital_bazaar");
  process.exit(1);
}

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!stripeKey && isProd) {
  console.warn("[env] STRIPE_SECRET_KEY missing — set in Render dashboard");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: requireEnv("JWT_SECRET"),
  CLIENT_URL: requireEnv("CLIENT_URL").replace(/\/$/, ""),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim() || "",
  STRIPE_SECRET_KEY: stripeKey || "sk_test_placeholder",
  GROQ_API_KEY: process.env.GROQ_API_KEY?.trim() || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || "",
};
