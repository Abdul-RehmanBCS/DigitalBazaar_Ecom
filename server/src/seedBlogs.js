import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Blog from "./models/Blog.js";
import { blogPosts } from "./data/blogPosts.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/digital_bazaar";

async function seedBlogs() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected — updating blog posts");

  await Blog.deleteMany({});
  const blogs = await Blog.insertMany(blogPosts.map((b) => ({ ...b, published: true })));

  console.log(`✅ Created ${blogs.length} blog posts (picsum cover images)`);
  await mongoose.disconnect();
}

seedBlogs().catch((err) => {
  console.error(err);
  process.exit(1);
});
