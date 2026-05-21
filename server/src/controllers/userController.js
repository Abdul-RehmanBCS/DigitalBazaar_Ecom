import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Order from "../models/Order.js";

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

export const deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

export const updateWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);
  const exists = user.wishlist.some((id) => id.toString() === productId);
  user.wishlist = exists ? user.wishlist.filter((id) => id.toString() !== productId) : [...user.wishlist, productId];
  await user.save();
  res.json(user.wishlist);
});

export const updateCart = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { cart: req.body.cart }, { new: true });
  res.json(user.cart);
});

export const getAdminStats = asyncHandler(async (_req, res) => {
  const [totalUsers, totalOrders, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }])
  ]);
  res.json({ totalUsers, totalOrders, totalRevenue: revenueAgg[0]?.totalRevenue || 0 });
});
