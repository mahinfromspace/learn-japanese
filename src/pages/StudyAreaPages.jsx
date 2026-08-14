import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Dice5, Layers3, List, Play, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { LinkedJapanese } from '../components/LinkedJapanese';
import { ProgressBar } from '../components/ProgressBar';
import { StudyAidLines } from '../components/StudyReveal';
import { kanjiReadingSupport } from '../lib/studySupport';
import { useStudy } from '../state/StudyContext';

const rotateRandom = (items) => [...items].sort(() => Math.random() - 0.5);

export function KanjiPage() {
  const navigate = useNavigate();
  const { content, levelContent, activeLevel, progress, session, markLearned, review } = useStudy();
  const [mode, setMode] = useState('overview');
  const daily = session.kanjiIds.map((id) => content.kanji.find((item) => item.id === id)).filter(Boolean);
  const dailyDone = daily.filter((item) => progress.kanji.official.includes(item.id)).length;
  const extra = useMemo(() => rotateRandom(levelContent.kanji.filter((item) => !progress.kanji.official.includes(item.id) && !progress.kanji.extra.includes(item.id) && !session.kanjiIds.includes(item.id))).slice(0, progress.settings.kanjiDaily), [levelContent.kanji, progress.kanji.extra, progress.kanji.official, progress.settings.kanjiDaily, session.kanjiIds]);
  const deck = mode === 'extra' ? extra : daily;

  if (mode === 'daily' || mode === 'extra') return (
    <div className="page narrow-page">
      <button className="text-link back-link" type="button" onClick={() => setMode('overview')}>← Back to kanji</button>
      <header className="page-heading compact"><p className="eyebrow">{mode === 'extra' ? 'OPTIONAL EXTRA SET' : `TODAY’S ${activeLevel} SET`}</p><h1>{mode === 'extra' ? 'Explore beyond today’s set.' : 'Learn today’s kanji.'}</h1><p>{mode === 'extra' ? 'These join review now, but will still return later in official order.' : 'Readings stay visible. Flip for meaning and context, then rate your recall.'}</p></header>
      <FlashcardDeck
        area="kanji"
        items={deck}
        onRate={(item, known) => { if (known) markLearned('kanji', item.id, mode === 'extra' ? 'extra' : 'official'); review('kanji', item.id, known); }}
        onComplete={() => navigate('/test?area=kanji')}
        renderFront={(item) => { const support = kanjiReadingSupport(item); return <><div className="card-kanji">{item.character}</div><StudyAidLines japanese={item.character} hiragana={support.hiragana} romaji={support.romaji} /><p className="card-prompt">Recall the meaning</p></>; }}
        renderBack={(item) => <><h2 className="flash-reveal-title">{item.meaning}</h2><p className="example-line"><LinkedJapanese>{item.word}</LinkedJapanese></p><StudyAidLines compact japanese={item.word} hiragana={item.wordReading} meaning={item.wordMeaning} /><Link className="text-link" to={`/kanji/${item.id}`} state={{ returnTo: '/kanji' }} onClick={(event) => event.stopPropagation()}>Open full detail <ArrowRight /></Link></>}
      />
    </div>
  );

  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">{activeLevel} KANJI · OFFICIAL + EXTRA</p><h1>Today’s {daily.length} kanji.</h1><p>Your adjustable official path stays chronological. Extras remain eligible for their later official day.</p></header>
      <section className="area-summary green-band">
        <ProgressBar label={`Official ${activeLevel} progress`} value={levelContent.kanji.filter((item) => progress.kanji.official.includes(item.id)).length} max={levelContent.kanji.length} />
        <div className="mini-stat"><strong>{levelContent.kanji.filter((item) => progress.kanji.extra.includes(item.id)).length}</strong><span>extra studied</span></div>
      </section>
      <div className="item-preview-grid kanji-preview-grid">
        {daily.map((item) => <Link to={`/kanji/${item.id}`} state={{ returnTo: '/kanji' }} className={`preview-card ${progress.kanji.official.includes(item.id) ? 'is-learned' : ''}`} key={item.id} aria-label={`Open ${item.character} details`}><span>{item.character}</span>{progress.kanji.official.includes(item.id) && <Check />}</Link>)}
      </div>
      <div className="primary-actions"><button className="button primary large" type="button" onClick={() => setMode('daily')}><Play /> {dailyDone === daily.length ? 'Review today’s set' : `Study ${daily.length} kanji · ${dailyDone}/${daily.length}`}</button><Link className="button secondary" to="/test?area=kanji">Test kanji <ArrowRight /></Link></div>
      {dailyDone === daily.length && extra.length > 0 && <section className="continue-panel"><span className="feature-icon"><Dice5 /></span><div><p className="eyebrow">DAILY SET COMPLETE</p><h2>Keep going with random kanji</h2><p>Extra cards join your tests and spaced reviews, without changing the official finish estimate.</p></div><button className="button secondary" type="button" onClick={() => setMode('extra')}>Study {extra.length} extras <Sparkles /></button></section>}
      <section className="section-block link-panel"><div><p className="eyebrow">BROWSE</p><h2>All {levelContent.kanji.length} {activeLevel} kanji</h2><p>Searchable grid, status filters, and canonical detail pages.</p></div><div className="button-row"><Link className="button primary" to="/custom-study"><Sparkles /> Choose a custom set</Link><Link className="button secondary" to="/library?tab=kanji"><List /> Open kanji library</Link></div></section>
    </div>
  );
}

