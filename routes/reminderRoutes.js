import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createReminder,
  getReminders,
  completeReminder,
} from "../controllers/reminderController.js";

const router = express.Router();

router.route("/").get(protect, getReminders).post(protect, createReminder);

// Complete reminder
router.patch("/:id/complete", protect, completeReminder);

export default router;
