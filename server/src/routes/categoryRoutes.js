import express from "express";
import { createCategory, getCategories } from "../controllers/categoryController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);

export default router;
