import mongoose from "mongoose";

const familyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

const FamilyGroup = mongoose.model("FamilyGroup", familyGroupSchema);
export default FamilyGroup;
