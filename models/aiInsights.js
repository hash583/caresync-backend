// models/AIInsight.js
import mongoose from "mongoose";

const aiInsightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyGroup" },
    taskSummary: { type: Object, default: {} },
    eventSummary: { type: Object, default: {} },
    healthSummary: { type: Object, default: {} },
    suggestions: { type: [String], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const AIInsight = mongoose.model("AIInsight", aiInsightSchema);
export default AIInsight;
