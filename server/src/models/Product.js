import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }],
    digitalFileURL: { type: String, required: true },
    stock: { type: Number, default: -1 },
    tags: [{ type: String }],
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [{ type: String }],
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
