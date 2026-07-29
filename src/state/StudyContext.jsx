/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { kanji } from '../data/kanji';
import { vocabulary } from '../data/vocabulary';
import { grammar } from '../data/grammar';
import { readings } from '../data/readings';
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

const defaultProgress = {
  version: 2,
  profile: { startedAt: new Date().toISOString() },
  settings: {
    kanjiDaily: 5,
    vocabularyDaily: 20,
    grammarDaily: 5,
    gateQuiz: true,
    romaji: true,
  },
  kanji: { official: [], extra: [], srs: {} },
  vocabulary: { learned: [], srs: {} },
  grammar: { learned: [], srs: {} },
  reading: { completed: {} },
  sessions: {},
  stats: { correct: 0, answered: 0, studyMinutes: 0 },
  quizAttempts: {},
  lastGateSlot: '',
  overrides: { kanji: {}, vocabulary: {}, grammar: {}, reading: {} },
  custom: { kanji: [], vocabulary: [], grammar: [], reading: [] },
  archived: { kanji: [], vocabulary: [], grammar: [], reading: [] },
};

const mergeProgress = (saved = {}) => ({
  ...defaultProgress,
  ...saved,
  profile: { ...defaultProgress.profile, ...saved.profile },
  settings: { ...defaultProgress.settings, ...saved.settings },
  kanji: { ...defaultProgress.kanji, ...saved.kanji },
  vocabulary: { ...defaultProgress.vocabulary, ...saved.vocabulary },
  grammar: { ...defaultProgress.grammar, ...saved.grammar },
  reading: { ...defaultProgress.reading, ...saved.reading },
  stats: { ...defaultProgress.stats, ...saved.stats },
  overrides: { ...defaultProgress.overrides, ...saved.overrides },
  custom: { ...defaultProgress.custom, ...saved.custom },
  archived: { ...defaultProgress.archived, ...saved.archived },
});

