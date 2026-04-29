import HealthLog from "../models/HealthLog.js";
import User from "../models/User.js";
import sendEmail from "./sendEmail.js";

export const generateWeeklyReports = async () => {
  const users = await User.find();

  for (const user of users) {
    const logs = await HealthLog.find({
      recordedBy: user._id,
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (logs.length === 0) continue;

    const avg = (key) =>
      logs.reduce((sum, l) => sum + (l.vitals[key] || 0), 0) / logs.length;

    const avgHR = avg("heartRate").toFixed(1);
    const avgSugar = avg("sugar").toFixed(1);

    const html = `
      <h2>📊 Weekly Health Report</h2>
      <p><b>User:</b> ${user.name}</p>
      <ul>
        <li>Avg Heart Rate: ${avgHR}</li>
        <li>Avg Sugar: ${avgSugar}</li>
      </ul>
      <p>Stay healthy ❤️</p>
    `;

    await sendEmail(user.email, "📊 Weekly Health Report", html);
  }
};