import mongoose from "mongoose";
import User from "./User.js";

const taskSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FamilyGroup",
    required: true,
    index: true,
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  dueDate: {
    type: Date,
    index: true,
  },

  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
    index: true,
  },

  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
    index: true,
  },

  /* =====================================================
  🤖 AI EXPLANATION (NEW)
  ===================================================== */
  aiExplanation: {
    score: {
      type: Number,
      default: 0,
    },
    activeTasks: {
      type: Number,
      default: 0,
    },
    message: {
      type: String,
      default: "",
    },
  },

},
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// 🟢 Active check
taskSchema.virtual("isActive").get(function () {
  return this.status === "Pending" || this.status === "In Progress";
});

// 🔴 Overdue check
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  return this.status !== "Completed" && this.dueDate < new Date();
});

// ⚖️ AI workload score
taskSchema.virtual("workloadScore").get(function () {
  const weights = {
    Low: 1,
    Medium: 2,
    High: 3,
    Urgent: 5,
  };

  return this.isActive ? weights[this.priority] || 1 : 0;
});

// 🚫 Prevent assigning to unavailable users
taskSchema.pre("save", async function (next) {
  if (this.isModified("assignedTo")) {
    const user = await User.findById(this.assignedTo);
    if (!user || !user.isAvailable) {
      return next(new Error("Assigned user is unavailable"));
    }
  }
  next();
});

const Task = mongoose.model("Task", taskSchema);

export default Task;