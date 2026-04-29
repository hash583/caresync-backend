import express from "express";
import { createEvent, getFamilyEvents, editEvent, deleteEvent } from "../controllers/eventController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.post("/create", protect, createEvent);
router.get("/family", protect, getFamilyEvents);
router.put("/:id", protect, editEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
