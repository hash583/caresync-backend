import Emergency from "../models/EmergencyAlert.js";
import Family from "../models/FamilyGroup.js";

/**
 * 🚨 Send Emergency Alert
 */
export const sendEmergencyAlert = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    // 🔍 Find family where user belongs
    const family = await Family.findOne({
      $or: [
        { createdBy: userId },
        { members: userId }
      ],
    });

    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // 🚨 Create emergency alert
    const emergency = await Emergency.create({
      familyId: family._id,
      sender: userId,
      message,
      readBy: [], // initially nobody read
    });

    res.status(201).json({
      message: "Emergency alert sent successfully",
      emergency,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error sending emergency alert",
      error: error.message,
    });
  }
};


/**
 * 🔔 Get Notifications (for Bell Icon)
 */
export const getEmergencyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find family
    const family = await Family.findOne({
      $or: [
        { createdBy: userId },
        { members: userId }
      ],
    });

    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // Get all emergency alerts for family except sender
    const emergencies = await Emergency.find({
      familyId: family._id,
      sender: { $ne: userId },
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ emergencies });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};


/**
 * ✅ Mark Emergency As Read
 */
export const markEmergencyAsRead = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const userId = req.user._id;

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    // Add user to readBy if not already added
    if (!emergency.readBy.includes(userId)) {
      emergency.readBy.push(userId);
      await emergency.save();
    }

    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({
      message: "Error updating read status",
      error: error.message,
    });
  }
};


/**
 * 🛑 Resolve Emergency
 */
export const resolveEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    emergency.isResolved = true;
    await emergency.save();

    res.status(200).json({ message: "Emergency resolved successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error resolving emergency",
      error: error.message,
    });
  }
};