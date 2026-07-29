import { useMemo, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Sparkles, X } from 'lucide-react';
import { buildQuestions } from './QuizRunner';
import { LinkedJapanese } from './LinkedJapanese';
import { StudyAidLines } from './StudyReveal';
import { useStudy } from '../state/StudyContext';

export function GateQuiz() {
  const { progress, content, dismissGate, recordQuiz } = useStudy();
  const hourBlock = Math.floor(new Date().getHours() / 4);
  const slot = `${new Date().toDateString()}-${hourBlock}`;
  const pool = useMemo(() => {
    const knownKanji = [...new Set([...progress.kanji.official, ...progress.kanji.extra])].map((id) => content.kanji.find((item) => item.id === id)).filter(Boolean);
    const knownVocabulary = progress.vocabulary.learned.map((id) => content.vocabulary.find((item) => item.id === id)).filter(Boolean);
    if (knownVocabulary.length >= 4) return { area: 'vocabulary', items: knownVocabulary, all: content.vocabulary };
    if (knownKanji.length >= 4) return { area: 'kanji', items: knownKanji, all: content.kanji };
    return null;
  }, [content, progress.kanji.extra, progress.kanji.official, progress.vocabulary.learned]);
  const question = useMemo(() => pool ? buildQuestions(pool.area, pool.items, pool.all, slot, 1)[0] : null, [pool, slot]);
  const [selected, setSelected] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  if (!progress.settings.gateQuiz || progress.lastGateSlot === slot || !question) return null;
  const correct = selected === question.answer;
  const helpAvailable = Boolean(question.focusAid || question.options.some((option) => option.aid));
  return (
    <div className="gate-backdrop">
      <section className="gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <span className="feature-icon"><Sparkles /></span><p className="eyebrow">QUICK RECALL</p><h2 id="gate-title"><LinkedJapanese>{question.prompt}</LinkedJapanese></h2>
        {question.focus && <div className="quiz-focus"><LinkedJapanese>{question.focus}</LinkedJapanese></div>}
        {helpAvailable && <button className="quiz-study-toggle" type="button" aria-expanded={helpOpen} onClick={() => setHelpOpen((value) => !value)}>{helpOpen ? <EyeOff /> : <Eye />}{helpOpen ? 'Hide reading help' : 'Reveal hiragana, romaji & meaning'}</button>}
        {helpOpen && question.focusAid && <StudyAidLines className="quiz-focus-aids" {...question.focusAid} />}
        <div className="quiz-options">{question.options.map((option) => {
          const state = selected ? option.value === question.answer ? 'correct' : option.value === selected ? 'wrong' : 'muted' : '';
          return <button type="button" className={state} key={option.value} onClick={() => { if (!selected) { setSelected(option.value); recordQuiz(option.value === question.answer ? 1 : 0, 1); } }}><span className="quiz-option-copy"><LinkedJapanese>{option.value}</LinkedJapanese>{helpOpen && option.aid && <StudyAidLines compact {...option.aid} />}</span>{state === 'correct' && <Check />}{state === 'wrong' && <X />}</button>;
        })}</div>
        {selected && <div className={`answer-note ${correct ? 'good' : 'bad'}`}><strong>{correct ? 'Nice recall.' : `Answer: ${question.answer}`}</strong><p><LinkedJapanese>{question.detail}</LinkedJapanese></p><button className="button primary" type="button" onClick={() => dismissGate(slot)}>Continue to the app <ArrowRight /></button></div>}
      </section>
    </div>
  );
}