export function VocabularyPage() {
  const navigate = useNavigate();
  const { content, levelContent, activeLevel, progress, session, markLearned, review } = useStudy();
  const [studying, setStudying] = useState(false);
  const daily = session.vocabularyIds.map((id) => content.vocabulary.find((item) => item.id === id)).filter(Boolean);
  const done = daily.filter((item) => progress.vocabulary.learned.includes(item.id)).length;
  if (studying) return (
    <div className="page narrow-page">
      <button className="text-link back-link" type="button" onClick={() => setStudying(false)}>← Back to vocabulary</button>
      <header className="page-heading compact"><p className="eyebrow">TODAY’S {daily.length} {activeLevel} WORDS</p><h1>Build useful recall.</h1><p>The word and hiragana stay together; recall the meaning and real-life use.</p></header>
      <FlashcardDeck area="vocabulary" items={daily} onRate={(item, known) => { if (known) markLearned('vocabulary', item.id); review('vocabulary', item.id, known); }} onComplete={() => navigate('/test?area=vocabulary')} renderFront={(item) => <><div className="card-word"><LinkedJapanese>{item.word}</LinkedJapanese></div><StudyAidLines japanese={item.word} hiragana={item.reading} romaji={item.romaji} /><p className="card-prompt">Recall the meaning</p></>} renderBack={(item) => { const example = item.examples?.[0]; return <><h2 className="flash-reveal-title">{item.meaning}</h2><StudyAidLines japanese={item.word} hiragana={item.reading} romaji={item.romaji} /><p>{item.type}</p>{example && <><p className="example-line"><LinkedJapanese>{example.japanese}</LinkedJapanese></p><StudyAidLines compact japanese={example.japanese} meaning={example.english} /></>}<Link className="text-link" to={`/vocabulary/${item.id}`} onClick={(event) => event.stopPropagation()}>Full word detail <ArrowRight /></Link></>; }} />
    </div>
  );
  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">{activeLevel} VOCABULARY · {levelContent.vocabulary.length} WORDS</p><h1>{daily.length} words for today.</h1><p>Kanji spellings always include hiragana; tests focus on meaning and recognition.</p></header>
      <section className="area-summary red-band"><ProgressBar label={`${activeLevel} vocabulary`} value={levelContent.vocabulary.filter((item) => progress.vocabulary.learned.includes(item.id)).length} max={levelContent.vocabulary.length} /><div className="mini-stat"><strong>{done}/{daily.length}</strong><span>today</span></div></section>
      <div className="word-preview-list">{daily.slice(0, Math.min(12, daily.length)).map((item) => <article className="word-row" key={item.id}><Link className="word-main" to={`/vocabulary/${item.id}`}><LinkedJapanese>{item.word}</LinkedJapanese></Link><StudyAidLines compact japanese={item.word} hiragana={item.reading} romaji={item.romaji} meaning={item.meaning} />{progress.vocabulary.learned.includes(item.id) && <Check />}</article>)}</div>
      <div className="primary-actions"><button className="button primary large" type="button" onClick={() => setStudying(true)}><Play /> {done === daily.length ? 'Review today’s words' : `Learn ${daily.length} words · ${done}/${daily.length}`}</button><Link className="button secondary" to="/test?area=vocabulary">Test vocabulary <ArrowRight /></Link></div>
      <section className="section-block link-panel"><div><p className="eyebrow">BROWSE</p><h2>Complete vocabulary catalog</h2><p>Search by Japanese, reading, romaji, meaning, or part of speech.</p></div><Link className="button secondary" to="/library?tab=vocabulary"><List /> Open word library</Link></section>
    </div>
  );
}

