import Task from "../models/Task.js";
import ForumPost from "../models/ForumPost.js";
import Reminder from "../models/Reminder.js";
import FamilyGroup from "../models/FamilyGroup.js";

// 🟢 Get all updated data since last sync
export const getUpdatesSince = async (req, res) => {
  try {
    const { lastSync } = req.query;
    const userId = req.user._id;

    const since = lastSync ? new Date(lastSync) : new Date(0);

    const updatedTasks = await Task.find({
      $or: [{ assignedTo: userId }, { assignedBy: userId }],
      updatedAt: { $gte: since },
    });

    const updatedReminders = await Reminder.find({
      assignedTo: userId,
      updatedAt: { $gte: since },
    });

    const updatedPosts = await ForumPost.find({
      updatedAt: { $gte: since },
    });

    res.status(200).json({
      updatedAt: new Date(),
      tasks: updatedTasks,
      reminders: updatedReminders,
      posts: updatedPosts,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching updates", error: error.message });
  }
};

// 🔄 Sync local changes (offline data)
export const syncLocalChanges = async (req, res) => {
  try {
    const { tasks, reminders, posts } = req.body;
    const userId = req.user._id;

    const saved = { tasks: [], reminders: [], posts: [] };

    // 🧩 Find user's first family (for fallback familyId)
    const userFamily = await FamilyGroup.findOne({ members: userId });

    // ➕ Save tasks
    if (tasks?.length) {
      for (const t of tasks) {
        const newTask = await Task.create({
          ...t,
          assignedBy: userId,
          assignedTo: t.assignedTo || userId, // fallback
          familyId: t.familyId || (userFamily ? userFamily._id : null),
        });
        saved.tasks.push(newTask);
      }
    }

    // ➕ Save reminders
    if (reminders?.length) {
      for (const r of reminders) {
        const newRem = await Reminder.create({
          ...r,
          createdBy: userId,
          assignedTo: r.assignedTo || userId,
          familyId: r.familyId || (userFamily ? userFamily._id : null),
        });
        saved.reminders.push(newRem);
      }
    }

    // ➕ Save posts
    if (posts?.length) {
      for (const p of posts) {
        const newPost = await ForumPost.create({
          ...p,
          author: userId,
        });
        saved.posts.push(newPost);
      }
    }

    res.status(201).json({
      message: "Offline changes synced successfully",
      saved,
    });
  } catch (error) {
    console.error("❌ Sync Error:", error);
    res.status(500).json({ message: "Error syncing local changes", error: error.message });
  }
};
