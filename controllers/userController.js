import User from "../models/User.js";

export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Validate input
    if (typeof req.body.isAvailable !== "boolean") {
      return res.status(400).json({
        message: "isAvailable must be true or false",
      });
    }

    // ✅ Update directly (safer than find + save)
    const user = await User.findByIdAndUpdate(
      userId,
      { isAvailable: req.body.isAvailable },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Availability updated successfully",
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    console.error("Availability Error:", error); // 🔥 important for debugging

    res.status(500).json({
      message: "Server error while updating availability",
      error: error.message,
    });
  }
};