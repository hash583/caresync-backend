import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  suggestTaskAssignment,
  checkHealthAlerts,
  getNutritionAdvice
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/suggest-task", protect, suggestTaskAssignment);
router.get("/alerts/:familyId", protect, checkHealthAlerts);
router.get("/nutrition", protect, getNutritionAdvice);

export default router;
