import asyncHandler from "express-async-handler";
import slugify from "slugify";
import Blog from "../models/Blog.js";
import { generateBlogFromTitle } from "../lib/blogGenerator.js";

const blogCover = (slug) => `https://picsum.photos/seed/blog-${slug}/800/450`;

async function uniqueSlug(baseTitle) {
  let base = slugify(baseTitle, { lower: true, strict: true });
  if (!base) base = "blog-post";
  let slug = base;
  let n = 1;
  while (await Blog.findOne({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export const getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search = "", tag, featured } = req.query;
  const query = { published: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } }
    ];
  }
  if (tag) query.tags = { $regex: tag, $options: "i" };
  if (featured === "true") query.featured = true;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Blog.countDocuments(query)
  ]);

  res.json({ items, total, pages: Math.ceil(total / Number(limit)) });
});

export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, published: true });
  if (!blog) {
    res.status(404);
    throw new Error("Blog post not found");
  }
  res.json(blog);
});

export const getRelatedBlogs = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, published: true });
  if (!blog) {
    res.status(404);
    throw new Error("Blog post not found");
  }

  const related = await Blog.find({
    published: true,
    _id: { $ne: blog._id },
    tags: { $in: blog.tags }
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .select("title slug excerpt coverImage author readTime createdAt tags");

  if (related.length < 3) {
    const fill = await Blog.find({ published: true, _id: { $nin: [blog._id, ...related.map((b) => b._id)] } })
      .sort({ createdAt: -1 })
      .limit(3 - related.length)
      .select("title slug excerpt coverImage author readTime createdAt tags");
    related.push(...fill);
  }

  res.json(related);
});

export const getAdminBlogs = asyncHandler(async (req, res) => {
  const items = await Blog.find().sort({ createdAt: -1 }).limit(100);
  res.json({ items, total: items.length });
});

export const createBlogWithAI = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  if (!title) {
    res.status(400);
    throw new Error("Blog title is required");
  }
  if (title.length > 200) {
    res.status(400);
    throw new Error("Title must be 200 characters or less");
  }

  const generated = await generateBlogFromTitle(title);
  const slug = await uniqueSlug(title);

  const blog = await Blog.create({
    title,
    slug,
    excerpt: generated.excerpt,
    content: generated.content,
    coverImage: blogCover(slug),
    author: generated.author,
    tags: generated.tags,
    readTime: generated.readTime,
    metaTitle: generated.metaTitle,
    metaDescription: generated.metaDescription,
    published: true,
    featured: false
  });

  res.status(201).json({
    blog,
    aiProvider: generated.provider || "builtin"
  });
});

export const createBlog = asyncHandler(async (req, res) => {
  const body = req.body;
  const blog = await Blog.create({
    ...body,
    slug: body.slug || slugify(body.title, { lower: true, strict: true }),
    tags: body.tags ? (Array.isArray(body.tags) ? body.tags : body.tags.split(",").map((t) => t.trim())) : []
  });
  res.status(201).json(blog);
});

export const deleteBlog = asyncHandler(async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ message: "Blog deleted" });
});
