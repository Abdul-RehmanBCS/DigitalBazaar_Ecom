import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import User from "../models/User.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { products, totalAmount, transactionId, paymentStatus = "paid" } = req.body;
  const order = await Order.create({
    userId: req.user._id,
    products,
    totalAmount,
    transactionId,
    paymentStatus
  });
  await User.findByIdAndUpdate(req.user._id, { $push: { orders: order._id }, $set: { cart: [] } });
  res.status(201).json(order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).populate("products.product").sort({ createdAt: -1 });
  res.json(orders);
});

export const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().populate("userId", "name email").populate("products.product").sort({ createdAt: -1 });
  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: req.body.orderStatus }, { new: true });
  res.json(order);
});
