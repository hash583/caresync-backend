//Simple in-app notifications stored per user for display in notification center.
//data holds contextual info (like reminderId) for frontend navigation.
//read tracks whether the user has seen the notification.
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyGroup", required: false },
    title: { type: String, required: true },
    message: { type: String },
    data: { type: Object }, // extra payload (taskId, reminderId, ...)
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
