import express from "express";
import { chat, getChatStats, getChatStatus, submitFeedback } from "../controllers/chatController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", chat);
router.get("/status", getChatStatus);
router.post("/feedback", submitFeedback);
router.get("/stats", protect, adminOnly, getChatStats);

export default router;
