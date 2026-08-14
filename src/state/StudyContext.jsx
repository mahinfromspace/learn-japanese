/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { kanji } from '../data/kanji';
import { vocabulary } from '../data/vocabulary';
import { grammar } from '../data/grammar';
import { readings } from '../data/readings';
import { calculateOverallScore } from '../lib/score';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const LEGACY_STORAGE_KEY = 'n4-daily-study-v2';
const storageKeyFor = (userId) => `n4-daily-study-v3:${userId}`;

const todayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const makeDefaultProgress = () => ({
  version: 3,
  profile: { startedAt: new Date().toISOString() },
  settings: { kanjiDaily: 5, vocabularyDaily: 20, grammarDaily: 5, romaji: true, activeLevel: 'N4' },
  kanji: { official: [], extra: [], srs: {} },
  vocabulary: { learned: [], srs: {} },
  grammar: { learned: [], srs: {} },
  reading: { completed: {} },
  sessions: {},
  stats: { correct: 0, answered: 0, studyMinutes: 0 },
  quizAttempts: {},
  overrides: { kanji: {}, vocabulary: {}, grammar: {}, reading: {} },
  custom: { kanji: [], vocabulary: [], grammar: [], reading: [] },
  archived: { kanji: [], vocabulary: [], grammar: [], reading: [] },
});

const mergeProgress = (saved = {}) => {
  const defaults = makeDefaultProgress();
  return {
    ...defaults,
    ...saved,
    version: 3,
    profile: { ...defaults.profile, ...saved.profile },
    settings: { ...defaults.settings, ...saved.settings, activeLevel: saved.settings?.activeLevel || 'N4' },
    kanji: { ...defaults.kanji, ...saved.kanji },
    vocabulary: { ...defaults.vocabulary, ...saved.vocabulary },
    grammar: { ...defaults.grammar, ...saved.grammar },
    reading: { ...defaults.reading, ...saved.reading },
    sessions: { ...defaults.sessions, ...saved.sessions },
    stats: { ...defaults.stats, ...saved.stats },
    overrides: { ...defaults.overrides, ...saved.overrides },
    custom: { ...defaults.custom, ...saved.custom },
    archived: { ...defaults.archived, ...saved.archived },
  };
};

const loadProgress = (userId) => {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId)) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return mergeProgress(raw ? JSON.parse(raw) : {});
  } catch {
    return makeDefaultProgress();
  }
};

const dueDate = (days) => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const updateSrsRecord = (previous = {}, known) => {
  const streak = known ? (previous.streak || 0) + 1 : 0;
  const interval = known ? [1, 3, 7, 14, 30, 60][Math.min(streak - 1, 5)] : 0;
  return {
    seen: (previous.seen || 0) + 1,
    correct: (previous.correct || 0) + (known ? 1 : 0),
    streak,
    interval,
    due: dueDate(interval),
    lastReviewed: new Date().toISOString(),
  };
};

const itemsForLevel = (catalog, area, level) => catalog.filter((item) => (
  area === 'grammar' && level === 'N4' ? item.level === 'N5' || item.level === 'N4' : item.level === level
));
const sessionKey = (date, level) => `${date}:${level}`;

const createSession = (progress, level) => {
  const learnedKanji = new Set([...(progress.kanji.official || []), ...(progress.kanji.extra || [])]);
  const learnedVocabulary = new Set(progress.vocabulary.learned || []);
  const learnedGrammar = new Set(progress.grammar.learned || []);
  return {
    level,
    kanjiIds: itemsForLevel(kanji, 'kanji', level).filter((item) => !learnedKanji.has(item.id)).slice(0, progress.settings.kanjiDaily).map((item) => item.id),
    vocabularyIds: itemsForLevel(vocabulary, 'vocabulary', level).filter((item) => !learnedVocabulary.has(item.id)).slice(0, progress.settings.vocabularyDaily).map((item) => item.id),
    grammarIds: itemsForLevel(grammar, 'grammar', level).filter((item) => !learnedGrammar.has(item.id)).slice(0, progress.settings.grammarDaily).map((item) => item.id),
    createdAt: new Date().toISOString(),
  };
};

const ensureTodaySession = (progress, date) => {
  const level = progress.settings.activeLevel || 'N4';
  const key = sessionKey(date, level);
  if (progress.sessions[key]) return progress;
  const legacy = level === 'N4' ? progress.sessions[date] : null;
  return { ...progress, sessions: { ...progress.sessions, [key]: legacy ? { ...legacy, level } : createSession(progress, level) } };
};

