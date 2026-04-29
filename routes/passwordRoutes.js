import express from "express";
import { forgotPassword, resetPassword } from "../controllers/passwordController.js";

const router = express.Router();

router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

export default router;