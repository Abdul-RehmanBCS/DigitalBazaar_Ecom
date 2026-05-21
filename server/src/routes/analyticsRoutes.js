import express from "express";
import { trackEvent, getFullAdminStats } from "../controllers/analyticsController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/track", trackEvent);
router.get("/admin/full-stats", protect, adminOnly, getFullAdminStats);

export default router;
