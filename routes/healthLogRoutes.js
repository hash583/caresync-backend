// routes/healthlog
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createHealthLog,
  getFamilyHealthLogs,
  getHealthLogById,
  getUserHealthLogs,
  updateHealthLog,
  deleteHealthLog,
} from "../controllers/healthLogController.js";

const router = express.Router();

router.post("/", protect, createHealthLog);
router.get("/family/:familyId", protect, getFamilyHealthLogs);
router.get("/user/:userId", protect, getUserHealthLogs);

// NEW: Get all logs for CURRENT logged-in user
router.get("/me", protect, getUserHealthLogs);
// GET single health log by ID
router.get("/:id", protect, getHealthLogById);
router.put("/:logId", protect, updateHealthLog);
router.delete("/:logId", protect, deleteHealthLog);

export default router;
