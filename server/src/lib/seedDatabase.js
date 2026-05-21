import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Blog from "../models/Blog.js";
import { blogPosts } from "../data/blogPosts.js";
import { getProductSeedData } from "../data/products.js";

/** Seed catalog only when the database is empty (safe for production restarts). */
export async function seedIfEmpty() {
  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log(`[seed] Skipped — ${productCount} products already in database`);
    return { seeded: false, productCount };
  }

  console.log("[seed] Empty database detected — seeding catalog...");

  let admin = await User.findOne({ email: "admin@digitalbazaar.com" });
  if (!admin) {
    admin = await User.create({
      name: "Admin",
      email: "admin@digitalbazaar.com",
      password: "admin123",
      role: "admin",
    });
  }

  let user = await User.findOne({ email: "john@example.com" });
  if (!user) {
    user = await User.create({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "user",
    });
  }

  const categoryCount = await Category.countDocuments();
  let categories;
  if (categoryCount === 0) {
    categories = await Category.insertMany([
      { name: "UI Kits", slug: "ui-kits", description: "Premium user interface design kits" },
      { name: "Templates", slug: "templates", description: "Ready-to-use website and app templates" },
      { name: "Ebooks", slug: "ebooks", description: "Digital books and learning resources" },
      { name: "Source Code", slug: "source-code", description: "Production-ready code bundles and boilerplates" },
      { name: "Prompts", slug: "prompts", description: "AI prompt packs for ChatGPT, Midjourney, and more" },
      { name: "Assets", slug: "assets", description: "Icons, illustrations, and graphic assets" },
    ]);
  } else {
    categories = await Category.find();
  }

  const catMap = {};
  categories.forEach((c) => (catMap[c.slug] = c._id));

  const products = await Product.insertMany(getProductSeedData(catMap));

  const blogCount = await Blog.countDocuments();
  if (blogCount === 0) {
    await Blog.insertMany(blogPosts.map((b) => ({ ...b, published: true })));
  }

  const orderCount = await Order.countDocuments();
  if (orderCount === 0 && products.length >= 3) {
    await Order.create({
      userId: user._id,
      products: [
        { product: products[0]._id, quantity: 1, price: products[0].price },
        { product: products[2]._id, quantity: 1, price: products[2].price },
      ],
      totalAmount: products[0].price + products[2].price,
      paymentStatus: "paid",
      orderStatus: "completed",
      transactionId: "demo_txn_001",
    });
  }

  console.log(`[seed] Done — ${products.length} products, ${categories.length} categories`);
  return { seeded: true, productCount: products.length };
}
