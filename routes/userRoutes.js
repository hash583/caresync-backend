import express from "express";
import { updateAvailability } from "../controllers/userController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/availability", protect, updateAvailability);

export default router;