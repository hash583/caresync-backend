// backend/controllers/healthLogController.js

import HealthLog from "../models/HealthLog.js";
import FamilyGroup from "../models/FamilyGroup.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";


/**
 * buildSuggestionObject(vitals, notes)
 */
const buildSuggestionObject = (vitals = {}, notes = "") => {
  const msgs = [];
  const meals = {
    breakfast: "Oatmeal with fruits and nuts.",
    lunch: "Grilled protein + salad (lots of veggies).",
    dinner: "Light soup or steamed vegetables with lean protein.",
  };
  const lifestyle = [
    "Drink a glass of water",
    "5 minutes deep breathing",
    "Avoid heavy caffeine right now",
  ];

  const s = Number(vitals?.bloodPressure?.systolic || 0);
  const d = Number(vitals?.bloodPressure?.diastolic || 0);

  if (s || d) {
    if (s >= 180 || d >= 120)
      msgs.push("Possible hypertensive crisis — seek urgent care if symptomatic.");
    else if (s >= 140 || d >= 90)
      msgs.push("High blood pressure — reduce salt, rest and consult doctor if persistent.");
    else if (s >= 120 || d >= 80)
      msgs.push("Elevated blood pressure — monitor and reduce stress.");
    else msgs.push("Blood pressure within normal range.");
  }

  const sugar = Number(vitals?.sugar || 0);
  if (sugar) {
    if (sugar >= 300) msgs.push("Very high blood sugar — seek medical advice urgently.");
    else if (sugar >= 200) msgs.push("High blood sugar — avoid sugary foods and hydrate.");
    else if (sugar >= 140) msgs.push("Slightly high sugar — consider light exercise.");
    else msgs.push("Sugar within expected range.");
  }

  const hr = Number(vitals?.heartRate || 0);
  if (hr) {
    if (hr >= 120) msgs.push("High heart rate — rest and deep breathing.");
    else if (hr <= 50) msgs.push("Low heart rate — consult clinician if symptomatic.");
    else msgs.push("Heart rate looks okay.");
  }

  const weight = Number(vitals?.weight || 0);
  if (weight) {
    if (weight >= 100) msgs.push("Weight high — consider balanced diet.");
    else msgs.push("Weight recorded — maintain balanced diet.");
  }

  const noteLower = (notes || "").toLowerCase();
  if (noteLower.includes("fever"))
    msgs.push("Fever noted — monitor temperature (>38°C consult doctor).");

  const headlineParts = [];
  if (s || d) headlineParts.push(`BP ${s}/${d}`);
  if (sugar) headlineParts.push(`Sugar ${sugar}`);
  if (hr) headlineParts.push(`HR ${hr}`);

  return {
    headline: headlineParts.join(" • ") || "Health log recorded",
    messages: msgs,
    meals,
    lifestyle,
  };
};



// ======================= 🚨 ALERT FUNCTION =======================
// backend/controllers/healthLogController.js

export const checkVitalsAndSendAlert = async (healthLog) => {
  try {
    console.log("🟢 checkVitalsAndSendAlert triggered for HealthLog ID:", healthLog._id);

    // Populate related fields
    await healthLog.populate([
      { path: "recordedBy", select: "name email" },
      { path: "familyId", select: "name" },
    ]);

    const { vitals, recordedBy, familyId } = healthLog;

    if (!vitals || Object.keys(vitals).length === 0) {
      console.log("⚠️ No vitals found, skipping alert.");
      return;
    }

    // Critical thresholds
    const criticalThresholds = {
      heartRate: { min: 50, max: 100 },
      bloodPressure: { systolic: { min: 80, max: 140 }, diastolic: { min: 60, max: 90 } },
      sugar: { min: 70, max: 140 },
      weight: { min: 40, max: 100 },
      temperature: { min: 36, max: 38 },
      oxygenSaturation: { min: 90, max: 100 },
    };

    const alerts = [];

    // Heart Rate
    if (vitals.heartRate !== undefined) {
      const { min, max } = criticalThresholds.heartRate;
      if (vitals.heartRate < min || vitals.heartRate > max)
        alerts.push(`Heart Rate is critical: ${vitals.heartRate} — check immediately or visit a doctor.`);
    }

    // Blood Pressure
    if (vitals.bloodPressure) {
      const { systolic, diastolic } = vitals.bloodPressure;
      const sysThreshold = criticalThresholds.bloodPressure.systolic;
      const diaThreshold = criticalThresholds.bloodPressure.diastolic;
      if (systolic < sysThreshold.min || systolic > sysThreshold.max)
        alerts.push(`Systolic BP is critical: ${systolic} — check immediately or visit a doctor.`);
      if (diastolic < diaThreshold.min || diastolic > diaThreshold.max)
        alerts.push(`Diastolic BP is critical: ${diastolic} — check immediately or visit a doctor.`);
    }

    // Sugar
    if (vitals.sugar !== undefined) {
      const { min, max } = criticalThresholds.sugar;
      if (vitals.sugar < min || vitals.sugar > max)
        alerts.push(`Sugar is critical: ${vitals.sugar} — check immediately or visit a doctor.`);
    }

    // Weight
    if (vitals.weight !== undefined) {
      const { min, max } = criticalThresholds.weight;
      if (vitals.weight < min || vitals.weight > max)
        alerts.push(`Weight is critical: ${vitals.weight} — check immediately or consult a dietician.`);
    }

    // Temperature
    if (vitals.temperature !== undefined) {
      const { min, max } = criticalThresholds.temperature;
      if (vitals.temperature < min || vitals.temperature > max)
        alerts.push(`Temperature is critical: ${vitals.temperature}°C — check immediately or visit a doctor.`);
    }

    // Oxygen Saturation
    if (vitals.oxygenSaturation !== undefined) {
      const { min, max } = criticalThresholds.oxygenSaturation;
      if (vitals.oxygenSaturation < min || vitals.oxygenSaturation > max)
        alerts.push(`Oxygen Saturation is critical: ${vitals.oxygenSaturation}% — check immediately.`);
    }

    // Force test alert if none
    if (alerts.length === 0) alerts.push("Test alert: vitals monitoring check.");

    // Fetch all family members including the recorder
   let users = [];

if (familyId?._id) {
  const family = await FamilyGroup.findById(familyId._id)
    .populate("members", "name email _id");

  if (family && family.members) {
    users = family.members;
  }
}

    // Ensure recording user is included
    if (!users.some(u => u._id.equals(recordedBy._id))) {
      users.push({ _id: recordedBy._id, name: recordedBy.name, email: recordedBy.email });
    }

    // Filter valid emails
    const emailList = users.map(u => u.email).filter(Boolean);

    console.log("📧 Users found for alert:", users);
    console.log("📧 Email list:", emailList);

    if (!emailList.length) {
      console.log("⚠️ No recipients found, email not sent.");
      return;
    }

    // Compose email
    const html = `
      <h2>🚨 Critical Health Alert</h2>
      <p>Recorded By: ${recordedBy?.name || "Unknown"}</p>
      <p>Family: ${familyId?.name || "Unknown"}</p>
      <ul>
        ${alerts.map(a => `<li>${a}</li>`).join("")}
      </ul>
    `;

    await sendEmail({
      email: emailList,
      subject: "🚨 Critical Health Alert",
      html,
      message: alerts.join("\n"),
    });

    console.log("✅ Alert email sent successfully.");

  } catch (error) {
    console.error("❌ Error in checkVitalsAndSendAlert:", error);
  }
};