const loadProgress = (userId) => {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId)) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const saved = JSON.parse(raw);
    return mergeProgress(saved);
  } catch {
    return defaultProgress;
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

const createSession = (progress, _date) => {
  const official = new Set(progress.kanji.official);
  const learnedVocabulary = new Set(progress.vocabulary.learned);
  const learnedGrammar = new Set(progress.grammar.learned);
  return {
    kanjiIds: kanji.filter((item) => !official.has(item.id)).slice(0, progress.settings.kanjiDaily).map((item) => item.id),
    vocabularyIds: vocabulary.filter((item) => !learnedVocabulary.has(item.id)).slice(0, progress.settings.vocabularyDaily).map((item) => item.id),
    grammarIds: grammar.filter((item) => !learnedGrammar.has(item.id)).slice(0, progress.settings.grammarDaily).map((item) => item.id),
    createdAt: new Date().toISOString(),
  };
};

const applyOverride = (items, overrides, custom, archived) => [
  ...items.map((item) => ({ ...item, ...(overrides[item.id] || {}) })),
  ...custom,
].filter((item) => !archived.includes(item.id));

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const { user } = useAuth();
  const today = todayKey();
  const [progress, setProgress] = useState(() => {
    const loaded = loadProgress(user.id);
    if (loaded.sessions[today]) return loaded;
    return { ...loaded, sessions: { ...loaded.sessions, [today]: createSession(loaded, today) } };
  });
  const [cloudReady, setCloudReady] = useState(!supabase || user.isLocal);

  useEffect(() => {
    if (!supabase || user.isLocal) return undefined;
    let active = true;
    supabase
      .from('user_progress')
      .select('progress')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.progress) {
          const remote = mergeProgress(data.progress);
          setProgress(remote.sessions[today]
            ? remote
            : { ...remote, sessions: { ...remote.sessions, [today]: createSession(remote, today) } });
        }
        setCloudReady(true);
      });
    return () => { active = false; };
  }, [today, user.id, user.isLocal]);

  useEffect(() => {
    if (!cloudReady) return undefined;
    localStorage.setItem(storageKeyFor(user.id), JSON.stringify(progress));
    if (!supabase || user.isLocal) return undefined;
    const timer = window.setTimeout(() => {
      supabase.from('user_progress').upsert({
        user_id: user.id,
        progress,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [cloudReady, progress, user.id, user.isLocal]);

  const content = useMemo(() => ({
    kanji: applyOverride(kanji, progress.overrides.kanji, progress.custom.kanji, progress.archived.kanji),
    vocabulary: applyOverride(vocabulary, progress.overrides.vocabulary, progress.custom.vocabulary, progress.archived.vocabulary),
    grammar: applyOverride(grammar, progress.overrides.grammar, progress.custom.grammar, progress.archived.grammar),
    reading: applyOverride(readings, progress.overrides.reading, progress.custom.reading, progress.archived.reading),
  }), [progress.archived, progress.custom, progress.overrides]);

  const session = progress.sessions[today] || createSession(progress, today);

  const markLearned = (area, id, mode = 'official') => {
    setProgress((current) => {
      if (area === 'kanji') {
        const key = mode === 'extra' ? 'extra' : 'official';
        const next = new Set(current.kanji[key]);
        next.add(id);
        return { ...current, kanji: { ...current.kanji, [key]: [...next] } };
      }
      const next = new Set(current[area].learned);
      next.add(id);
      return { ...current, [area]: { ...current[area], learned: [...next] } };
    });
  };

  const review = (area, id, known) => {
    setProgress((current) => ({
      ...current,
      [area]: {
        ...current[area],
        srs: { ...current[area].srs, [id]: updateSrsRecord(current[area].srs[id], known) },
      },
      stats: {
        ...current.stats,
        answered: current.stats.answered + 1,
        correct: current.stats.correct + (known ? 1 : 0),
      },
    }));
  };

  const recordQuiz = (correct, count = 1) => {
    setProgress((current) => ({
      ...current,
      stats: {
        ...current.stats,
        answered: current.stats.answered + count,
        correct: current.stats.correct + correct,
      },
    }));
  };

  const recordReading = (id, score, total) => {
    setProgress((current) => ({
      ...current,
      reading: {
        completed: {
          ...current.reading.completed,
          [id]: { score, total, completedAt: new Date().toISOString() },
        },
      },
      stats: {
        ...current.stats,
        answered: current.stats.answered + total,
        correct: current.stats.correct + score,
      },
    }));
  };

  const nextQuizAttempt = (area) => {
    const key = `${today}:${area}`;
    setProgress((current) => ({
      ...current,
      quizAttempts: { ...current.quizAttempts, [key]: (current.quizAttempts[key] || 0) + 1 },
    }));
  };

  const updateSettings = (patch) => setProgress((current) => ({
    ...current,
    settings: { ...current.settings, ...patch },
  }));

  const editContent = (area, id, patch) => setProgress((current) => ({
    ...current,
    overrides: {
      ...current.overrides,
      [area]: { ...current.overrides[area], [id]: { ...(current.overrides[area][id] || {}), ...patch } },
    },
  }));

  const addContent = (area, item) => setProgress((current) => ({
    ...current,
    custom: { ...current.custom, [area]: [...current.custom[area], item] },
  }));

  const archiveContent = (area, id) => setProgress((current) => ({
    ...current,
    archived: { ...current.archived, [area]: [...new Set([...current.archived[area], id])] },
  }));

  const replaceOfficialKanji = (ids) => setProgress((current) => {
    const valid = new Set(kanji.map((item) => item.id));
    const official = kanji.map((item) => item.id).filter((id) => valid.has(id) && ids.includes(id));
    const next = {
      ...current,
      kanji: {
        ...current.kanji,
        official,
        extra: current.kanji.extra.filter((id) => !official.includes(id)),
      },
    };
    return {
      ...next,
      sessions: { ...next.sessions, [today]: createSession(next, today) },
    };
  });

  const setCompletedKanjiDays = (days) => {
    const completed = Math.max(0, Math.min(Math.ceil(kanji.length / progress.settings.kanjiDaily), Number(days) || 0));
    replaceOfficialKanji(kanji.slice(0, completed * progress.settings.kanjiDaily).map((item) => item.id));
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
      return { ...next, sessions: { ...next.sessions, [today]: createSession(next, today) } };
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

  const resetAll = () => setProgress(() => {
    const clean = { ...defaultProgress, profile: { startedAt: new Date().toISOString() }, sessions: {} };
    return { ...clean, sessions: { [today]: createSession(clean, today) } };
  });
  const resetTestHistory = () => setProgress((current) => ({
    ...current,
    stats: { ...defaultProgress.stats },
    quizAttempts: {},
    kanji: { ...current.kanji, srs: {} },
    vocabulary: { ...current.vocabulary, srs: {} },
    grammar: { ...current.grammar, srs: {} },
    reading: { completed: {} },
  }));

  const importProgress = (payload) => {
    const imported = mergeProgress(payload);
    setProgress(imported.sessions[today]
      ? imported
      : { ...imported, sessions: { ...imported.sessions, [today]: createSession(imported, today) } });
  };
  const dismissGate = (slot) => setProgress((current) => ({ ...current, lastGateSlot: slot }));

  const value = {
    progress, content, session, today, markLearned, review, recordQuiz, recordReading,
    nextQuizAttempt, updateSettings, editContent, addContent, archiveContent, resetItems,
    resetAll, resetTestHistory, importProgress, dismissGate, replaceOfficialKanji,
    setCompletedKanjiDays, cloudReady,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export const useStudy = () => {
  const value = useContext(StudyContext);
  if (!value) throw new Error('useStudy must be used inside StudyProvider');
  return value;
};