export function GrammarPage() {
  const navigate = useNavigate();
  const { content, levelContent, activeLevel, progress, session, markLearned, review } = useStudy();
  const [studying, setStudying] = useState(false);
  const daily = session.grammarIds.map((id) => content.grammar.find((item) => item.id === id)).filter(Boolean);
  const done = daily.filter((item) => progress.grammar.learned.includes(item.id)).length;
  const counts = Object.fromEntries(['N5', 'N4', 'N3'].map((level) => [level, levelContent.grammar.filter((item) => item.level === level).length]));
  if (studying) return (
    <div className="page narrow-page">
      <button className="text-link back-link" type="button" onClick={() => setStudying(false)}>← Back to grammar</button>
      <header className="page-heading compact"><p className="eyebrow">TODAY’S {daily.length} PATTERNS</p><h1>Grammar in context.</h1><p>Flip for structure and examples, then rate how confidently you could use it.</p></header>
      <FlashcardDeck area="grammar" items={daily} onRate={(item, known) => { if (known) markLearned('grammar', item.id); review('grammar', item.id, known); }} onComplete={() => navigate('/test?area=grammar')} renderFront={(item) => <><span className={`level-badge ${item.level.toLowerCase()}`}>{item.level}</span><div className="card-pattern"><LinkedJapanese>{item.pattern}</LinkedJapanese></div><p className="card-prompt">Recall the reading, use, and meaning</p></>} renderBack={(item) => { const example = item.examples?.[0]; return <><h2 className="flash-reveal-title"><LinkedJapanese>{item.pattern}</LinkedJapanese></h2><StudyAidLines japanese={item.pattern} romaji={item.romaji} meaning={item.meaning} /><p className="structure-box"><strong>Structure</strong><LinkedJapanese>{item.structure}</LinkedJapanese></p><StudyAidLines compact japanese={item.structure} meaning={item.meaning} />{example && <><p className="example-line"><LinkedJapanese>{example.japanese}</LinkedJapanese></p><StudyAidLines compact japanese={example.japanese} meaning={example.english} /></>}<Link className="text-link" to={`/grammar/${item.id}`} onClick={(event) => event.stopPropagation()}>Open full lesson <ArrowRight /></Link></>; }} />
    </div>
  );
  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">{activeLevel} GRAMMAR · {levelContent.grammar.length} POINTS</p><h1>{daily.length} patterns for today.</h1><p>{activeLevel === 'N3' ? 'The complete N3 catalog with structure, nuance, errors, and comparisons.' : 'N5 foundations and N4 nuance with structure, errors, and comparisons.'}</p></header>
      <section className="area-summary gold-band"><ProgressBar label={`${activeLevel} grammar path`} value={levelContent.grammar.filter((item) => progress.grammar.learned.includes(item.id)).length} max={levelContent.grammar.length} /><div className="level-counts">{Object.entries(counts).filter(([, count]) => count).map(([level, count]) => <span key={level}><b>{count}</b> {level}</span>)}</div></section>
      <div className="grammar-preview-grid">{daily.map((item) => <article className="grammar-preview" key={item.id}><span className={`level-badge ${item.level.toLowerCase()}`}>{item.level}</span><h3><Link to={`/grammar/${item.id}`}><LinkedJapanese>{item.pattern}</LinkedJapanese></Link></h3><StudyAidLines compact japanese={item.pattern} romaji={item.romaji} meaning={item.meaning} />{progress.grammar.learned.includes(item.id) && <Check />}</article>)}</div>
      <div className="primary-actions"><button className="button primary large" type="button" onClick={() => setStudying(true)}><Play /> {done === daily.length ? 'Review today’s grammar' : `Learn ${daily.length} patterns · ${done}/${daily.length}`}</button><Link className="button secondary" to="/test?area=grammar">Test grammar <ArrowRight /></Link></div>
      <section className="section-block link-panel"><div><p className="eyebrow">FULL INDEX</p><h2>{activeLevel === 'N3' ? 'Complete N3 grammar' : 'N5 and N4 grammar'}</h2><p>Filter by level, search meanings, and open any detailed lesson.</p></div><Link className="button secondary" to="/library?tab=grammar"><Layers3 /> Open grammar library</Link></section>
    </div>
  );
}