// ======================= CREATE HEALTH LOG =======================
export const createHealthLog = async (req, res) => {
  try {
    const { familyId, vitals = {}, notes = "", date } = req.body;

    if ((!vitals || Object.keys(vitals).length === 0) && !notes) {
      return res.status(400).json({
        success: false,
        message: "Provide vitals or notes",
      });
    }

    const suggestionObj = buildSuggestionObject(vitals, notes);

    const newLog = await HealthLog.create({
      recordedBy: req.user._id,
      familyId,
      vitals,
      notes,
      date: date || new Date(),
      suggestions: suggestionObj,
    });

    // ✅ Populate BEFORE alert
    await newLog.populate([
      { path: "recordedBy", select: "name email" },
      { path: "familyId", select: "name" },
    ]);

    // 🚨 SEND ALERT IF NEEDED
    await checkVitalsAndSendAlert(newLog);

    return res.status(201).json({
      success: true,
      log: newLog,
    });
  } catch (error) {
    console.error("createHealthLog error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating health log",
      error: error.message,
    });
  }
};



// ======================= OTHER FUNCTIONS (UNCHANGED) =======================
export const getFamilyHealthLogs = async (req, res) => {
  try {
    const { familyId } = req.params;
    const onlyMine = req.query.onlyMine === "true";

    if (!familyId) {
      return res.status(400).json({ success: false, message: "Family ID is required" });
    }

    const query = { familyId };
    if (onlyMine) query.recordedBy = req.user._id;

    const logs = await HealthLog.find(query)
      .populate("recordedBy", "name email")
      .populate("familyId", "name")
      .sort({ date: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching logs" });
  }
};

export const getUserHealthLogs = async (req, res) => {
  try {
    const logs = await HealthLog.find({ recordedBy: req.user._id })
      .populate("familyId", "name")
      .populate("recordedBy", "name email")
      .sort({ date: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching logs" });
  }
};

export const getHealthLogById = async (req, res) => {
  try {
    const log = await HealthLog.findById(req.params.id)
      .populate("recordedBy", "name email")
      .populate("familyId", "name");

    if (!log) return res.status(404).json({ success: false, message: "Log not found" });

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateHealthLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { vitals, notes, date } = req.body;

    const log = await HealthLog.findById(logId);
    if (!log) return res.status(404).json({ success: false, message: "Log not found" });

    if (vitals) {
      log.vitals = vitals;
      log.suggestions = buildSuggestionObject(vitals, notes || log.notes);
    }

    if (notes) log.notes = notes;
    if (date) log.date = date;

    await log.save();
    await log.populate("recordedBy", "name email");

    res.status(200).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating log" });
  }
};

export const deleteHealthLog = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await HealthLog.findById(logId);
    if (!log) return res.status(404).json({ success: false, message: "Log not found" });

    await log.deleteOne();

    res.status(200).json({ success: true, message: "Log deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting log" });
  }
};

export const getMyHealthLogs = getUserHealthLogs;




// amannadeemcentral766@gmail.com
// rabiaabdulsattar99@gmail.com
