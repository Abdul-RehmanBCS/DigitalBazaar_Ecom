import mongoose from "mongoose";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import { getProductSeedData } from "./data/products.js";
import { env } from "./config/env.js";

async function seedProducts() {
  await mongoose.connect(env.MONGO_URI);

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
