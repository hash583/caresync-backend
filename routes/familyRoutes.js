import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createFamilyGroup,
  joinFamily,
  getUserGroups,
  getMyFamilies ,
  addMember,
  removeMember,
  deleteFamily
} from "../controllers/familyController.js";

const router = express.Router();

router.post("/create", protect, createFamilyGroup);
router.post("/join", protect, joinFamily);
router.get("/my-groups", protect, getUserGroups);
// ✅ New route
router.get("/my-families", protect, getMyFamilies);
router.post("/add-member", protect, addMember);
router.post("/remove-member", protect, removeMember);

router.delete("/delete/:id", protect, deleteFamily);

export default router;
