import { Brain, Languages, Shapes, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QuizRunner } from '../components/QuizRunner';
import { useStudy } from '../state/StudyContext';

const validAreas = ['kanji', 'vocabulary', 'grammar'];

export function TestPage() {
  const { levelContent, activeLevel, progress, session, today, recordQuiz, nextQuizAttempt } = useStudy();
  const [params] = useSearchParams();
  const initial = validAreas.includes(params.get('area')) ? params.get('area') : 'kanji';
  const [area, setArea] = useState(initial);
  const [run, setRun] = useState(0);
  const [limitMode, setLimitMode] = useState('daily');
  const attempt = progress.quizAttempts[`${today}:${activeLevel}:${area}`] || 0;
  const items = useMemo(() => {
    const ids = area === 'kanji'
      ? [...new Set([...progress.kanji.official, ...progress.kanji.extra, ...session.kanjiIds])]
      : [...new Set([...(progress[area].learned || []), ...(session[`${area}Ids`] || [])])];
    return ids.map((id) => levelContent[area].find((item) => item.id === id)).filter(Boolean);
  }, [area, levelContent, progress, session]);
  const dailyCount = session[`${area}Ids`]?.length || 10;
  const limit = limitMode === 'all' ? items.length : limitMode === 'daily' ? Math.min(items.length, dailyCount) : Math.min(items.length, Number(limitMode));
  const tabs = [{ id: 'kanji', icon: Shapes, label: 'Kanji' }, { id: 'vocabulary', icon: Languages, label: 'Vocabulary' }, { id: 'grammar', icon: Brain, label: 'Grammar' }];
  return (
    <div className="page narrow-page test-page">
      <header className="page-heading"><p className="eyebrow">{activeLevel} ADAPTIVE TEST</p><h1>A different angle each time.</h1><p>Vocabulary always shows its hiragana and tests meaning or recognition—not kanji reading recall.</p></header>
      <div className="segmented test-tabs">{tabs.map(({ id, icon: Icon, label }) => <button type="button" className={area === id ? 'active' : ''} key={id} onClick={() => { setArea(id); setRun(0); }}><Icon />{label}</button>)}</div>
      <div className="test-controls"><label>Questions<select value={limitMode} onChange={(event) => { setLimitMode(event.target.value); setRun((value) => value + 1); }}><option value="daily">Daily set ({dailyCount})</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="all">All available ({items.length})</option></select></label><Link className="button secondary" to="/custom-study"><SlidersHorizontal /> Choose exact items</Link></div>
      <QuizRunner key={`${area}-${run}-${limit}`} area={area} items={items} pool={levelContent[area]} seed={`${today}-${activeLevel}-${area}-${attempt}-${run}`} limit={limit} onFinish={(score, total) => { recordQuiz(score, total); nextQuizAttempt(area); }} onRestart={() => setRun((value) => value + 1)} />
    </div>
  );
}
