import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import FamilyGroup from "../models/FamilyGroup.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("⏳ Checking medicine reminders...");

  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:mm"

    // Find reminders scheduled for this minute
    const reminders = await Reminder.find({
      time: currentTime,
    }).populate("family");

    for (const r of reminders) {
      if (!r.family?.members?.length) continue;

      const message = `💊 Medicine Reminder
Medicine: ${r.medicineName}
Dosage: ${r.dosage}
Time: ${r.time}`;

      for (const memberId of r.family.members) {
        const user = await User.findById(memberId);
        if (!user || !user.email) continue;

        try {
          await sendEmail(
            user.email,
            "Medicine Reminder",
            message
          );

          console.log("✅ Reminder sent to", user.email);
        } catch (err) {
          console.error("❌ Email failed:", err.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ Missed reminder scheduler error:", err);
  }
});
