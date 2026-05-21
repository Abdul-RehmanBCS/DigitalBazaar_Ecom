import express from "express";
import { googleAuth, login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", protect, me);

export default router;
