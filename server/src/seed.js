import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Blog from "./models/Blog.js";
import { blogPosts } from "./data/blogPosts.js";
import { getProductSeedData } from "./data/products.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/digital_bazaar";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  // Clear existing data
  await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany(), Order.deleteMany(), Blog.deleteMany()]);
  console.log("Cleared existing data");

  // Create admin user
  const admin = await User.create({
    name: "Admin",
    email: "admin@digitalbazaar.com",
    password: "admin123",
    role: "admin"
  });
  console.log("Admin created: admin@digitalbazaar.com / admin123");

  // Create test user
  const user = await User.create({
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: "user"
  });
  console.log("Test user created: john@example.com / password123");

  // Create categories
  const categories = await Category.insertMany([
    { name: "UI Kits", slug: "ui-kits", description: "Premium user interface design kits" },
    { name: "Templates", slug: "templates", description: "Ready-to-use website and app templates" },
    { name: "Ebooks", slug: "ebooks", description: "Digital books and learning resources" },
    { name: "Source Code", slug: "source-code", description: "Production-ready code bundles and boilerplates" },
    { name: "Prompts", slug: "prompts", description: "AI prompt packs for ChatGPT, Midjourney, and more" },
    { name: "Assets", slug: "assets", description: "Icons, illustrations, and graphic assets" }
  ]);
  console.log(`Created ${categories.length} categories`);

  const catMap = {};
  categories.forEach((c) => (catMap[c.slug] = c._id));

  const products = await Product.insertMany(getProductSeedData(catMap));
  console.log(`Created ${products.length} products`);

  const blogs = await Blog.insertMany(blogPosts.map((b) => ({ ...b, published: true })));
  console.log(`Created ${blogs.length} blog posts`);

  // Create a sample order
  await Order.create({
    userId: user._id,
    products: [
      { product: products[0]._id, quantity: 1, price: products[0].price },
      { product: products[2]._id, quantity: 1, price: products[2].price }
    ],
    totalAmount: products[0].price + products[2].price,
    paymentStatus: "paid",
    orderStatus: "completed",
    transactionId: "demo_txn_001"
  });
  console.log("Created sample order");

  await mongoose.disconnect();
  console.log("\n✅ Database seeded successfully!");
  console.log("----------------------------------");
  console.log("Admin login: admin@digitalbazaar.com / admin123");
  console.log("User login:  john@example.com / password123");
  console.log("----------------------------------");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
