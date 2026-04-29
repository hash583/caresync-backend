// backend/service/chatInsightsService.js
export const getChatInsights = (messages) => {
  const last7Days = messages.filter(
    m => Date.now() - new Date(m.createdAt).getTime() < 7 * 86400000
  );

  const topics = {
    health: 0,
    events: 0,
    finance: 0,
  };

  messages.forEach(m => {
    if (/doctor|medicine|health/i.test(m.text)) topics.health++;
    if (/party|event|birthday/i.test(m.text)) topics.events++;
    if (/money|expense|bill/i.test(m.text)) topics.finance++;
  });

  return {
    weeklySummary: `You exchanged ${last7Days.length} messages in the last 7 days.`,
    topics,
  };
};
