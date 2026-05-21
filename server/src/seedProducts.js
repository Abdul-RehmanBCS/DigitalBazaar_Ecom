import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import { getProductSeedData } from "./data/products.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/digital_bazaar";

async function seedProducts() {
  await mongoose.connect(MONGO_URI);

  const categories = await Category.find();
  if (!categories.length) {
    console.error("No categories found. Run npm run seed first.");
    process.exit(1);
  }

  const catMap = {};
  categories.forEach((c) => (catMap[c.slug] = c._id));

  await Product.deleteMany({});
  const products = await Product.insertMany(getProductSeedData(catMap));

  console.log(`✅ Seeded ${products.length} products with cover images`);
  await mongoose.disconnect();
}

seedProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
