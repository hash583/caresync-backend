//backend/routes/chatroute.js
import express from "express";
import { sendMessage, getFamilyMessages } from "../controllers/chatController.js";
import {protect} from "../middlewares/authMiddleware.js";
import upload  from "../middlewares/upload.js";

const router = express.Router();

// Get messages of a family
router.get("/:familyId", protect, getFamilyMessages);

// Send message (text/file)
router.post("/:familyId", protect, upload.single("file"),sendMessage);

export default router;
