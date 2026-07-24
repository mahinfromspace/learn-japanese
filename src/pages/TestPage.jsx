import { Brain, Languages, Shapes } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QuizRunner } from '../components/QuizRunner';
import { useStudy } from '../state/StudyContext';

const validAreas = ['kanji', 'vocabulary', 'grammar'];

export function TestPage() {
  const { content, progress, session, today, recordQuiz, nextQuizAttempt } = useStudy();
  const [params] = useSearchParams();
  const initial = validAreas.includes(params.get('area')) ? params.get('area') : 'kanji';
  const [area, setArea] = useState(initial);
  const [run, setRun] = useState(0);
  const attempt = progress.quizAttempts[`${today}:${area}`] || 0;
  const items = useMemo(() => {
    const ids = area === 'kanji'
      ? [...new Set([...progress.kanji.official, ...progress.kanji.extra, ...session.kanjiIds])]
      : [...new Set([...(progress[area].learned || []), ...(session[`${area}Ids`] || [])])];
    return ids.map((id) => content[area].find((item) => item.id === id)).filter(Boolean);
  }, [area, content, progress, session]);
  const tabs = [{ id: 'kanji', icon: Shapes, label: 'Kanji' }, { id: 'vocabulary', icon: Languages, label: 'Vocabulary' }, { id: 'grammar', icon: Brain, label: 'Grammar' }];
  return (
    <div className="page narrow-page test-page">
      <header className="page-heading"><p className="eyebrow">ADAPTIVE TEST</p><h1>A different angle each time.</h1><p>Today’s material mixes with previously learned and extra-studied items. Question formats rotate with every attempt.</p></header>
      <div className="segmented test-tabs">{tabs.map(({ id, icon: Icon, label }) => <button type="button" className={area === id ? 'active' : ''} key={id} onClick={() => { setArea(id); setRun(0); }}><Icon />{label}</button>)}</div>
      <QuizRunner key={`${area}-${run}`} area={area} items={items} pool={content[area]} seed={`${today}-${area}-${attempt}-${run}`} limit={Math.min(12, items.length)} onFinish={(score, total) => { recordQuiz(score, total); nextQuizAttempt(area); }} onRestart={() => setRun((value) => value + 1)} />
    </div>
  );
}
