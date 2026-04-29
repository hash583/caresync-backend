// backend/service/behaviorInsightsService.js
export const getBehaviorInsights = (messages) => {
  const sentiment = { positive: 0, neutral: 0, negative: 0 };

  messages.forEach(m => {
    if (/happy|good|great|love/i.test(m.text)) sentiment.positive++;
    else if (/angry|sad|stress|upset/i.test(m.text)) sentiment.negative++;
    else sentiment.neutral++;
  });

  return {
    sentiment,
    alert:
      sentiment.negative > 10
        ? "Some conversations show stress. Consider checking in."
        : null,
  };
};
