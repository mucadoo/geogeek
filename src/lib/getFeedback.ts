const getFeedback = (score: number, total: number): string => {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 1) return 'perfect';
  if (ratio >= 0.9) return 'amazing';
  if (ratio >= 0.75) return 'great';
  if (ratio >= 0.5) return 'good';
  return 'practice';
};

export default getFeedback;
