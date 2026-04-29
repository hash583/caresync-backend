import crypto from "crypto";
import Family from "../models/FamilyGroup.js";
import User from "../models/User.js"; 

// Create new family group
export const createFamilyGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const inviteCode = crypto.randomBytes(4).toString("hex");

    const group = await Family.create({
      name,
      createdBy: req.user._id,
      members: [req.user._id],
      inviteCode,
    });

    // populate members including isAvailable
    const populatedGroup = await Family.findById(group._id)
      .populate("members", "name email isAvailable")
      .populate("createdBy", "name email");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Create family error:", error);
    res.status(500).json({
      message: "Error creating family group",
      error: error.message,
    });
  }
};

// Get all family groups for the logged-in user
export const getMyFamilies = async (req, res) => {
  try {
    const families = await Family.find({ members: req.user._id })
      .populate("members", "name email isAvailable") // ✅ include availability
      .populate("createdBy", "name email");

    res.json(families);
  } catch (error) {
    res.status(500).json({ message: "Error fetching family groups", error });
  }
};

// Join family using invite code
export const joinFamily = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const family = await Family.findOne({ inviteCode });
    if (!family) return res.status(404).json({ message: "Invalid invite code" });

    if (family.members.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already a member of this family" });
    }

    family.members.push(req.user._id);
    await family.save();

    const populatedFamily = await Family.findById(family._id)
      .populate("members", "name email isAvailable")
      .populate("createdBy", "name email");

    res.json({ message: "Successfully joined the family", family: populatedFamily });
  } catch (error) {
    res.status(500).json({ message: "Error joining family", error });
  }
};

// Add Member (Admin Only)
export const addMember = async (req, res) => {
  try {
    const { familyId, userEmails } = req.body;
    const adminId = req.user._id;

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    if (family.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only the admin can add members" });
    }

    if (!Array.isArray(userEmails) || userEmails.length === 0) {
      return res.status(400).json({ message: "Provide at least one email" });
    }

    for (const email of userEmails) {
      const userToAdd = await User.findOne({ email });
      if (!userToAdd) continue;

      if (family.members.some(m => m.toString() === userToAdd._id.toString())) continue;

      family.members.push(userToAdd._id);
    }

    await family.save();

    const populatedFamily = await Family.findById(family._id)
      .populate("members", "name email isAvailable") // ✅ include availability
      .populate("createdBy", "name email");

    res.status(200).json({ message: "Members added successfully", family: populatedFamily });
  } catch (error) {
    console.error("Add multiple members error:", error);
    res.status(500).json({ message: "Error adding members", error: error.message });
  }
};

// Remove Member (Admin Only)
export const removeMember = async (req, res) => {
  try {
    const { familyId, userId } = req.body;
    const adminId = req.user._id;

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    if (family.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only the admin can remove members" });
    }

    if (userId === adminId.toString()) {
      return res.status(400).json({ message: "Admin cannot remove themselves" });
    }

    if (!family.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member of this family" });
    }

    family.members = family.members.filter(m => m.toString() !== userId);
    await family.save();

    const populatedFamily = await Family.findById(family._id)
      .populate("members", "name email isAvailable") // ✅ include availability
      .populate("createdBy", "name email");

    res.status(200).json({ message: "Member removed successfully", family: populatedFamily });
  } catch (error) {
    console.error("Remove Member Error:", error);
    res.status(500).json({ message: "Error removing member", error: error.message });
  }
};

// Delete Family (Admin Only)
export const deleteFamily = async (req, res) => {
  try {
    const familyId = req.params.id;
    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family group not found" });

    if (family.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the family admin can delete this group" });
    }

    await family.deleteOne();
    res.json({ message: "Family group deleted successfully" });
  } catch (error) {
    console.error("Delete family group error:", error);
    res.status(500).json({ message: "Server error" });
  }
  // Get all groups of the user 
  
};
export const getUserGroups = async (req, res) => 
    { try { const userId = req.user.id; 
      const groups = await FamilyGroup.find({ $or: [{ createdBy: userId },
         { members: userId }] }); res.status(200).json(groups);
         }
          catch (error) { console.error("Error fetching user groups:", error);
             res.status(500).json({ message: "Server error", error }); 
            } 
};