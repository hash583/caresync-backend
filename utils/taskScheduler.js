import Task from "../models/Task.js";
import Family from "../models/FamilyGroup.js";
import User from "../models/User.js";
import sendEmail from "./sendEmail.js";

// Max active tasks allowed
const MAX_TASKS = 3;

// Count active tasks (Pending + In Progress)
const countActiveTasks = async (userId) => {
  return await Task.countDocuments({
    assignedTo: userId,
    status: { $in: ["Pending", "In Progress"] },
  });
};

// Process queued tasks when capacity opens
export const processQueuedTasks = async (familyId) => {
  const family = await Family.findById(familyId);
  if (!family) return;

  // Get oldest queued task
  const queuedTask = await Task.findOne({
    familyId,
    status: "Queued",
  }).sort({ createdAt: 1 });

  if (!queuedTask) return;

  // Find member with capacity
  for (const memberId of family.members) {
    const activeCount = await countActiveTasks(memberId);

    if (activeCount < MAX_TASKS) {
      queuedTask.assignedTo = memberId;
      queuedTask.status = "Pending";
      await queuedTask.save();

      const user = await User.findById(memberId);

      if (user?.email) {
        await sendEmail({
          email: user.email,
          subject: "New Task Assigned - From Queue",
          message: `Hi ${user.name},

A queued task has now been assigned to you.

Title: ${queuedTask.title}

Please check your dashboard.

CareSync Team`,
        });
      }

      break;
    }
  }
};