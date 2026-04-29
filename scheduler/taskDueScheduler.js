import cron from "node-cron";
import Task from "../models/Task.js";
import Reminder from "../models/Reminder.js";
import sendEmail from "../utils/sendEmail.js";

cron.schedule("0 8,20 * * *", async () => {
  try {
    const now = new Date();

    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "Completed" }
    }).populate("user assignedTo familyId");

    for (const task of overdueTasks) {
      // Check if reminder already created
      const exists = await Reminder.findOne({
        taskId: task._id,
        type: "Task Due"
      });

      if (exists) continue;

      // Create reminder once
      await Reminder.create({
        title: `Task Overdue: ${task.title}`,
        description: task.description,
        userId: task.assignedTo || task.user,
        familyId: task.familyId,
        taskId: task._id,
        type: "Task Due",
        nextRun: now,
        status: "Missed"
      });

      // Send email once
      await sendEmail(
        task.user.email,
        "Your task is overdue!",
        `
        Hello,
        Your task "${task.title}" was due on ${task.dueDate.toDateString()}.
        Please take action.
        `
      );

      console.log("Overdue reminder created and email sent for task:", task.title);
    }
  } catch (err) {
    console.error("Error in Task Due Scheduler:", err);
  }
});


export default {};
