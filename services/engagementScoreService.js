// backend/service/engagementScoreService.js
export const getEngagementScore = (messages, familyCount) => {
  const score = Math.min(
    100,
    Math.round((messages.length / (familyCount * 50)) * 100)
  );

  let status = "Healthy";
  if (score < 40) status = "Low";
  if (score < 20) status = "Very Low";

  const reasons = [];
  if (messages.length > 20) reasons.push("Regular conversations");
  if (familyCount > 1) reasons.push("Active across multiple families");
  reasons.push("Consistent participation");

  const suggestions = [];
  if (status !== "Healthy") {
    suggestions.push({
      text: "Plan a family call this week",
      action: "schedule_call",
    });
    suggestions.push({
      text: "Check in with inactive members",
      action: "check_in",
    });
  }

  return {
    score,
    status,
    reasons,
    suggestions,
  };
};
