import express from "express";
import { deleteUser, getAdminStats, getUsers, updateCart, updateWishlist } from "../controllers/userController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.put("/wishlist", protect, updateWishlist);
router.put("/cart", protect, updateCart);
router.get("/", protect, adminOnly, getUsers);
router.delete("/:id", protect, adminOnly, deleteUser);
router.get("/admin/stats", protect, adminOnly, getAdminStats);

export default router;
