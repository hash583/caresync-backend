import express from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./socket/socket.js";
import { startReminderJob } from "./utils/reminderJob.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import healthLogRoutes from "./routes/healthLogRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";


import reminderRoutes from "./routes/reminderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiInsightsRoutes from "./routes/aiInsightsRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import nursebookingRoutes from "./routes/nursebooking.js";

// Schedulers
import "./scheduler/checkMissedReminders.js";
import "./scheduler/taskDueScheduler.js";
import "./scheduler/aiInsightsScheduler.js";
import { generateWeeklyReports } from "./utils/weeklyReport.js";

// Env
dotenv.config();

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CREATE APP FIRST
const app = express();

// ✅ CORS
app.use(cors({
  origin: [
    // "https://caresyncsmartcare.netlify.app",
    // "https://caresynccare.netlify.app"
    "https://frontend-caresync.vercel.app/"
  ],
  credentials: true,
}));

// Middleware
app.use(express.json());

// ✅ DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

//schdueler
cron.schedule("0 9 * * 0", async () => {
  console.log("📊 Running Weekly Reports...");
  await generateWeeklyReports();
});
startReminderJob();

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/healthlogs", healthLogRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/sync", syncRoutes);


app.use("/api/reminders", reminderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai-insights", aiInsightsRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/users", userRoutes);
app.use("/api", nursebookingRoutes);

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("CareSync API is running 🚀");
});

// ✅ CREATE SERVER FROM APP
const server = http.createServer(app);

// ✅ INIT SOCKET
initSocket(server);

// ✅ ONLY THIS LISTEN (IMPORTANT)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});