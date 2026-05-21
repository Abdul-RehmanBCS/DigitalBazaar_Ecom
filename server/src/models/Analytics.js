import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["page_view", "product_view", "blog_view", "search", "chat", "add_to_cart", "checkout", "signup"],
      required: true
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    sessionId: String,
    userAgent: String,
    ip: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model("Analytics", analyticsSchema);
