import cron from "node-cron";
import AIInsight from "../models/aiInsights.js";
// import { computeAIInsight } from "../controllers/aiInsightsController.js";
import User from "../models/User.js";

// Run every hour
cron.schedule("0 * * * *", async () => {
  const users = await User.find();
  for (let user of users) {
    const computed = await computeAIInsight(user._id);
    await AIInsight.findOneAndUpdate(
      { userId: user._id },
      {
        ...computed,
        lastUpdated: new Date()
      },
      { upsert: true }
    );
  }
  console.log("AI Insights updated for all users at", new Date());
});
