const ratio = (count, total) => (total ? Math.min(1, count / total) : 0);

const activityDays = (progress) => {
  const days = new Set();
  const add = (value) => { if (value) days.add(String(value).slice(0, 10)); };
  ['kanji', 'vocabulary', 'grammar'].forEach((area) => {
    Object.values(progress[area]?.srs || {}).forEach((record) => add(record.lastReviewed));
  });
  Object.values(progress.reading?.completed || {}).forEach((record) => add(record.completedAt));
  return days.size;
};

export function calculateOverallScore(progress, content) {
  const learnedKanji = new Set([...(progress.kanji?.official || []), ...(progress.kanji?.extra || [])]);
  const sections = [
    { key: 'kanji', label: 'Kanji', max: 220, value: ratio(learnedKanji.size, content.kanji.length) },
    { key: 'vocabulary', label: 'Vocabulary', max: 220, value: ratio(progress.vocabulary?.learned?.length || 0, content.vocabulary.length) },
    { key: 'grammar', label: 'Grammar', max: 180, value: ratio(progress.grammar?.learned?.length || 0, content.grammar.length) },
    { key: 'reading', label: 'Reading', max: 160, value: ratio(Object.keys(progress.reading?.completed || {}).length, content.reading.length) },
    { key: 'accuracy', label: 'Accuracy', max: 140, value: progress.stats?.answered ? ratio(progress.stats.correct, progress.stats.answered) : 0 },
    { key: 'consistency', label: 'Consistency', max: 80, value: ratio(activityDays(progress), 30) },
  ].map((section) => ({ ...section, points: Math.round(section.max * section.value), percent: Math.round(section.value * 100) }));

  return {
    total: sections.reduce((sum, section) => sum + section.points, 0),
    max: 1000,
    sections,
    activityDays: activityDays(progress),
  };
}
