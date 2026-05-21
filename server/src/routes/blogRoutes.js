import express from "express";
import {
  createBlog,
  createBlogWithAI,
  deleteBlog,
  getAdminBlogs,
  getBlogBySlug,
  getBlogs,
  getRelatedBlogs
} from "../controllers/blogController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", getBlogs);
router.get("/admin/all", protect, adminOnly, getAdminBlogs);
router.post("/ai", protect, adminOnly, createBlogWithAI);
router.get("/:slug/related", getRelatedBlogs);
router.get("/:slug", getBlogBySlug);
router.post("/", protect, adminOnly, createBlog);
router.delete("/:id", protect, adminOnly, deleteBlog);

export default router;
