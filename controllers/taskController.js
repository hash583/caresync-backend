import Task from "../models/Task.js";
import User from "../models/User.js";
import FamilyGroup from "../models/FamilyGroup.js";
import sendEmail from "../utils/sendEmail.js";
import { getIO } from "../socket/socket.js"; // ✅ NEW

/* =====================================================
🤖 AI SCORING ENGINE
===================================================== */

const calculateUserScore = (tasks) => {
  const weights = { Low: 1, Medium: 2, High: 3, Urgent: 5 };

  let activeLoad = 0;
  let overduePenalty = 0;
  let urgencyPressure = 0;
  let taskCount = 0;

  const now = new Date();

  tasks.forEach((task) => {
    if (task.status !== "Completed") {
      taskCount++;

      const weight = weights[task.priority] || 1;
      activeLoad += weight;

      // 🔴 Overdue tasks (heavy penalty)
      if (task.dueDate && new Date(task.dueDate) < now) {
        overduePenalty += 5;
      }

      // ⏰ Future urgency (NEW 🔥)
      if (task.dueDate) {
        const diffHours = (new Date(task.dueDate) - now) / (1000 * 60 * 60);

        if (diffHours < 24) urgencyPressure += 4;       // very urgent
        else if (diffHours < 72) urgencyPressure += 2;  // medium urgency
        else urgencyPressure += 1;
      }

      // 🚨 Extra boost for urgent priority
      if (task.priority === "Urgent") {
        urgencyPressure += 2;
      }
    }
  });

  // ⚖️ Final balanced score
  return (
    activeLoad * 1.2 +
    overduePenalty * 2 +
    urgencyPressure +
    taskCount * 0.8
  );
};
/* =====================================================
🤖 AI USER SELECTION WITH EXPLANATION
===================================================== */

const findBestUserAI = async (family) => { // removed excludeUserId
  if (!family) return null;

  // Get all available family members
  const members = await User.find({
    _id: { $in: family.members },
    isAvailable: true,
  });

  if (!members || members.length === 0) return null;

  let bestUser = null;
  let lowestScore = Infinity;
  let bestReason = {};

  for (const member of members) {
    // No exclusion — all members including creator are eligible
    const tasks = await Task.find({
      assignedTo: member._id,
      family: family._id,
      status: { $ne: "Completed" },
    });

    const score = calculateUserScore(tasks);

    console.log(
      `AI Check → ${member.name}: Score=${score}, Tasks=${tasks.length}`
    );

    if (score < lowestScore) {
      lowestScore = score;
      bestUser = member;

      bestReason = {
        score,
        activeTasks: tasks.length,
        message: `Assigned due to lowest workload (${tasks.length} active tasks)`,
      };
    }
  }

  return { user: bestUser, reason: bestReason };
};

/* =====================================================
🚀 CREATE TASK
===================================================== */

export const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, familyId } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!title || !familyId) {
      return res.status(400).json({
        message: "Title and Family ID are required",
      });
    }

    const familyObj = await FamilyGroup.findOne({
      _id: familyId,
      members: req.user._id,
    });

    if (!familyObj) {
      return res.status(403).json({
        message: "You are not part of this family",
      });
    }

   const aiResult = await findBestUserAI(familyObj);

    if (!aiResult || !aiResult.user) {
      return res.status(400).json({
        message: "No available users to assign task",
      });
    }

   let task = await Task.create({
  family: familyObj._id,
  assignedBy: req.user._id,
  assignedTo: aiResult.user._id,
  title,
  description,
  priority,
  dueDate: dueDate ? new Date(dueDate) : null,
  aiExplanation: aiResult.reason,
});

// ✅ IMPORTANT: populate before sending response
task = await task.populate("assignedTo", "name email isAvailable");
task = await task.populate("assignedBy", "name email");

    // ⚡ SOCKET EMIT (REAL-TIME)
    try {
      const io = getIO();
      io.to(familyId).emit("taskCreated", task);
    } catch (err) {
      console.error("Socket error:", err.message);
    }

    // 📧 EMAIL
   try {
  console.log("📧 Attempting to send email...");
  console.log("User Email:", aiResult.user.email);

  await sendEmail({
    email: aiResult.user.email,
    subject: "New Task Assigned",
    message: `
Hello ${aiResult.user.name},

You have been assigned a new task.

Title: ${title}
Priority: ${priority || "Medium"}
Due Date: ${dueDate || "Not specified"}

🤖 Reason: ${aiResult.reason.message}

CareSync AI System
`,
  });

  console.log("✅ Email sent successfully");
} catch (emailError) {
  console.error("❌ Email failed:", emailError);
}

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create Task Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating task",
      error: error.message,
    });
  }
};

/* =====================================================
📊 GET FAMILY TASKS
===================================================== */

export const getFamilyTasks = async (req, res) => {
  try {
    const { familyId } = req.params;

    const familyObj = await FamilyGroup.findOne({
      _id: familyId,
      members: req.user._id,
    });

    if (!familyObj) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const tasks = await Task.find({ family: familyId })
      .populate("assignedTo", "name email isAvailable")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get Family Tasks Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch family tasks",
    });
  }
};

/* =====================================================
🔄 UPDATE TASK STATUS (REAL-TIME)
===================================================== */

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    task.status = status;
    await task.save();

    // ⚡ SOCKET UPDATE
    try {
      const io = getIO();
      io.to(task.family.toString()).emit("taskUpdated", task);
    } catch (err) {
      console.error("Socket error:", err.message);
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Update Task Status Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task status",
    });
  }
};

/* =====================================================
✏️ UPDATE TASK
===================================================== */

export const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const familyObj = await FamilyGroup.findOne({
      _id: task.family,
      members: req.user._id,
    });

    if (!familyObj) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);

    await task.save();

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

/* =====================================================
🗑 DELETE TASK
===================================================== */

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const familyObj = await FamilyGroup.findOne({
      _id: task.family,
      members: req.user._id,
    });

    if (!familyObj) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

/* =====================================================
👤 GET USER TASKS
===================================================== */

export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const tasks = await Task.find({ assignedTo: userId })
      .populate("assignedTo", "name email isAvailable")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get User Tasks Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user tasks",
    });
  }
};