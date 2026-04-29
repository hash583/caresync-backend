import HealthLog from "../models/HealthLog.js";
import Task from "../models/Task.js";
import Event from "../models/Event.js";
import Reminder from "../models/Reminder.js";
import FamilyGroup from "../models/FamilyGroup.js";
import mongoose from "mongoose";

// --------------------------- HELPER: AI Suggestions ---------------------------
const generateAISuggestions = (category, data) => {
  switch (category) {
    case "health":
      return data.map(log => ({
        date: log.date,
        suggestions: log.suggestions?.messages || ["Keep tracking your health!"]
      }));

    case "tasks":
      const { total, completed, overdue } = data;
      const suggestions = [];
      if (overdue > 0) suggestions.push(`Prioritize your ${overdue} overdue task(s).`);
      if (total > completed) suggestions.push("Focus on high-priority tasks during your peak hours.");
      if (total === completed && total > 0) suggestions.push("Great job! Keep maintaining task completion streak.");
      if (total === 0) suggestions.push("You have no tasks assigned. Take initiative to create new ones.");
      return { total, completed, overdue, suggestions };

    case "events":
      return data.map(ev => ({
        title: ev.title,
        date: ev.date,
        suggestions: [
          `Prepare for "${ev.title}" in advance.`,
          "Allocate time for post-event reflection or notes."
        ]
      }));

    case "reminders":
      return data.map(r => ({
        title: r.title || r.description || "Reminder",
        date: r.nextRun || r.date || new Date(),
        suggestions: [
          r.active ? "Try to complete this reminder on time." : "Keep the streak going!"
        ]
      }));

    case "family":
      return {
        tasksCompletedByYou: data.tasksByYou,
        tasksCompletedByOthers: data.tasksByOthers,
        upcomingEvents: data.upcomingEvents,
        suggestions: [
          data.tasksByYou > data.tasksByOthers ? "Consider delegating tasks to family members." : "Great teamwork! Keep it up.",
          data.upcomingEvents > 0 ? "Encourage participation in upcoming family events." : "No upcoming family events."
        ]
      };

    default:
      return [];
  }
};

// --------------------------- CONTROLLER ---------------------------
export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();

    // ------------------- Health Logs -------------------
    const healthLogsRaw = await HealthLog.find({ recordedBy: userId })
      .sort({ date: -1 })
      .limit(10);
    const healthLogs = generateAISuggestions("health", healthLogsRaw);

    // ------------------- Tasks -------------------
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $lt: today },
      status: { $ne: "Completed" },
    });
    const tasksData = generateAISuggestions("tasks", { total: totalTasks, completed: completedTasks, overdue: overdueTasks });

    // ------------------- Events -------------------
    const upcomingEventsRaw = await Event.find({
      $or: [
        { userId },
        { familyId: { $in: (await FamilyGroup.find({ members: userId })).map(f => f._id) } }
      ],
      date: { $gte: today }
    })
      .sort({ date: 1 })
      .limit(5);
    const events = generateAISuggestions("events", upcomingEventsRaw);

    // ------------------- Reminders -------------------
    const remindersRaw = await Reminder.find({ createdBy: userId }) // fetch reminders created by the user
      .sort({ date: 1 }) // sort by upcoming
      .limit(10);
    const reminders = generateAISuggestions("reminders", remindersRaw);

    // ------------------- Family Insights -------------------
    const families = await FamilyGroup.find({ members: userId });
    let familyData = { tasksByYou: 0, tasksByOthers: 0, upcomingEvents: 0 };
    if (families.length > 0) {
      const familyIds = families.map(f => f._id);
      const familyTasks = await Task.find({ familyId: { $in: familyIds } });
      familyData.tasksByYou = familyTasks.filter(t => t.assignedTo.toString() === userId.toString()).length;
      familyData.tasksByOthers = familyTasks.length - familyData.tasksByYou;

      const familyEvents = await Event.find({ familyId: { $in: familyIds }, date: { $gte: today } });
      familyData.upcomingEvents = familyEvents.length;
    }
    const family = generateAISuggestions("family", familyData);

    // ------------------- Final Response -------------------
    res.status(200).json({
      healthLogs,
      tasks: tasksData,
      events,
      reminders,
      family
    });
  } catch (error) {
    console.error("AI Insights Error:", error);
    res.status(500).json({ message: "Failed to fetch AI insights", error: error.message });
  }
};
