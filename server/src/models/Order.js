import mongoose from "mongoose";

const orderProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [orderProductSchema],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: "pending" },
    orderStatus: { type: String, default: "processing" },
    transactionId: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Order", orderSchema);
