import mongoose from "mongoose";

const RETRIES = 5;
const DELAY_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`[db] Attempt ${attempt}/${RETRIES} failed: ${error.message}`);
      if (attempt === RETRIES) throw error;
      await sleep(DELAY_MS);
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export const isDbReady = () => mongoose.connection.readyState === 1;
