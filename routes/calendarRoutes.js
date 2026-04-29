import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getFamilyCalendarEvents } from "../controllers/calendarController.js";

const router = express.Router();

// 🗓️ Get calendar events for a specific family
router.get("/:familyId", protect, getFamilyCalendarEvents);

export default router;
