import express from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  searchNotes,
} from "../controllers/noteController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotes);
router.post("/", protect, createNote);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);
router.patch("/pin/:id", protect, togglePin);
router.get("/search", protect, searchNotes);

export default router;
