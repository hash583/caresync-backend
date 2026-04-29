// models/Caregiver.js
//Defines caregiver information like name, email, phone, and specialization.
//assignedPatients holds all patients linked to this caregiver (as ObjectId references).
//Automatically tracks createdAt and updatedAt timestamps.

import mongoose from "mongoose";

const caregiverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
      },
    ],
  },
  { timestamps: true }
);

const Caregiver = mongoose.model("Caregiver", caregiverSchema);
export default Caregiver;
