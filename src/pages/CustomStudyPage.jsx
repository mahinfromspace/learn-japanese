import { useMemo, useState } from 'react';
import { BookOpen, Brain, Check, ChevronLeft, Search, Sparkles } from 'lucide-react';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { LinkedJapanese } from '../components/LinkedJapanese';
import { QuizRunner } from '../components/QuizRunner';
import { StudyAidLines } from '../components/StudyReveal';
import { kanjiReadingSupport } from '../lib/studySupport';
import { useStudy } from '../state/StudyContext';

const areaLabels = { kanji: 'Kanji', vocabulary: 'Vocabulary', grammar: 'Grammar' };

const learnedIds = (progress, area) => new Set(area === 'kanji'
  ? [...progress.kanji.official, ...progress.kanji.extra]
  : progress[area].learned);

export function CustomStudyPage() {
  const { activeLevel } = useStudy();
  return <CustomStudyContent key={activeLevel} />;
}

function CustomStudyContent() {
  const { content, progress, activeLevel, markLearned, review, recordQuiz } = useStudy();
  const [area, setArea] = useState('kanji');
  const [level, setLevel] = useState(activeLevel);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState({ kanji: [], vocabulary: [], grammar: [] });
  const [mode, setMode] = useState('select');
  const [run, setRun] = useState(0);
  const learned = learnedIds(progress, area);

  const visible = useMemo(() => content[area].filter((item) => {
    const label = `${item.character || item.word || item.pattern} ${item.meaning} ${item.reading || ''} ${item.onyomi || ''} ${item.kunyomi || ''}`.toLowerCase();
    const levelMatch = level === 'all' || item.level === level;
    const statusMatch = status === 'all' || (status === 'learned' ? learned.has(item.id) : !learned.has(item.id));
    return levelMatch && statusMatch && label.includes(query.trim().toLowerCase());
  }), [area, content, learned, level, query, status]);

  const chosen = selected[area].map((id) => content[area].find((item) => item.id === id)).filter(Boolean);
  const toggle = (id) => setSelected((current) => ({
    ...current,
    [area]: current[area].includes(id) ? current[area].filter((value) => value !== id) : [...current[area], id],
  }));
  const rate = (item, known) => {
    review(area, item.id, known);
    if (known && !learned.has(item.id)) markLearned(area, item.id, area === 'kanji' ? 'official' : undefined);
  };

  if (mode === 'study') return (
    <div className="page custom-session-page">
      <button className="text-link session-back" type="button" onClick={() => setMode('select')}><ChevronLeft /> Change selection</button>
      <header className="page-heading compact"><p className="eyebrow">CUSTOM STUDY · {chosen.length} ITEMS</p><h1>Your hand-picked {areaLabels[area].toLowerCase()} session.</h1></header>
      <FlashcardDeck
        items={chosen}
        area={area}
        onRate={rate}
        onComplete={() => setMode('complete')}
        renderFront={(item) => <CustomFront area={area} item={item} />}
        renderBack={(item) => <CustomBack area={area} item={item} />}
      />
    </div>
  );

  if (mode === 'test') return (
    <div className="page custom-session-page">
      <button className="text-link session-back" type="button" onClick={() => setMode('select')}><ChevronLeft /> Change selection</button>
      <header className="page-heading compact"><p className="eyebrow">CUSTOM TEST · {chosen.length} ITEMS</p><h1>Test only what you chose.</h1></header>
      <QuizRunner key={`${area}-${run}`} area={area} items={chosen} pool={content[area]} seed={`custom-${area}-${run}-${chosen.map((item) => item.id).join('-')}`} limit={chosen.length} onFinish={recordQuiz} onRestart={() => setRun((value) => value + 1)} />
    </div>
  );

  if (mode === 'complete') return (
    <div className="page custom-session-page"><section className="result-panel"><Sparkles /><h1>Custom session complete.</h1><p>You can keep the same selection, edit it, or test it next.</p><div className="button-row"><button className="button primary" type="button" onClick={() => setMode('study')}>Study again</button><button className="button secondary" type="button" onClick={() => setMode('test')}>Test selection</button><button className="button secondary" type="button" onClick={() => setMode('select')}>Edit selection</button></div></section></div>
  );

  return (
    <div className="page custom-study-page">
      <header className="page-heading"><p className="eyebrow">CUSTOM STUDY</p><h1>Choose exactly what you want.</h1><p>Select any learned or unlearned item across N4 and N3, then study or test that set with no size cap.</p></header>
      <div className="segmented-tabs custom-area-tabs">
        {Object.entries(areaLabels).map(([value, label]) => <button className={area === value ? 'active' : ''} type="button" key={value} onClick={() => { setArea(value); setMode('select'); }}>{label}<span>{selected[value].length}</span></button>)}
      </div>
      <section className="custom-controls section-block">
        <label className="search-box"><Search /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${areaLabels[area].toLowerCase()}, reading, or meaning`} /></label>
        <label><span>Level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">All levels</option><option value="N4">N4</option><option value="N3">N3</option>{area === 'grammar' && <option value="N5">N5</option>}</select></label>
        <label><span>Progress</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Learned + unlearned</option><option value="learned">Learned only</option><option value="unlearned">Unlearned only</option></select></label>
      </section>
      <div className="custom-selection-head"><p><strong>{selected[area].length}</strong> selected · {visible.length} visible</p><div className="button-row"><button className="text-link" type="button" onClick={() => setSelected((current) => ({ ...current, [area]: [...new Set([...current[area], ...visible.map((item) => item.id)])] }))}>Select visible</button><button className="text-link" type="button" onClick={() => setSelected((current) => ({ ...current, [area]: [] }))}>Clear</button></div></div>
      <div className={`custom-picker ${area}`}>
        {visible.map((item) => {
          const isSelected = selected[area].includes(item.id);
          return <button className={isSelected ? 'selected' : ''} type="button" key={item.id} onClick={() => toggle(item.id)} aria-pressed={isSelected}><span className="custom-item-main"><LinkedJapanese>{item.character || item.word || item.pattern}</LinkedJapanese></span><small>{item.level} · {item.meaning}</small>{area === 'kanji' && <em>{item.onyomi} / {item.kunyomi}</em>}{area === 'vocabulary' && <em>{item.reading}</em>}{isSelected && <Check />}</button>;
        })}
      </div>
      {!visible.length && <div className="empty-inline">No items match these filters.</div>}
      <div className="custom-action-bar"><span><strong>{selected[area].length}</strong> {areaLabels[area].toLowerCase()} selected</span><div className="button-row"><button className="button primary" type="button" disabled={!chosen.length} onClick={() => setMode('study')}><BookOpen /> Study selected</button><button className="button secondary" type="button" disabled={!chosen.length} onClick={() => setMode('test')}><Brain /> Test selected</button></div></div>
    </div>
  );
}

function CustomFront({ area, item }) {
  if (area === 'kanji') {
    const support = kanjiReadingSupport(item);
    return <><span className="card-kanji"><LinkedJapanese>{item.character}</LinkedJapanese></span><StudyAidLines japanese={item.character} hiragana={support.hiragana} romaji={support.romaji} /></>;
  }
  if (area === 'vocabulary') return <><span className="card-word"><LinkedJapanese>{item.word}</LinkedJapanese></span><StudyAidLines japanese={item.word} hiragana={item.reading} romaji={item.romaji} /></>;
  return <><span className="card-pattern"><LinkedJapanese>{item.pattern}</LinkedJapanese></span>{item.romaji && <StudyAidLines japanese={item.pattern} romaji={item.romaji} />}</>;
}

function CustomBack({ area, item }) {
  return <><p className="eyebrow">{item.level} {areaLabels[area]}</p><h2>{item.meaning}</h2>{area === 'kanji' && <p className="example-line"><LinkedJapanese>{item.word}</LinkedJapanese> · {item.wordReading} · {item.wordMeaning}</p>}{area === 'vocabulary' && item.examples?.[0] && <p className="example-line"><LinkedJapanese>{item.examples[0].japanese}</LinkedJapanese><br />{item.examples[0].english}</p>}{area === 'grammar' && <div className="structure-box"><strong><LinkedJapanese>{item.structure}</LinkedJapanese></strong><span>{item.explanation}</span></div>}</>;
}
