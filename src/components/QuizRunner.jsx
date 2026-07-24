/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react';
import { LinkedJapanese } from './LinkedJapanese';

const hash = (text) => [...text].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);

const seededShuffle = (items, seed) => {
  const output = [...items];
  let value = hash(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const swap = value % (index + 1);
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
};

const optionSet = (correct, pool, field, seed) => {
  const wrong = seededShuffle(pool.filter((item) => item.id !== correct.id), seed)
    .map((item) => item[field])
    .filter((value, index, all) => value && value !== correct[field] && all.indexOf(value) === index)
    .slice(0, 3);
  return seededShuffle([correct[field], ...wrong], `${seed}-options`);
};

export const buildQuestions = (area, items, fullPool, seed, limit = 10) => seededShuffle(items, seed).slice(0, limit).map((item, index) => {
  const mode = (hash(`${seed}-${index}`) + index) % 3;
  if (area === 'kanji') {
    if (mode === 0) return { id: `${item.id}-meaning`, prompt: `Which kanji means “${item.meaning}”?`, answer: item.character, options: optionSet(item, fullPool, 'character', `${seed}-${index}`), detail: `${item.character}: ${item.onyomi} / ${item.kunyomi}` };
    if (mode === 1) return { id: `${item.id}-reading`, prompt: `Choose an on-reading for ${item.character}.`, answer: item.onyomi, options: optionSet(item, fullPool, 'onyomi', `${seed}-${index}`), detail: `${item.word} (${item.wordReading}) means ${item.wordMeaning}.` };
    return { id: `${item.id}-recognize`, prompt: `What is the main meaning of ${item.character}?`, answer: item.meaning, options: optionSet(item, fullPool, 'meaning', `${seed}-${index}`), detail: `${item.character} appears in ${item.word}.` };
  }
  if (area === 'vocabulary') {
    if (mode === 0) return { id: `${item.id}-meaning`, prompt: `What does ${item.word} mean?`, answer: item.meaning, options: optionSet(item, fullPool, 'meaning', `${seed}-${index}`), detail: `${item.reading} · ${item.type}` };
    if (mode === 1) return { id: `${item.id}-reading`, prompt: `How do you read ${item.word}?`, answer: item.reading, options: optionSet(item, fullPool, 'reading', `${seed}-${index}`), detail: item.meaning };
    return { id: `${item.id}-reverse`, prompt: `Choose the Japanese for “${item.meaning}”.`, answer: item.word, options: optionSet(item, fullPool, 'word', `${seed}-${index}`), detail: `${item.word} (${item.reading})` };
  }
  if (mode === 0) return { id: `${item.id}-meaning`, prompt: `What does ${item.pattern} express?`, answer: item.meaning, options: optionSet(item, fullPool, 'meaning', `${seed}-${index}`), detail: item.structure };
  if (mode === 1) return { id: `${item.id}-pattern`, prompt: `Choose the pattern meaning “${item.meaning}”.`, answer: item.pattern, options: optionSet(item, fullPool, 'pattern', `${seed}-${index}`), detail: item.structure };
  return { id: `${item.id}-usage`, prompt: `Which structure matches ${item.pattern}?`, answer: item.structure, options: optionSet(item, fullPool, 'structure', `${seed}-${index}`), detail: item.explanation };
});

export function QuizRunner({ area, items, pool, seed, limit = 10, onFinish, onRestart }) {
  const questions = useMemo(() => buildQuestions(area, items, pool, seed, limit), [area, items, pool, seed, limit]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];

  if (!questions.length) return <div className="empty-state"><RotateCcw /><h3>No quiz material yet</h3><p>Study at least one item, then return for a mixed review.</p></div>;
  if (finished) return (
    <section className="result-panel">
      <span className="result-score">{score}/{questions.length}</span>
      <h2>{score === questions.length ? 'Perfect run' : score >= questions.length * 0.7 ? 'Solid review' : 'A useful first pass'}</h2>
      <p>{score >= questions.length * 0.7 ? 'Your recall is holding. The next test will rotate question styles.' : 'Missed items stay in the review pool, so this result is useful data.'}</p>
      <button className="button primary" type="button" onClick={() => { if (onRestart) onRestart(); else { setIndex(0); setSelected(''); setScore(0); setFinished(false); } }}>Try another format <RotateCcw /></button>
    </section>
  );

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === question.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      onFinish?.(score + (selected === question.answer ? 1 : 0), questions.length);
    } else {
      setIndex((value) => value + 1);
      setSelected('');
    }
  };

  return (
    <section className="quiz-panel">
      <div className="quiz-meta"><span>{area} test</span><strong>{index + 1}/{questions.length}</strong></div>
      <div className="quiz-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <h2><LinkedJapanese>{question.prompt}</LinkedJapanese></h2>
      <div className="quiz-options">
        {question.options.map((option) => {
          const state = selected ? option === question.answer ? 'correct' : option === selected ? 'wrong' : 'muted' : '';
          return <button type="button" className={state} key={option} onClick={() => choose(option)}><LinkedJapanese>{option}</LinkedJapanese>{state === 'correct' && <Check />}{state === 'wrong' && <X />}</button>;
        })}
      </div>
      {selected && <div className={`answer-note ${selected === question.answer ? 'good' : 'bad'}`}><strong>{selected === question.answer ? 'Correct' : 'Not this time'}</strong><p><LinkedJapanese>{question.detail}</LinkedJapanese></p><button className="button primary" type="button" onClick={next}>{index + 1 === questions.length ? 'See result' : 'Next question'} <ChevronRight /></button></div>}
    </section>
  );
}
