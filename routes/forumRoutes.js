import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPost,
  getPosts,
  toggleLikePost,
  deletePost,
  addComment,
  getComments,
  updatePost, 
  deleteComment// <-- import updatePost
} from "../controllers/forumController.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure 'uploads/' folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
router.post("/", protect, upload.single("image"), createPost);
router.put("/:postId", protect, upload.single("image"), updatePost); // <-- add this
router.get("/", protect, getPosts);
router.post("/:postId/like", protect, toggleLikePost);
router.delete("/:postId", protect, deletePost);
router.post("/comment", protect, addComment);
router.get("/:postId/comments", protect, getComments);
router.delete('/comment/:commentId', protect, deleteComment);

export default router;
