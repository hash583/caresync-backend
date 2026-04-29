import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMyAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/me", protect, getMyAnalytics);

export default router;