
    
  
  ), [activeLevel, content]);
  const session = progress.sessions[sessionKey(today, activeLevel)] || createSession(progress, activeLevel);
  const score = useMemo(() => calculateOverallScore(progress, content), [content, progress]);

  useEffect(() => {
    if (!cloudReady || !supabase || user.isLocal) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const { error } = await supabase.from('user_scores').upsert({
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Learner',
        overall_score: score.total,
        active_level: activeLevel,
        breakdown: Object.fromEntries(score.sections.map((section) => [section.key, section.points])),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
        if (error) throw error;
      } catch (error) {
        console.error('Score save failed:', error);
      }
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

