import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { connectDB, disconnectDB, isDbReady } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import { getActiveProviderLabel } from "./lib/llmClient.js";
import { seedIfEmpty } from "./lib/seedDatabase.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ORIGINS = [
  "https://digitalbazaar-web.onrender.com",
  process.env.CLIENT_URL?.replace(/\/$/, ""),
].filter(Boolean);

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, ALLOWED_ORIGINS[0] || true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (_req, res) => {
  res.json({ service: "digitalbazaar-api", ok: true, dbReady: isDbReady() });
});

app.get("/api/health", (_req, res) => {
  const ready = isDbReady();
  res.status(200).json({
    ok: true,
    dbReady: ready,
    env: env.NODE_ENV,
    db: "digital_bazaar",
    hint: ready
      ? undefined
      : "MongoDB not connected — allow 0.0.0.0/0 in Atlas Network Access",
  });
});

app.use((req, res, next) => {
  if (req.path === "/api/health" || req.path === "/") return next();
  if (!isDbReady()) {
    return res.status(503).json({ message: "Database is connecting, retry shortly" });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/blogs", blogRoutes);

app.use(notFound);
app.use(errorHandler);

const HOST = "0.0.0.0";

async function connectWithRetry() {
  try {
    await connectDB();
    try {
      await seedIfEmpty();
    } catch (seedErr) {
      console.error("[server] Auto-seed failed:", seedErr.message);
    }
    const ai = getActiveProviderLabel();
    console.log(`CORS allowed: ${ALLOWED_ORIGINS.join(", ")}`);
    console.log(
      `Chat AI: ${ai === "fallback" ? "rule-based (set GROQ_API_KEY or GEMINI_API_KEY)" : ai}`
    );
    return true;
  } catch (err) {
    console.error("[server] Database connection failed:", err.message);
    return false;
  }
}

async function start() {
  const PORT = Number(process.env.PORT);
  if (!PORT) {
    console.error("[server] process.env.PORT is required");
    process.exit(1);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
  });

  if (!(await connectWithRetry())) {
    const timer = setInterval(async () => {
      if (await connectWithRetry()) clearInterval(timer);
    }, 30000);
  }

  const shutdown = async (signal) => {
    console.log(`${signal} received — closing server`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("[server] Failed to start:", err.message);
  process.exit(1);
});
