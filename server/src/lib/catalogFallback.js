import { getProductSeedData } from "../data/products.js";
import { blogPosts } from "../data/blogPosts.js";
import { getActiveProviderLabel } from "./llmClient.js";

const CATEGORY_DEFS = [
  { name: "UI Kits", slug: "ui-kits", description: "Premium user interface design kits" },
  { name: "Templates", slug: "templates", description: "Ready-to-use website and app templates" },
  { name: "Ebooks", slug: "ebooks", description: "Digital books and learning resources" },
  { name: "Source Code", slug: "source-code", description: "Production-ready code bundles and boilerplates" },
  { name: "Prompts", slug: "prompts", description: "AI prompt packs for ChatGPT, Midjourney, and more" },
  { name: "Assets", slug: "assets", description: "Icons, illustrations, and graphic assets" },
];

function oid(n) {
  return String(n).padStart(24, "0");
}

let cache;

function buildCatalog() {
  if (cache) return cache;

  const categories = CATEGORY_DEFS.map((c, i) => ({
    _id: oid(i + 1),
    ...c,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }));

  const catMap = {};
  categories.forEach((c) => (catMap[c.slug] = c._id));

  const products = getProductSeedData(catMap).map((p, i) => ({
    _id: oid(100 + i),
    ...p,
    category: categories.find((c) => c._id === p.category) || categories[0],
    stock: -1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }));

  const blogs = blogPosts.map((b, i) => ({
    _id: oid(200 + i),
    ...b,
    published: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }));

  cache = { categories, products, blogs };
  return cache;
}

function filterProducts(query) {
  const { products } = buildCatalog();
  let items = [...products];
  const { search = "", category, minPrice, maxPrice, featured, sort } = query;

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (category) {
    items = items.filter((p) => String(p.category._id) === String(category) || p.category.slug === category);
  }
  if (minPrice || maxPrice) {
    items = items.filter(
      (p) => p.price >= Number(minPrice || 0) && p.price <= Number(maxPrice || 1_000_000)
    );
  }
  if (featured === "true") items = items.filter((p) => p.featured);

  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  else if (sort === "title") items.sort((a, b) => a.title.localeCompare(b.title));
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return items;
}

function filterBlogs(query) {
  const { blogs } = buildCatalog();
  let items = [...blogs];
  const { search = "", tag, featured } = query;

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (tag) {
    const t = String(tag).toLowerCase();
    items = items.filter((b) => b.tags?.some((x) => x.toLowerCase().includes(t)));
  }
  if (featured === "true") items = items.filter((b) => b.featured);

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items;
}

/** Read-only catalog routes that mirror localhost seed data when MongoDB is offline. */
export function isCatalogFallbackRoute(req) {
  if (req.method !== "GET" && !(req.method === "POST" && req.path === "/api/analytics/track")) {
    return false;
  }
  const p = req.path;
  if (p === "/api/categories") return true;
  if (p === "/api/products" || p.startsWith("/api/products/")) return true;
  if (p === "/api/blogs" || /^\/api\/blogs\/[^/]+(\/related)?$/.test(p)) return true;
  if (p === "/api/chat/status") return true;
  if (p === "/api/analytics/track" && req.method === "POST") return true;
  return false;
}

export function handleCatalogFallback(req, res) {
  res.setHeader("X-Catalog-Mode", "fallback");

  if (req.path === "/api/analytics/track") {
    return res.status(204).end();
  }

  if (req.path === "/api/chat/status") {
    const provider = getActiveProviderLabel();
    return res.json({
      provider,
      aiEnabled: provider !== "fallback",
      hint: provider === "fallback" ? "Add GROQ_API_KEY to enable AI chat" : null,
    });
  }

  if (req.path === "/api/categories") {
    return res.json(buildCatalog().categories);
  }

  if (req.path === "/api/products") {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    const items = filterProducts(req.query);
    const total = items.length;
    const skip = (page - 1) * limit;
    return res.json({
      items: items.slice(skip, skip + limit),
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  }

  const productSlug = req.path.match(/^\/api\/products\/([^/]+)$/)?.[1];
  if (productSlug) {
    const product = buildCatalog().products.find((p) => p.slug === productSlug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  }

  if (req.path === "/api/blogs") {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    const items = filterBlogs(req.query);
    const total = items.length;
    const skip = (page - 1) * limit;
    return res.json({
      items: items.slice(skip, skip + limit),
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  }

  const relatedMatch = req.path.match(/^\/api\/blogs\/([^/]+)\/related$/);
  if (relatedMatch) {
    const blog = buildCatalog().blogs.find((b) => b.slug === relatedMatch[1]);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    const related = buildCatalog().blogs
      .filter((b) => b.slug !== blog.slug)
      .slice(0, 3);
    return res.json(related);
  }

  const blogSlug = req.path.match(/^\/api\/blogs\/([^/]+)$/)?.[1];
  if (blogSlug) {
    const blog = buildCatalog().blogs.find((b) => b.slug === blogSlug);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.json(blog);
  }

  return res.status(503).json({ message: "Database is connecting, retry shortly" });
}
