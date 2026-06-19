import express from "express";
import { checkAuth } from "../controllers/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// /api/auth/check

router.get("/check", protectRoute, checkAuth);

export default router;