import { BookOpenText, Brain, Languages, Search, Shapes } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LinkedJapanese } from '../components/LinkedJapanese';
import { RevealStudyAids, StudyAidLines } from '../components/StudyReveal';
import { kanjiReadingSupport } from '../lib/studySupport';
import { useStudy } from '../state/StudyContext';

const tabs = [
  { id: 'kanji', label: 'All kanji', icon: Shapes },
  { id: 'vocabulary', label: 'All vocabulary', icon: Languages },
  { id: 'grammar', label: 'All grammar', icon: Brain },
  { id: 'reading', label: 'All readings', icon: BookOpenText },
  { id: 'sentences', label: 'Sentences', icon: BookOpenText },
];

export function LibraryPage() {
  const { content, progress, activeLevel } = useStudy();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'kanji';
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState(activeLevel);
  const normalized = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (tab === 'sentences') return content.vocabulary.flatMap((word) => word.examples.map((example, index) => ({ ...example, word, id: `${word.id}-${index}` }))).filter((item) => `${item.japanese} ${item.english} ${item.word.word}`.toLowerCase().includes(normalized));
    return content[tab].filter((item) => {
      const matchesLevel = level === 'All' || item.level === level;
      return matchesLevel && JSON.stringify(item).toLowerCase().includes(normalized);
    });
  }, [content, level, normalized, tab]);

  return (
    <div className="page library-page">
      <header className="page-heading"><p className="eyebrow">COMPLETE N4 + N3 LIBRARY</p><h1>Everything, in one place.</h1><p>Search both levels and open the same canonical detail pages used throughout the app.</p></header>
      <div className="library-tabs">{tabs.map(({ id, label, icon: Icon }) => <button className={tab === id ? 'active' : ''} type="button" key={id} onClick={() => { setParams({ tab: id }); setQuery(''); setLevel(activeLevel); }}><Icon />{label}</button>)}</div>
      <div className="library-tools"><label className="search-box"><Search /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tab}`} /></label>{tab !== 'sentences' && <select aria-label="Library level" value={level} onChange={(event) => setLevel(event.target.value)}><option>All</option>{tab === 'grammar' && <option>N5</option>}<option>N4</option><option>N3</option></select>}<span>{results.length} results</span></div>

      {tab === 'kanji' && <div className="library-kanji-grid">{results.map((item) => { const status = progress.kanji.official.includes(item.id) ? 'Official' : progress.kanji.extra.includes(item.id) ? 'Extra' : ''; return <article key={item.id}><div className="library-card-top"><span className="big-character"><LinkedJapanese>{item.character}</LinkedJapanese></span><small>{status || item.level}</small></div><StudyAidLines compact japanese={item.character} {...kanjiReadingSupport(item)} /><Link className="card-detail-link" to={`/kanji/${item.id}`}>Open detail →</Link></article>; })}</div>}
      {tab === 'vocabulary' && <div className="library-grid">{results.map((item) => <article key={item.id}><p className="eyebrow">{item.level} · {item.type}</p><h2><LinkedJapanese>{item.word}</LinkedJapanese></h2><StudyAidLines compact japanese={item.word} hiragana={item.reading} romaji={item.romaji} meaning={item.meaning} /><Link className="card-detail-link" to={`/vocabulary/${item.id}`}>Open detail →</Link></article>)}</div>}
      {tab === 'grammar' && <div className="library-grid">{results.map((item) => <article key={item.id}><span className={`level-badge ${item.level.toLowerCase()}`}>{item.level}</span><h2><LinkedJapanese>{item.pattern}</LinkedJapanese></h2><StudyAidLines compact japanese={item.pattern} romaji={item.romaji} meaning={item.meaning} /><Link className="card-detail-link" to={`/grammar/${item.id}`}>Open lesson →</Link></article>)}</div>}
      {tab === 'reading' && <div className="library-grid">{results.map((item) => <article key={item.id}><p className="eyebrow">{item.type} · {item.difficulty}</p><h2><LinkedJapanese>{item.title}</LinkedJapanese></h2><RevealStudyAids compact showJapanese={false} japanese={item.title} label="Reveal title reading" /><p>{item.minutes} min · {item.questions.length} questions</p><Link className="card-detail-link" to={`/reading/${item.id}`}>Open passage →</Link></article>)}</div>}
      {tab === 'sentences' && <div className="sentence-library">{results.slice(0, 200).map((item) => <article key={item.id}><RevealStudyAids japanese={item.japanese} meaning={item.english}><p className="japanese-sentence"><LinkedJapanese>{item.japanese}</LinkedJapanese></p></RevealStudyAids><Link to={`/vocabulary/${item.word.id}`}>Open {item.word.word}</Link></article>)}</div>}
      {!results.length && <div className="empty-state"><Search /><h3>No matches</h3><p>Try a Japanese character, reading, English meaning, or broader level filter.</p></div>}
    </div>
  );
}
