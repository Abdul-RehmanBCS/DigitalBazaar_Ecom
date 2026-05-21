import asyncHandler from "express-async-handler";
import slugify from "slugify";
import Category from "../models/Category.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, slug: slugify(name, { lower: true }), description });
  res.status(201).json(category);
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json(categories);
});