const applyOverride = (items, overrides, custom, archived) => [
  ...items.map((item) => ({ ...item, ...(overrides[item.id] || {}) })),
  ...custom,
].filter((item) => !archived.includes(item.id));

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const { user } = useAuth();
  const today = todayKey();
  const [progress, setProgress] = useState(() => ensureTodaySession(loadProgress(user.id), today));
  const [cloudReady, setCloudReady] = useState(!supabase || user.isLocal);

  useEffect(() => {
    if (!supabase || user.isLocal) return undefined;
    let active = true;
    supabase.from('user_progress').select('progress').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (!active) return;
      if (data?.progress) setProgress(ensureTodaySession(mergeProgress(data.progress), today));
      setCloudReady(true);
    }).catch(() => { if (active) setCloudReady(true); });
    return () => { active = false; };
  }, [today, user.id, user.isLocal]);

  useEffect(() => {
    if (!cloudReady) return undefined;
    localStorage.setItem(storageKeyFor(user.id), JSON.stringify(progress));
    if (!supabase || user.isLocal) return undefined;
    const timer = window.setTimeout(() => {
      supabase.from('user_progress').upsert({ user_id: user.id, progress, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [cloudReady, progress, user.id, user.isLocal]);

  const content = useMemo(() => ({
    kanji: applyOverride(kanji, progress.overrides.kanji, progress.custom.kanji, progress.archived.kanji),
    vocabulary: applyOverride(vocabulary, progress.overrides.vocabulary, progress.custom.vocabulary, progress.archived.vocabulary),
    grammar: applyOverride(grammar, progress.overrides.grammar, progress.custom.grammar, progress.archived.grammar),
    reading: applyOverride(readings, progress.overrides.reading, progress.custom.reading, progress.archived.reading),
  }), [progress.archived, progress.custom, progress.overrides]);

  const activeLevel = progress.settings.activeLevel || 'N4';
  const levelContent = useMemo(() => Object.fromEntries(
    Object.entries(content).map(([area, items]) => [area, itemsForLevel(items, area, activeLevel)]),
  ), [activeLevel, content]);
  const session = progress.sessions[sessionKey(today, activeLevel)] || createSession(progress, activeLevel);
  const score = useMemo(() => calculateOverallScore(progress, content), [content, progress]);

  useEffect(() => {
    if (!cloudReady || !supabase || user.isLocal) return undefined;
    const timer = window.setTimeout(() => {
      supabase.from('user_scores').upsert({
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Learner',
        overall_score: score.total,
        active_level: activeLevel,
        breakdown: Object.fromEntries(score.sections.map((section) => [section.key, section.points])),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeLevel, cloudReady, score, user.email, user.id, user.isLocal, user.user_metadata]);

  const markLearned = (area, id, mode = 'official') => setProgress((current) => {
    if (area === 'kanji') {
      const target = mode === 'extra' ? 'extra' : 'official';
      return { ...current, kanji: { ...current.kanji, [target]: [...new Set([...current.kanji[target], id])] } };
    }
    return { ...current, [area]: { ...current[area], learned: [...new Set([...current[area].learned, id])] } };
  });

  const review = (area, id, known) => setProgress((current) => ({
    ...current,
    [area]: { ...current[area], srs: { ...current[area].srs, [id]: updateSrsRecord(current[area].srs[id], known) } },
    stats: { ...current.stats, answered: current.stats.answered + 1, correct: current.stats.correct + (known ? 1 : 0) },
  }));

  const recordQuiz = (correct, count = 1) => setProgress((current) => ({
    ...current,
    stats: { ...current.stats, answered: current.stats.answered + count, correct: current.stats.correct + correct },
  }));

  const recordReading = (id, result, total) => setProgress((current) => ({
    ...current,
    reading: { ...current.reading, completed: { ...current.reading.completed, [id]: { score: result, total, completedAt: new Date().toISOString() } } },
    stats: { ...current.stats, answered: current.stats.answered + total, correct: current.stats.correct + result },
  }));

  const nextQuizAttempt = (area) => {
    const attemptKey = `${today}:${activeLevel}:${area}`;
    setProgress((current) => ({ ...current, quizAttempts: { ...current.quizAttempts, [attemptKey]: (current.quizAttempts[attemptKey] || 0) + 1 } }));
  };

  const updateSettings = (patch) => setProgress((current) => {
    const settings = { ...current.settings, ...patch };
    const next = { ...current, settings };
    const level = settings.activeLevel || 'N4';
    return { ...next, sessions: { ...next.sessions, [sessionKey(today, level)]: createSession(next, level) } };
  });
  const setActiveLevel = (level) => updateSettings({ activeLevel: level });

  const editContent = (area, id, patch) => setProgress((current) => ({
    ...current,
    overrides: { ...current.overrides, [area]: { ...current.overrides[area], [id]: { ...(current.overrides[area][id] || {}), ...patch } } },
  }));
  const addContent = (area, item) => setProgress((current) => ({ ...current, custom: { ...current.custom, [area]: [...current.custom[area], item] } }));
  const archiveContent = (area, id) => setProgress((current) => ({ ...current, archived: { ...current.archived, [area]: [...new Set([...current.archived[area], id])] } }));

  const replaceOfficialKanji = (ids) => setProgress((current) => {
    const level = current.settings.activeLevel || 'N4';
    const levelIds = new Set(itemsForLevel(kanji, 'kanji', level).map((item) => item.id));
    const preserved = current.kanji.official.filter((id) => !levelIds.has(id));
    const official = [...preserved, ...ids.filter((id) => levelIds.has(id))];
    const next = { ...current, kanji: { ...current.kanji, official, extra: current.kanji.extra.filter((id) => !official.includes(id)) } };
    return { ...next, sessions: { ...next.sessions, [sessionKey(today, level)]: createSession(next, level) } };
  });

  const setCompletedKanjiDays = (days) => {
    const completed = Math.max(0, Math.min(Math.ceil(levelContent.kanji.length / progress.settings.kanjiDaily), Number(days) || 0));
    replaceOfficialKanji(levelContent.kanji.slice(0, completed * progress.settings.kanjiDaily).map((item) => item.id));
  };

  const resetItems = (area, ids, mode = 'all') => setProgress((current) => {
    const idSet = new Set(ids);
    if (area === 'kanji') {
      const next = {
        ...current,
        kanji: {
          official: mode === 'extra' ? current.kanji.official : current.kanji.official.filter((id) => !idSet.has(id)),
          extra: mode === 'official' ? current.kanji.extra : current.kanji.extra.filter((id) => !idSet.has(id)),
          srs: Object.fromEntries(Object.entries(current.kanji.srs).filter(([id]) => !idSet.has(id))),
        },
      };
      const level = current.settings.activeLevel || 'N4';
      return { ...next, sessions: { ...next.sessions, [sessionKey(today, level)]: createSession(next, level) } };
    }
    if (area === 'reading') {
      return { ...current, reading: { ...current.reading, completed: Object.fromEntries(Object.entries(current.reading.completed).filter(([id]) => !idSet.has(id))) } };
    }
    return {
      ...current,
      [area]: {
        ...current[area],
        learned: current[area].learned.filter((id) => !idSet.has(id)),
        srs: Object.fromEntries(Object.entries(current[area].srs).filter(([id]) => !idSet.has(id))),
      },
    };
  });

  const resetAll = () => setProgress(ensureTodaySession(makeDefaultProgress(), today));
  const resetTestHistory = () => setProgress((current) => ({
    ...current,
    stats: makeDefaultProgress().stats,
    quizAttempts: {},
    kanji: { ...current.kanji, srs: {} },
    vocabulary: { ...current.vocabulary, srs: {} },
    grammar: { ...current.grammar, srs: {} },
    reading: { ...current.reading, completed: {} },
  }));
  const importProgress = (payload) => setProgress(ensureTodaySession(mergeProgress(payload), today));

  const value = {
    progress, content, levelContent, activeLevel, setActiveLevel, session, score, today,
    markLearned, review, recordQuiz, recordReading, nextQuizAttempt, updateSettings,
    editContent, addContent, archiveContent, resetItems, resetAll, resetTestHistory,
    importProgress, replaceOfficialKanji, setCompletedKanjiDays, cloudReady,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export const useStudy = () => {
  const value = useContext(StudyContext);
  if (!value) throw new Error('useStudy must be used inside StudyProvider');
  return value;
};
