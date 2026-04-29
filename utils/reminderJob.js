import cron from "node-cron";
import Task from "../models/Task.js";
import User from "../models/User.js";
import sendEmail from "./sendEmail.js";

export const startReminderJob = () => {
  // ⏰ Runs every day at 8 PM
  cron.schedule("0 20 * * *", async () => {
    console.log("⏰ Running daily task reminder job...");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingTasks = await Task.find({
        status: { $ne: "Completed" },
        dueDate: { $lte: new Date() }, // due today or overdue
      }).populate("assignedTo");

      for (const task of pendingTasks) {
        const user = task.assignedTo;

        if (!user || !user.email) continue;

        try {
          await sendEmail({
            email: user.email,
            subject: "⚠️ Task Reminder - Pending Task",
            message: `
Hello ${user.name},

⏰ Reminder: You have a pending task that is not completed.

📌 Title: ${task.title}
🔥 Priority: ${task.priority}
📅 Due Date: ${task.dueDate?.toDateString()}

Please complete it as soon as possible.

CareSync AI System
            `,
          });

          console.log(`📧 Reminder sent to ${user.email}`);
        } catch (err) {
          console.error("Email failed:", err.message);
        }
      }
    } catch (error) {
      console.error("Reminder Job Error:", error.message);
    }
  });
};