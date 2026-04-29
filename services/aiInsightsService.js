import Task from "../models/Task.js";
import Event from "../models/Event.js";
import HealthLog from "../models/HealthLog.js";
import FamilyGroup from "../models/FamilyGroup.js";
import AIInsight from "../models/aiInsights.js";

export const generateInsights = async () => {
  const families = await FamilyGroup.find().populate("members");

  for (const family of families) {
    let familyEngagementTotal = 0;
    let memberCount = family.members.length;

    for (const user of family.members) {
      const tasks = await Task.find({
        familyId: family._id,
        assignedTo: user._id,
      });

      const completed = tasks.filter(t => t.status === "Completed");
      const pending = tasks.filter(t => t.status !== "Completed");
      const overdue = tasks.filter(
        t => t.status !== "Completed" && t.dueDate < new Date()
      );

      const events = await Event.find({
        familyId: family._id,
        participants: user._id,
      });

      const healthLogs = await HealthLog.find({ userId: user._id });

      // Avg Completion Time
      let avgTime = 0;
      if (completed.length > 0) {
        const totalMs = completed.reduce((acc, t) => {
          if (!t.completedAt) return acc;
          return acc + (new Date(t.completedAt) - new Date(t.createdAt));
        }, 0);
        avgTime = totalMs / completed.length / (1000 * 60 * 60);
      }

      // Engagement Formula (Weighted)
      const engagement =
        ((completed.length * 5) +
          (events.length * 3) +
          (healthLogs.length * 2)) /
        10;

      familyEngagementTotal += engagement;

      // Burnout Detection
      const burnoutRisk =
        tasks.length > 10 && overdue.length > 3;

      // Inactivity Detection
      const lastTask = tasks.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];

      const inactivityAlert =
        !lastTask ||
        (new Date() - new Date(lastTask.updatedAt)) >
          1000 * 60 * 60 * 48;

      let alerts = [];
      let suggestions = [];

      if (overdue.length > 2)
        alerts.push("You have multiple overdue tasks.");

      if (burnoutRisk)
        alerts.push("High workload detected. Risk of burnout.");

      if (inactivityAlert)
        alerts.push("You have been inactive for 48 hours.");

      if (engagement < 5)
        suggestions.push("Increase participation in family tasks.");

      if (avgTime > 48)
        suggestions.push("Try completing tasks earlier to reduce backlog.");

      if (burnoutRisk)
        suggestions.push("Consider delegating some tasks.");

      const activityScore =
        completed.length * 10 - overdue.length * 5;

      const familyHealthScore =
        memberCount > 0
          ? Math.min(100, familyEngagementTotal / memberCount * 10)
          : 0;

      await AIInsight.create({
        familyId: family._id,
        userId: user._id,

        engagementRate: engagement,
        activityScore,

        totalTasks: tasks.length,
        completedTasks: completed.length,
        pendingTasks: pending.length,
        overdueTasks: overdue.length,
        avgCompletionTimeHours: avgTime,

        eventsParticipated: events.length,
        healthLogsCount: healthLogs.length,
        familyHealthScore,

        burnoutRisk,
        inactivityAlert,

        alerts,
        suggestions,
      });
    }
  }
};
