import FamilyGroup from "../models/FamilyGroup.js";
import Task from "../models/Task.js";
import HealthLog from "../models/HealthLog.js";
import User from "../models/User.js";

// 🧮 Fair Task Distribution
export const suggestTaskAssignment = async (req, res) => {
  try {
    const { familyId, title, description, dueDate } = req.body;

    const family = await FamilyGroup.findById(familyId).populate("members");
    if (!family) return res.status(404).json({ message: "Family not found" });

    // Count tasks per member
    const taskCounts = {};
    for (const member of family.members) {
      const count = await Task.countDocuments({ assignedTo: member._id, familyId });
      taskCounts[member._id] = count;
    }

    // Find member with fewest tasks
    const [leastBusyMember] = Object.entries(taskCounts).sort((a, b) => a[1] - b[1])[0];

    // Suggest assignment
    const memberDetails = family.members.find(m => m._id.toString() === leastBusyMember);

    res.status(200).json({
      message: `Suggested member for this task: ${memberDetails.name}`,
      suggestedMember: memberDetails,
      taskPreview: { title, description, dueDate }
    });
  } catch (error) {
    res.status(500).json({ message: "Error suggesting task assignment", error: error.message });
  }
};

// ⚠️ Health Alert Detection
export const checkHealthAlerts = async (req, res) => {
  try {
    const { familyId } = req.params;

    const logs = await HealthLog.find({ familyId }).populate("recordedBy", "name");
    const alerts = [];

    for (const log of logs) {
      const bp = log.vitals.bloodPressure?.split("/");
      const sugar = Number(log.vitals.sugarLevel);
      if (bp && (Number(bp[0]) > 140 || Number(bp[1]) > 90)) {
        alerts.push({
          type: "High Blood Pressure",
          message: `High BP (${log.vitals.bloodPressure}) recorded by ${log.recordedBy.name}`,
          logId: log._id
        });
      }
      if (sugar && sugar > 140) {
        alerts.push({
          type: "High Sugar Level",
          message: `Sugar ${sugar} mg/dL recorded by ${log.recordedBy.name}`,
          logId: log._id
        });
      }
    }

    res.status(200).json({ alerts });
  } catch (error) {
    res.status(500).json({ message: "Error checking health alerts", error: error.message });
  }
};

// 🥦 Nutrition / Wellness Suggestions
export const getNutritionAdvice = async (req, res) => {
  try {
    const { bp, sugar, weight } = req.query;

    let advice = [];

    if (bp) {
      const [sys, dia] = bp.split("/").map(Number);
      if (sys > 140 || dia > 90)
        advice.push("Reduce salt intake, avoid caffeine, and increase water consumption.");
      else
        advice.push("Maintain balanced diet with moderate exercise to keep BP stable.");
    }

    if (sugar && Number(sugar) > 140)
      advice.push("Limit sweets, prefer whole grains, and check sugar daily.");
    else if (sugar)
      advice.push("Good sugar levels — continue healthy diet and regular activity.");

    if (weight && Number(weight) > 80)
      advice.push("Consider light cardio, avoid fried foods, and increase fiber.");
    else if (weight)
      advice.push("Maintain current weight with a balanced diet.");

    res.status(200).json({ advice });
  } catch (error) {
    res.status(500).json({ message: "Error generating advice", error: error.message });
  }
};
