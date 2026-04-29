// /model/healthlog
import mongoose from "mongoose";

const healthLogSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vitals: {
      bloodPressure: {
    systolic: Number,
    diastolic: Number,
  },
      sugar: Number,
      weight: Number,
      heartRate: Number,
    },
    notes: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  suggestions: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

const HealthLog = mongoose.model("HealthLog", healthLogSchema);
export default HealthLog;
