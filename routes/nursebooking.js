import express from "express";
import { bookNurse } from "../controllers/nursebookingController.js";

const router = express.Router();

router.post("/book-nurse", bookNurse);

export default router;