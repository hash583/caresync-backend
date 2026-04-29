import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    scheduledTime: { type: Date, required: true },
    family: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyGroup", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
