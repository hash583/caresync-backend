import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getAIInsights } from "../controllers/aiInsightsController.js";

const router = express.Router();

router.get("/me", protect, getAIInsights);

export default router;
