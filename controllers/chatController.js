import Message from "../models/Message.js";
import FamilyGroup from "../models/FamilyGroup.js";
import { getIO } from "../socket/socket.js"; // 👈 your backend socket file


/**
 * 📩 SEND MESSAGE (REAL-TIME)
 */
export const sendMessage = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { text } = req.body;

    // 🔐 Check family exists
    const family = await FamilyGroup.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // 🔐 JWT user already attached by middleware
    const userId = req.user._id;

    // 👨‍👩‍👧 Check membership
    const isMember = family.members.some(
      (m) => m.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 📎 File handling
    const filePath = req.file
      ? `uploads/chat/${req.file.filename}`
      : null;

    // 💾 Save message
    const message = await Message.create({
      family: familyId,
      sender: userId,
      text,
      file: filePath,
      fileType: req.file?.mimetype,
    });

    // 👤 Populate sender
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email");

    // 🔥 SOCKET REAL-TIME EMIT (IMPORTANT PART)
    const io = getIO();

    io.to(`family_${familyId}`).emit(
      "receiveMessage",
      populatedMessage
    );

    return res.status(201).json(populatedMessage);

  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({
      message: "Error sending message",
      error: error.message,
    });
  }
};

/**
 * 💬 GET FAMILY MESSAGES (NORMAL API)
 */
export const getFamilyMessages = async (req, res) => {
  try {
    const { familyId } = req.params;

    const family = await FamilyGroup.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    const isMember = family.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ family: familyId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    return res.json(messages);

  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({
      message: "Error fetching messages",
      error: error.message,
    });
  }
};