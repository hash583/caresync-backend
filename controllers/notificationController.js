//Lets a user fetch their latest notifications and mark one as read.
//Only returns notifications belonging to req.user.
//Simple, safe endpoints to power the frontend notification center.


import Notification from "../models/Notification.js";

// get notifications for logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const n = await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, { read: true }, { new: true });
    if (!n) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Marked read", notification: n });
  } catch (error) {
    res.status(500).json({ message: "Error marking notification", error: error.message });
  }
};
