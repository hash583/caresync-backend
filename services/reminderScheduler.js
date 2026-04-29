import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import twilio from "twilio";

// ---------------- EMAIL SETUP ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- WHATSAPP (Twilio) ----------------
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ---------------- MAIN SCHEDULER ----------------
cron.schedule("* * * * *", async () => {
  console.log("⏳ Checking reminders...");

  const now = new Date();

  // Fetch all active reminders whose time has passed
  const reminders = await Reminder.find({
    active: true,
    nextRun: { $lte: now }
  });

  for (const reminder of reminders) {
    console.log("📌 Triggering reminder:", reminder.title);

    // Find assigned user
    const user = await User.findById(reminder.assignedTo);

    if (!user) continue;

    // ---------------- SEND EMAIL ----------------
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Reminder: ${reminder.title}`,
      text: reminder.description || "You have a reminder pending.",
    });

    console.log("📧 Email sent to", user.email);

    // ---------------- SEND WHATSAPP ----------------
    try {
      await client.messages.create({
        body: `🔔 Reminder: ${reminder.title}\n${reminder.description || ""}`,
        from: "whatsapp:" + process.env.TWILIO_WHATSAPP_NUMBER,
        to: "whatsapp:" + user.phone,
      });

      console.log("📱 WhatsApp message sent to", user.phone);
    } catch (err) {
      console.log("⚠ WhatsApp sending error:", err.message);
    }

    // ---------------- UPDATE NEXT RUN ----------------
    if (reminder.recurrence === "none") {
      reminder.active = false; // one-time reminder ends
    } else {
      const next = new Date(reminder.nextRun);

      if (reminder.recurrence === "daily") next.setDate(next.getDate() + 1);  
      if (reminder.recurrence === "weekly") next.setDate(next.getDate() + 7);
      if (reminder.recurrence === "monthly") next.setMonth(next.getMonth() + 1);

      reminder.nextRun = next;
    }

    await reminder.save();
  }
});
