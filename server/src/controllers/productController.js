import asyncHandler from "express-async-handler";
import slugify from "slugify";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

export const createProduct = asyncHandler(async (req, res) => {
  const body = req.body;
  const images = req.files?.map((f) => `/uploads/${f.filename}`) || [];
  let category = body.category;
  if (!category) {
    let uncategorized = await Category.findOne({ slug: "uncategorized" });
    if (!uncategorized) {
      uncategorized = await Category.create({ name: "Uncategorized", slug: "uncategorized", description: "Default category" });
    }
    category = uncategorized._id;
  }
  const product = await Product.create({
    ...body,
    category,
    slug: slugify(body.title, { lower: true, strict: true }),
    tags: body.tags ? body.tags.split(",").map((x) => x.trim()) : [],
    metaKeywords: body.metaKeywords ? body.metaKeywords.split(",").map((x) => x.trim()) : [],
    images
  });
  res.status(201).json(product);
});

export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search = "", category, minPrice, maxPrice, sort, featured } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } }
    ];
  }
  if (category) query.category = category;
  if (minPrice || maxPrice) query.price = { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 1000000) };
  if (featured === "true") query.featured = true;

  let sortOpt = { createdAt: -1 };
  if (sort === "price-asc") sortOpt = { price: 1 };
  if (sort === "price-desc") sortOpt = { price: -1 };
  if (sort === "title") sortOpt = { title: 1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(query).populate("category").sort(sortOpt).skip(skip).limit(Number(limit)),
    Product.countDocuments(query)
  ]);
  res.json({ items, total, pages: Math.ceil(total / Number(limit)) });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("category");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const images = req.files?.length ? req.files.map((f) => `/uploads/${f.filename}`) : product.images;
  Object.assign(product, {
    ...req.body,
    slug: req.body.title ? slugify(req.body.title, { lower: true, strict: true }) : product.slug,
    images
  });
  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});
