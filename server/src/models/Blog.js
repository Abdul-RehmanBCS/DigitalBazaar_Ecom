import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    author: { type: String, default: "Digital Bazaar Team" },
    tags: [{ type: String }],
    readTime: { type: Number, default: 5 },
    published: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String
  },
  { timestamps: true }
);

blogSchema.index({ published: 1, createdAt: -1 });

export default mongoose.model("Blog", blogSchema);
