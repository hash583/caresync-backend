import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["Appointment","Medication","Task","Reminder"], 
      required: true 
    },
    date: { type: Date, required: true },
    time: { type: String },
    isAllDay: { type: Boolean, default: false },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String , required: true },
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyGroup", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
