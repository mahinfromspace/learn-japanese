import { ArrowLeft, BookOpen, CheckCircle2, MapPin, Pencil, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LinkedJapanese } from '../components/LinkedJapanese';
import { buildKanjiExamples } from '../data/kanjiExamples';
import { useStudy } from '../state/StudyContext';

const kanjiContexts = (item) => {
  const text = `${item.meaning} ${item.wordMeaning}`.toLowerCase();
  if (/company|business|work|employee|meeting/.test(text)) return ['Company names and office signs', 'Schedules, email, and work documents', 'Job listings and staff information'];
  if (/road|traffic|station|travel|direction|place/.test(text)) return ['Station and road signs', 'Maps and route information', 'Travel notices and timetables'];
  if (/school|study|teach|question|word|sentence/.test(text)) return ['Textbooks and classroom notices', 'Tests, forms, and school schedules', 'Dictionary and study materials'];
  if (/food|drink|meal|shop|sell|buy/.test(text)) return ['Menus and shop signs', 'Receipts and price labels', 'Restaurant and shopping conversations'];
  if (/body|ill|doctor|hospital|medicine/.test(text)) return ['Clinics and hospitals', 'Medicine labels and health forms', 'Conversations about symptoms'];
  return ['Public signs and short notices', 'Everyday messages and schedules', `Common words such as ${item.word}`];
};

function DetailHeader({ back, eyebrow, title, subtitle, status }) {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => {
    if (location.state?.returnTo) navigate(location.state.returnTo);
    else if (location.key === 'default') navigate(back);
    else navigate(-1);
  };
  return <><button className="text-link back-link" type="button" onClick={goBack}><ArrowLeft /> Back</button><header className="detail-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{status && <span className="status-pill"><CheckCircle2 />{status}</span>}</header></>;
}

export function KanjiDetail() {
  const { id } = useParams();
  const { content, progress, markLearned, editContent } = useStudy();
  const item = content.kanji.find((entry) => entry.id === id);
  const [editing, setEditing] = useState(false);
  const [meaning, setMeaning] = useState(item?.meaning || '');
  if (!item) return <Navigate to="/library?tab=kanji" replace />;
  const official = progress.kanji.official.includes(item.id);
  const extra = progress.kanji.extra.includes(item.id);
  const words = content.vocabulary.filter((word) => word.word.includes(item.character));
  const examples = buildKanjiExamples(item, words);
  const exampleWords = examples
    .filter((example, index, all) => example.word.includes(item.character) && all.findIndex((entry) => entry.word === example.word) === index)
    .filter((example) => !words.some((word) => word.word === example.word));
  const connectedCount = words.length + exampleWords.length;

  return (
    <div className="page detail-page">
      <DetailHeader back="/kanji" eyebrow={`KANJI ${item.order} · N4`} title={<span className="detail-kanji">{item.character}</span>} subtitle={item.meaning} status={official ? 'Official learned' : extra ? 'Extra studied' : ''} />
      <div className="detail-grid">
        <section className="section-block reading-panel"><h2><Volume2 /> Readings</h2><dl><div><dt>On’yomi</dt><dd>{item.onyomi}</dd></div><div><dt>Kun’yomi</dt><dd>{item.kunyomi}</dd></div></dl><div className="featured-word"><LinkedJapanese>{item.word}</LinkedJapanese><span>{item.wordReading}</span><strong>{item.wordMeaning}</strong></div>{!official && <button className="button primary" type="button" onClick={() => markLearned('kanji', item.id, 'official')}>Mark officially learned</button>}</section>
        <section className="section-block"><h2><MapPin /> Where you will see it</h2><ul className="clean-list">{kanjiContexts(item).map((context) => <li key={context}>{context}</li>)}</ul><p className="detail-note">Look for the character as a meaningful part of a word; its reading can change inside compounds.</p></section>
      </div>

      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">CONNECTED VOCABULARY</p><h2>Words containing {item.character}</h2></div><span>{connectedCount} shown · {words.length} full entries</span></div>{connectedCount ? <div className="related-word-grid">{words.map((word) => <Link to={`/vocabulary/${word.id}`} key={word.id}><strong><LinkedJapanese>{word.word}</LinkedJapanese></strong><span>{word.reading}</span><p>{word.meaning}</p></Link>)}{exampleWords.map((word) => <article className="example-word-card" key={word.word}><strong><LinkedJapanese>{word.word}</LinkedJapanese></strong><span>{word.reading}</span><p>Used in the natural examples below</p></article>)}</div> : <div className="empty-inline">No connected word is available yet. Add one from Settings.</div>}</section>

      <section className="word-levels">
        <div className="level-folder open"><div><span className="level-badge n5">N5</span><strong>Foundation words</strong></div><p>The representative word above is kept open for quick review.</p></div>
        <div className="level-folder open"><div><span className="level-badge n4">N4</span><strong>Current study words</strong></div><p>{connectedCount} linked and example words are shown openly above.</p></div>
        {['N3', 'N2', 'N1'].map((level) => <details className="level-folder" key={level}><summary><span className="level-badge advanced">{level}</span><strong>Advanced word folder</strong></summary><p>This N4 edition does not invent advanced entries. Add verified words in Settings as you expand the app.</p></details>)}
      </section>

      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">10+ NATURAL EXAMPLES</p><h2>Both readings in context</h2></div><BookOpen /></div><p className="detail-note">On’yomi examples use compounds; kun’yomi examples use native Japanese readings. A kanji with no common N4 reading in one group is shown with the readings that are actually used.</p><div className="sentence-list kanji-sentence-list">{examples.map((example, index) => <article key={`${example.japanese}-${index}`}><div className="sentence-meta"><span className={`reading-kind ${example.readingType}`}>{example.readingType === 'on' ? '音 On’yomi' : '訓 Kun’yomi'}</span><strong><LinkedJapanese>{example.word}</LinkedJapanese></strong><small>{example.reading}</small></div><p className="japanese-sentence"><LinkedJapanese>{example.japanese}</LinkedJapanese></p><p>{example.english}</p></article>)}</div></section>

      <section className="section-block editor-inline"><div><p className="eyebrow">YOUR DATA</p><h2>Edit this kanji</h2></div>{editing ? <form onSubmit={(event) => { event.preventDefault(); editContent('kanji', item.id, { meaning }); setEditing(false); }}><label>Meaning<input value={meaning} onChange={(event) => setMeaning(event.target.value)} /></label><button className="button primary" type="submit">Save change</button></form> : <button className="button secondary" type="button" onClick={() => setEditing(true)}><Pencil /> Edit meaning</button>}</section>
    </div>
  );
}

