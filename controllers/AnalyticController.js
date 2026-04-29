import mongoose from "mongoose";
import Task from "../models/Task.js";
import Reminder from "../models/Reminder.js";

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

    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Pending",
    });

    const inProgressTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "In Progress",
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

    const weeklyDataMap = {};
    weeklyRaw.forEach((item) => {
      weeklyDataMap[item._id] = item.count;
    });

    const weeklyTasks = [
      { day: "Sun", count: weeklyDataMap[1] || 0 },
      { day: "Mon", count: weeklyDataMap[2] || 0 },
      { day: "Tue", count: weeklyDataMap[3] || 0 },
      { day: "Wed", count: weeklyDataMap[4] || 0 },
      { day: "Thu", count: weeklyDataMap[5] || 0 },
      { day: "Fri", count: weeklyDataMap[6] || 0 },
      { day: "Sat", count: weeklyDataMap[7] || 0 },
    ];

    // ----------------------
    // TASK TYPE BREAKDOWN (FIXED)
    // ----------------------
    const taskTypes = [
      { name: "Pending", count: pendingTasks },
      { name: "In Progress", count: inProgressTasks },
      { name: "Completed", count: completedTasks },
    ];

    // ----------------------
    // AI LOGIC
    // ----------------------
    const completionRate = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const workloadScore = totalTasks + overdueTasks * 2;

    let aiInsight = "Balanced workload";

    if (overdueTasks > 3) {
      aiInsight = "⚠️ Too many overdue tasks. Immediate action required.";
    } else if (inProgressTasks > 5) {
      aiInsight = "⚡ High workload detected. Consider redistributing tasks.";
    } else if (completionRate > 80) {
      aiInsight = "🔥 Excellent performance. Keep it up!";
    }

    // ----------------------
    // RESPONSE
    // ----------------------
    res.json({
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,

        totalReminders,
        completedReminders,
        overdueReminders,

        completionRate,

        // Trends (static for now)
        completionRateChange: "+5%",
        totalTasksChange: "+2",
        completedTasksChange: "+1",

        // AI
        workloadScore,
        aiInsight,
      },
      weeklyTasks,
      taskTypes,
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Analytics fetch failed" });
  }
};