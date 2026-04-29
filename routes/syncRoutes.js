import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getUpdatesSince, syncLocalChanges } from "../controllers/syncController.js";

const router = express.Router();

router.get("/", protect, getUpdatesSince);
router.post("/", protect, syncLocalChanges);

export default router; // 👈 THIS LINE IS CRUCIAL