export function VocabularyDetail() {
  const { id } = useParams();
  const { content, progress, markLearned } = useStudy();
  const item = content.vocabulary.find((entry) => entry.id === id);
  if (!item) return <Navigate to="/library?tab=vocabulary" replace />;
  const learned = progress.vocabulary.learned.includes(item.id);
  const linked = content.kanji.filter((kanji) => item.word.includes(kanji.character));
  return (
    <div className="page detail-page">
      <DetailHeader back="/library?tab=vocabulary" eyebrow={`VOCABULARY ${item.order} · ${item.level}`} title={<LinkedJapanese>{item.word}</LinkedJapanese>} subtitle={`${item.reading} · ${item.romaji}`} status={learned ? 'Learned' : ''} />
      <div className="detail-grid">
        <section className="section-block"><p className="eyebrow">MEANING</p><h2>{item.meaning}</h2><div className="meta-chips"><span>{item.type}</span><span>{item.level}</span></div><p>{item.commonUsage}</p>{!learned && <button className="button primary" type="button" onClick={() => markLearned('vocabulary', item.id)}>Mark learned</button>}</section>
        <section className="section-block"><h2><MapPin /> Real-life context</h2><p>{item.realLife}</p><p className="detail-note">Notice the whole word and its surrounding particles rather than translating one character at a time.</p></section>
      </div>
      <section className="section-block"><p className="eyebrow">KANJI BREAKDOWN</p><h2>Characters in this word</h2>{linked.length ? <div className="kanji-breakdown">{linked.map((kanji) => <Link to={`/kanji/${kanji.id}`} key={kanji.id}><span>{kanji.character}</span><div><strong>{kanji.meaning}</strong><small>{kanji.onyomi} · {kanji.kunyomi}</small></div></Link>)}</div> : <p className="empty-inline">This word does not contain an N4 kanji from the current catalog.</p>}</section>
      <section className="section-block"><p className="eyebrow">EXAMPLES</p><h2>Use it in a sentence</h2><div className="sentence-list">{item.examples.map((example, index) => <article key={index}><p className="japanese-sentence"><LinkedJapanese>{example.japanese}</LinkedJapanese></p><p>{example.english}</p></article>)}</div></section>
    </div>
  );
}

export function GrammarDetail() {
  const { id } = useParams();
  const { content, progress, markLearned } = useStudy();
  const item = content.grammar.find((entry) => entry.id === id);
  if (!item) return <Navigate to="/library?tab=grammar" replace />;
  const learned = progress.grammar.learned.includes(item.id);
  return (
    <div className="page detail-page">
      <DetailHeader back="/library?tab=grammar" eyebrow={`${item.level} GRAMMAR · ${item.order}`} title={<LinkedJapanese>{item.pattern}</LinkedJapanese>} subtitle={`${item.romaji} · ${item.meaning}`} status={learned ? 'Learned' : ''} />
      <section className="structure-hero"><span>Structure</span><strong><LinkedJapanese>{item.structure}</LinkedJapanese></strong></section>
      <div className="detail-grid">
        <section className="section-block"><h2>How it works</h2><p>{item.explanation}</p><div className="meta-chips"><span>{item.register}</span><span>{item.level}</span></div>{!learned && <button className="button primary" type="button" onClick={() => markLearned('grammar', item.id)}>Mark learned</button>}</section>
        <section className="section-block warning-block"><h2>Common mistake</h2><p>{item.commonMistake}</p><h3>Compare carefully</h3><p>{item.comparison}</p></section>
      </div>
      <section className="section-block"><p className="eyebrow">EXAMPLES</p><h2>Pattern in context</h2><div className="sentence-list">{item.examples.map((example, index) => <article key={index}><p className="japanese-sentence"><LinkedJapanese>{example.japanese}</LinkedJapanese></p><p>{example.english}</p></article>)}</div></section>
      <section className="section-block"><p className="eyebrow">LINKED N4 KANJI</p><h2>Characters in this lesson</h2><div className="kanji-chip-row">{content.kanji.filter((kanji) => (item.linkedKanji || []).includes(kanji.id)).map((kanji) => <Link to={`/kanji/${kanji.id}`} key={kanji.id}><span>{kanji.character}</span>{kanji.meaning.split(';')[0]}</Link>)}</div></section>
    </div>
  );
}
