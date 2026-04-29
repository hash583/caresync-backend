import Reminder from "../models/Reminder.js";
import FamilyGroup from "../models/FamilyGroup.js";

// ==============================
// Create a general family reminder
// ==============================
export const createReminder = async (req, res) => {
  try {
    const { title, description, scheduledTime, family } = req.body;

    if (!title || !scheduledTime || !family) {
      return res.status(400).json({
        message: "Title, scheduled time, and family are required",
      });
    }

    // Validate family membership
    const fam = await FamilyGroup.findOne({
      _id: family,
      members: req.user._id,
    });

    if (!fam) {
      return res.status(403).json({ message: "Invalid family selection" });
    }

    // Create reminder
    const reminder = await Reminder.create({
      title,
      description: description || "",
      scheduledTime,
      family,
      createdBy: req.user._id,
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error("Create reminder error:", err);
    res.status(500).json({ message: "Failed to create reminder" });
  }
};

// ==============================
// Get reminders for all user families
// ==============================
export const getReminders = async (req, res) => {
  try {
    const families = await FamilyGroup.find({ members: req.user._id }).select("_id");
    const familyIds = families.map(f => f._id);

    const reminders = await Reminder.find({
      family: { $in: familyIds },
    })
      .populate("family", "name")
      .populate("createdBy", "name email")
      .populate("completedBy", "name email") // show who completed
      .sort({ scheduledTime: 1 }); // sort by upcoming

    res.json(reminders);
  } catch (err) {
    console.error("Get reminders error:", err);
    res.status(500).json({ message: "Error fetching reminders" });
  }
};

// ==============================
// Mark reminder as completed
// ==============================
export const completeReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findById(id);

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    if (reminder.isCompleted) {
      return res.status(400).json({ message: "Reminder already completed" });
    }

    // Mark as completed
    reminder.isCompleted = true;
    reminder.completedBy = req.user._id;
    reminder.completedAt = new Date();

    await reminder.save();

    // Populate fields correctly
    await reminder.populate([
      { path: "family", select: "name" },
      { path: "createdBy", select: "name email" },
      { path: "completedBy", select: "name email" },
    ]);

    res.json(reminder);
  } catch (err) {
    console.error("Complete reminder error:", err);
    res.status(500).json({ message: "Error completing reminder" });
  }
};

