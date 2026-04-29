import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createTask,
  getUserTasks,
  getFamilyTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| TASK ROUTES (AI-Based System)
|--------------------------------------------------------------------------
*/

router.post("/", protect, createTask);

router.get("/my-tasks", protect, getUserTasks);

router.get("/family/:familyId", protect, getFamilyTasks);

router.put("/:taskId/status", protect, updateTaskStatus);

router.put("/:taskId", protect, updateTask);

router.delete("/:taskId", protect, deleteTask);

export default router;