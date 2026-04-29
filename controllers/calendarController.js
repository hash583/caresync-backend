import Task from "../models/Task.js";

// 📅 Fetch all tasks/events for a family calendar
export const getFamilyCalendarEvents = async (req, res) => {
  try {
    const { familyId } = req.params;

    const tasks = await Task.find({ familyId })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    // Format data for frontend calendar display
    const events = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      start: task.startDate || task.dueDate,
      end: task.endDate || task.dueDate,
      status: task.status,
      assignedTo: task.assignedTo?.name || "Unassigned",
      assignedBy: task.assignedBy?.name || "Unknown",
    }));

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching calendar events", error: error.message });
  }
};
