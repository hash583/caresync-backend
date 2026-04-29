import express from "express";
import {
  sendEmergencyAlert,
  getEmergencyNotifications,
  markEmergencyAsRead,
  resolveEmergency,
} from "../controllers/emergencyController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, sendEmergencyAlert);
router.get("/notifications", protect, getEmergencyNotifications);
router.put("/read/:emergencyId", protect, markEmergencyAsRead);
router.put("/resolve/:emergencyId", protect, resolveEmergency);

export default router;