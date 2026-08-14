/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react';
import { LinkedJapanese } from './LinkedJapanese';
import { StudyAidLines } from './StudyReveal';
import {
  kanjiReadingSupport,
  normalizeToHiragana,
} from '../lib/studySupport';

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

const optionSet = (correct, pool, field, seed, transform = (value) => value) => {
  const correctValue = transform(correct[field]);
  const used = new Set([correctValue]);
  const wrong = [];
  for (const item of seededShuffle(pool.filter((entry) => entry.id !== correct.id), seed)) {
    const value = transform(item[field]);
    if (!value || used.has(value)) continue;
    used.add(value);
    wrong.push({ value, item });
    if (wrong.length === 3) break;
  }
  return seededShuffle([{ value: correctValue, item: correct }, ...wrong], `${seed}-options`);
};

const wordAid = (item, readingField = 'reading', includeMeaning = false) => ({
  japanese: item.word,
  hiragana: normalizeToHiragana(item[readingField] || item.reading || item.wordReading),
  romaji: item.romaji,
  meaning: includeMeaning ? item.meaning || item.wordMeaning : '',
});

const grammarAid = (item, japanese) => ({
  japanese,
  meaning: item.meaning,
});

const optionAid = (area, field, entry) => {
  if (field === 'meaning') return null;
  if (area === 'kanji' && field === 'character') {
    return { japanese: entry.value, ...kanjiReadingSupport(entry.item) };
  }
  if (field === 'word') return wordAid(entry.item);
  if (field === 'wordReading') {
    return {
      japanese: entry.value,
      hiragana: entry.value,
      meaning: entry.item.wordMeaning,
    };
  }
  if (field === 'reading') {
    return {
      japanese: entry.value,
      hiragana: entry.value,
      romaji: entry.item.romaji,
      meaning: entry.item.meaning,
    };
  }
  if (area === 'grammar') return grammarAid(entry.item, entry.value);
  return null;
};

const withAids = (area, field, options) => options.map((entry) => ({
  ...entry,
  aid: optionAid(area, field, entry),
}));

export const buildQuestions = (area, items, fullPool, seed, limit = 10) => seededShuffle(items, seed).slice(0, limit).map((item, index) => {
  const initialMode = (hash(`${seed}-${index}`) + index) % 3;
  const mode = area === 'vocabulary' ? initialMode % 2 : initialMode;
  const questionSeed = `${seed}-${index}`;
  if (area === 'kanji') {
    if (mode === 0) {
      const options = withAids('kanji', 'character', optionSet(item, fullPool, 'character', questionSeed));
      return {
        id: `${item.id}-meaning`,
        prompt: `Which kanji means “${item.meaning}”?`,
        answer: item.character,
        options,
        detail: `${item.character} appears in ${item.word} (${normalizeToHiragana(item.wordReading)}).`,
      };
    }
    if (mode === 1) {
      const answer = normalizeToHiragana(item.wordReading);
      const options = withAids(
        'kanji',
        'wordReading',
        optionSet(item, fullPool, 'wordReading', questionSeed, normalizeToHiragana),
      );
      return {
        id: `${item.id}-reading`,
        prompt: 'What is the hiragana reading of this kanji word?',
        focus: item.word,
        focusAid: wordAid(item, 'wordReading'),
        answer,
        options,
        detail: `${item.word} (${answer}) means ${item.wordMeaning}.`,
      };
    }
    return {
      id: `${item.id}-recognize`,
      prompt: 'What is the main meaning of this kanji?',
      focus: item.character,
      focusAid: { japanese: item.character, ...kanjiReadingSupport(item) },
      answer: item.meaning,
      options: withAids('kanji', 'meaning', optionSet(item, fullPool, 'meaning', questionSeed)),
      detail: `${item.character} appears in ${item.word} (${normalizeToHiragana(item.wordReading)}).`,
    };
  }
  if (area === 'vocabulary') {
    if (mode === 0) {
      return {
        id: `${item.id}-meaning`,
        prompt: 'What does this word mean?',
        focus: item.word,
        focusAid: wordAid(item),
        alwaysAid: true,
        answer: item.meaning,
        options: withAids('vocabulary', 'meaning', optionSet(item, fullPool, 'meaning', questionSeed)),
        detail: `${normalizeToHiragana(item.reading)} · ${item.romaji} · ${item.type}`,
      };
    }
    return {
      id: `${item.id}-reverse`,
      prompt: `Choose the Japanese word meaning “${item.meaning}”.`,
      answer: item.word,
      options: withAids('vocabulary', 'word', optionSet(item, fullPool, 'word', questionSeed)),
      showOptionAids: true,
      detail: `${item.word} (${normalizeToHiragana(item.reading)}) · ${item.romaji}`,
    };
  }
  if (mode === 0) {
    return {
      id: `${item.id}-meaning`,
      prompt: 'What does this grammar pattern express?',
      focus: item.pattern,
      focusAid: grammarAid(item, item.pattern),
      answer: item.meaning,
      options: withAids('grammar', 'meaning', optionSet(item, fullPool, 'meaning', questionSeed)),
      detail: item.structure,
    };
  }
  if (mode === 1) {
    return {
      id: `${item.id}-pattern`,
      prompt: `Choose the pattern meaning “${item.meaning}”.`,
      answer: item.pattern,
      options: withAids('grammar', 'pattern', optionSet(item, fullPool, 'pattern', questionSeed)),
      detail: item.structure,
    };
  }
  return {
    id: `${item.id}-usage`,
    prompt: 'Which structure matches this pattern?',
    focus: item.pattern,
    focusAid: grammarAid(item, item.pattern),
    answer: item.structure,
    options: withAids('grammar', 'structure', optionSet(item, fullPool, 'structure', questionSeed)),
    detail: item.explanation,
  };
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
      {question.focus && <div className="quiz-focus"><LinkedJapanese>{question.focus}</LinkedJapanese></div>}
      {question.alwaysAid && question.focusAid && <StudyAidLines className="quiz-focus-aids always-visible" {...question.focusAid} />}
      <div className="quiz-options">
        {question.options.map((option) => {
          const state = selected ? option.value === question.answer ? 'correct' : option.value === selected ? 'wrong' : 'muted' : '';
          return (
            <button type="button" className={state} key={option.value} onClick={() => choose(option.value)}>
              <span className="quiz-option-copy">
                <LinkedJapanese>{option.value}</LinkedJapanese>
                {question.showOptionAids && option.aid && <StudyAidLines compact {...option.aid} />}
              </span>
              {state === 'correct' && <Check />}
              {state === 'wrong' && <X />}
            </button>
          );
        })}
      </div>
      {selected && <div className={`answer-note ${selected === question.answer ? 'good' : 'bad'}`}><strong>{selected === question.answer ? 'Correct' : 'Not this time'}</strong><p><LinkedJapanese>{question.detail}</LinkedJapanese></p><button className="button primary" type="button" onClick={next}>{index + 1 === questions.length ? 'See result' : 'Next question'} <ChevronRight /></button></div>}
    </section>
  );
}
