import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  nurseName: String,
  nurseEmail: String,
  userName: String,
  userEmail: String,
  status: {
    type: String,
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Booking", bookingSchema);