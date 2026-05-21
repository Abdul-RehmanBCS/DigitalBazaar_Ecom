import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema(
  {
    sessionId: String,
    userMessage: { type: String, required: true },
    botResponse: { type: String, required: true },
    category: { type: String, default: "general" },
    helpful: { type: Boolean, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatLogSchema.index({ createdAt: -1 });

export default mongoose.model("ChatLog", chatLogSchema);
