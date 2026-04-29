import mongoose from "mongoose";
import Task from "../models/Task.js";
import Reminder from "../models/Reminder.js"; // ✅ new
// HealthLog removed or optional

export const getMyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // ----------------------
    // TASK SUMMARY
    // ----------------------
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: "Completed" },
    });

    // ----------------------
    // REMINDER SUMMARY
    // ----------------------
    const totalReminders = await Reminder.countDocuments({ assignedTo: userId });
    const completedReminders = await Reminder.countDocuments({
      assignedTo: userId,
      active: false,
    });
    const overdueReminders = await Reminder.countDocuments({
      assignedTo: userId,
      nextRun: { $lt: new Date() },
      active: true,
    });

   // ----------------------
// WEEKLY TASK ACTIVITY
// ----------------------
const last7Days = new Date();
last7Days.setDate(last7Days.getDate() - 6);

const weeklyRaw = await Task.aggregate([
  {
    $match: {
      assignedTo: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: last7Days },
    },
  },
  {
    $group: {
      _id: { $dayOfWeek: "$createdAt" },
      count: { $sum: 1 },
    },
  },
]);

const daysMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" };

// Convert DB results into lookup map
const weeklyDataMap = {};
weeklyRaw.forEach(item => {
  weeklyDataMap[item._id] = item.count;
});

const weeklyTasks = [
  { day: "Sun", count: weeklyDataMap[1] || 0 },
  { day: "Mon", count: weeklyDataMap[2] || 0 },
  { day: "Tue", count: weeklyDataMap[3] || 0 },
  { day: "Wed", count: weeklyDataMap[4] || 0 },
  { day: "Thu", count: weeklyDataMap[5] || 0 },
  { day: "Fri", count: weeklyDataMap[6] || 0 },
  { day: "Sat", count: weeklyDataMap[7] || 0 }
];
    // ----------------------
    // TASK TYPE BREAKDOWN
    // ----------------------
    const taskTypesRaw = await Task.aggregate([
      {
        $match: { assignedTo: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: { _id: "$priority", count: { $sum: 1 } },
      },
    ]);
    const taskTypes = taskTypesRaw.map((item) => ({ name: item._id || "Other", count: item.count }));

    // ----------------------
    // FINAL RESPONSE
    // ----------------------
    res.json({
      summary: {
        totalTasks,
        completedTasks,
        overdueTasks,
        totalReminders,
        completedReminders,
        overdueReminders,
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      weeklyTasks,
      taskTypes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Analytics fetch failed" });
  }
};
