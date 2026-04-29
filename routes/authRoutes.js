import express from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

// User registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);
router.get("/me", protect, getMe);
export default router;