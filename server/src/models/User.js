import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: String,
    price: Number,
    image: String,
    quantity: { type: Number, default: 1 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, minlength: 6 },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [cartItemSchema],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre("validate", function () {
  if (!this.googleId && !this.password) {
    this.invalidate("password", "Password is required");
  }
});

userSchema.methods.matchPassword = function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.createFromGoogle = function ({ name, email, googleId, avatar }) {
  return this.create({
    name,
    email,
    googleId,
    avatar,
    password: crypto.randomBytes(32).toString("hex")
  });
};

export default mongoose.model("User", userSchema);
