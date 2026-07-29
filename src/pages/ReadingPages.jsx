import { BookMarked, Check, ChevronRight, Clock3, Eye, EyeOff, Languages, ListChecks, Volume2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { LinkedJapanese } from '../components/LinkedJapanese';
import { RevealStudyAids, StudyAidLines } from '../components/StudyReveal';
import { useStudy } from '../state/StudyContext';

export function ReadingPage() {
  const { content, progress } = useStudy();
  const [tab, setTab] = useState('passages');
  const [type, setType] = useState('All');
  const [query, setQuery] = useState('');
  const types = ['All', ...new Set(content.reading.map((item) => item.type))];
  const filtered = content.reading.filter((item) => type === 'All' || item.type === type);
  const sentences = useMemo(() => content.vocabulary.flatMap((word) => word.examples.map((example, index) => ({ ...example, word, id: `${word.id}-${index}` }))).filter((item) => `${item.japanese} ${item.english} ${item.word.word}`.toLowerCase().includes(query.toLowerCase())), [content.vocabulary, query]);
  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">READING LAB · {content.reading.length} PASSAGES</p><h1>Read first. Reveal later.</h1><p>Original N4 practice across messages, notices, schedules, conversations, and information retrieval.</p></header>
      <div className="segmented"><button className={tab === 'passages' ? 'active' : ''} type="button" onClick={() => setTab('passages')}><BookMarked /> Passages</button><button className={tab === 'sentences' ? 'active' : ''} type="button" onClick={() => setTab('sentences')}><Languages /> Sample sentences</button></div>
      {tab === 'passages' ? <>
        <div className="filter-scroll">{types.map((item) => <button className={type === item ? 'active' : ''} type="button" key={item} onClick={() => setType(item)}>{item}</button>)}</div>
        <div className="reading-grid">{filtered.map((passage) => { const result = progress.reading.completed[passage.id]; return <article className="reading-card" key={passage.id}><div className="reading-card-top"><span className={`difficulty ${passage.difficulty.toLowerCase()}`}>{passage.difficulty}</span>{result && <span className="score-chip"><Check /> {result.score}/{result.total}</span>}</div><p className="eyebrow">{passage.type}</p><h2><Link to={`/reading/${passage.id}`}><LinkedJapanese>{passage.title}</LinkedJapanese></Link></h2><RevealStudyAids compact showJapanese={false} japanese={passage.title} label="Reveal title reading" /><div className="reading-meta"><span><Clock3 />{passage.minutes} min</span><span><ListChecks />{passage.questions.length} questions</span></div><Link className="text-link" to={`/reading/${passage.id}`}>Open passage <ChevronRight /></Link></article>; })}</div>
      </> : <>
        <div className="search-row"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Japanese, English, or a word" /><span>{sentences.length} sentences</span></div>
        <div className="sentence-library">{sentences.slice(0, 120).map((item) => <article key={item.id}><RevealStudyAids japanese={item.japanese} meaning={item.english}><p className="japanese-sentence"><LinkedJapanese>{item.japanese}</LinkedJapanese></p></RevealStudyAids><Link to={`/vocabulary/${item.word.id}`}>Open {item.word.word}</Link></article>)}</div>
      </>}
    </div>
  );
}

export function ReadingDetail() {
  const { id } = useParams();
  const { recordReading, progress, content } = useStudy();
  const passage = content.reading.find((item) => item.id === id);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [questionHelp, setQuestionHelp] = useState({});
  if (!passage) return <Navigate to="/reading" replace />;
  const result = progress.reading.completed[id];
  const score = passage.questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(passage.japanese);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.82;
    speechSynthesis.speak(utterance);
  };
  const submit = () => { setSubmitted(true); recordReading(id, score, passage.questions.length); };
  return (
    <div className="page reading-detail-page">
      <Link className="text-link back-link" to="/reading">← All passages</Link>
      <header className="page-heading compact"><p className="eyebrow">{passage.type} · {passage.difficulty}</p><h1><LinkedJapanese>{passage.title}</LinkedJapanese></h1><RevealStudyAids compact showJapanese={false} japanese={passage.title} label="Reveal title reading" /><div className="reading-meta"><span><Clock3 />{passage.minutes} min</span>{result && <span><Check />Best: {result.score}/{result.total}</span>}</div></header>
      <section className="passage-paper">
        <div className="paper-tools"><span>Japanese text</span><div><button className="icon-text-button" type="button" onClick={speak}><Volume2 /> Listen</button></div></div>
        <div className="passage-japanese"><LinkedJapanese>{passage.japanese}</LinkedJapanese></div>
        <RevealStudyAids className="passage-reveal" showJapanese={false} japanese={passage.japanese} meaning={passage.translation} label="Reveal hiragana, romaji & meaning" />
      </section>
      <section className="reading-support"><div><span>Grammar in this passage</span><div className="meta-chips linked-support">{passage.grammar.map((label) => { const lesson = content.grammar.find((entry) => entry.pattern.includes(label) || label.includes(entry.pattern.replace(/[～〜]/g, ''))); return lesson ? <Link to={`/grammar/${lesson.id}`} key={label}><LinkedJapanese>{label}</LinkedJapanese></Link> : <span key={label}><LinkedJapanese>{label}</LinkedJapanese></span>; })}</div></div><div><span>Key vocabulary</span><div className="meta-chips linked-support">{passage.vocabulary.map((label) => { const word = content.vocabulary.find((entry) => entry.word === label); return word ? <Link to={`/vocabulary/${word.id}`} key={label}><LinkedJapanese>{label}</LinkedJapanese></Link> : <span key={label}><LinkedJapanese>{label}</LinkedJapanese></span>; })}</div></div></section>
      <section className="reading-quiz"><p className="eyebrow">COMPREHENSION</p><h2>Answer from the Japanese text</h2>{passage.questions.map((question, index) => {
        const helpOpen = Boolean(questionHelp[index]);
        return <article className="reading-question" key={question.prompt}><h3><span>{index + 1}</span><LinkedJapanese>{question.prompt}</LinkedJapanese></h3><button className="quiz-study-toggle reading-help-toggle" type="button" aria-expanded={helpOpen} onClick={() => setQuestionHelp((current) => ({ ...current, [index]: !current[index] }))}>{helpOpen ? <EyeOff /> : <Eye />}{helpOpen ? 'Hide reading help' : 'Reveal hiragana, romaji & meaning'}</button>{helpOpen && <StudyAidLines className="reading-question-aids" japanese={question.prompt} />}<div className="quiz-options">{question.options.map((option, optionIndex) => { const selected = answers[index] === optionIndex; const state = submitted ? optionIndex === question.answer ? 'correct' : selected ? 'wrong' : 'muted' : selected ? 'selected' : ''; return <button type="button" className={state} disabled={submitted} key={option} onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}><span className="quiz-option-copy"><LinkedJapanese>{option}</LinkedJapanese>{helpOpen && <StudyAidLines compact japanese={option} />}</span>{submitted && optionIndex === question.answer && <Check />}</button>; })}</div>{submitted && <div className="answer-explanation"><strong>{answers[index] === question.answer ? 'Correct' : 'Review this one'}</strong><p>{question.explanation}</p></div>}</article>;
      })}{!submitted ? <button className="button primary large" type="button" disabled={Object.keys(answers).length < passage.questions.length} onClick={submit}>Check answers</button> : <div className="result-inline"><strong>{score}/{passage.questions.length}</strong><span>{score === passage.questions.length ? 'Excellent comprehension.' : 'Read once more and locate the evidence for each answer.'}</span></div>}</section>
    </div>
  );
}
