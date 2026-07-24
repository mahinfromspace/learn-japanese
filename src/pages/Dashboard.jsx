import { ArrowRight, BookOpenText, Brain, CheckCircle2, Clock3, Flame, Languages, Shapes } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { useStudy } from '../state/StudyContext';

const finishEstimate = (remaining, daily) => {
  if (!remaining) return 'Complete';
  const days = Math.ceil(remaining / Math.max(1, daily));
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${days} days · ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}`;
};

export function Dashboard() {
  const { progress, content, session } = useStudy();
  const accuracy = progress.stats.answered ? Math.round((progress.stats.correct / progress.stats.answered) * 100) : 0;
  const completedToday = [
    session.kanjiIds.every((id) => progress.kanji.official.includes(id)),
    session.vocabularyIds.every((id) => progress.vocabulary.learned.includes(id)),
    session.grammarIds.every((id) => progress.grammar.learned.includes(id)),
  ].filter(Boolean).length;

  return (
    <div className="page dashboard-page">
      <section className="today-hero">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</p>
          <h1>{completedToday === 3 ? 'Daily set complete.' : 'Your next small wins.'}</h1>
          <p>{completedToday === 3 ? 'A fresh mixed test is ready whenever you are.' : `${3 - completedToday} learning set${3 - completedToday === 1 ? '' : 's'} left today. Your extra study stays separate from the official pace.`}</p>
        </div>
        <div className="streak-block"><Flame /><strong>{Object.keys(progress.sessions).length}</strong><span>study days</span></div>
      </section>

      <section className="daily-grid">
        <DailyCard icon={Shapes} color="green" title="Kanji" count={session.kanjiIds.filter((id) => progress.kanji.official.includes(id)).length} total={session.kanjiIds.length} note="Official daily set" to="/kanji" preview={session.kanjiIds.map((id) => content.kanji.find((item) => item.id === id)?.character).join(' ')} />
        <DailyCard icon={Languages} color="red" title="Vocabulary" count={session.vocabularyIds.filter((id) => progress.vocabulary.learned.includes(id)).length} total={session.vocabularyIds.length} note="Words for today" to="/vocabulary" preview={`${session.vocabularyIds.length} useful words`} />
        <DailyCard icon={Brain} color="gold" title="Grammar" count={session.grammarIds.filter((id) => progress.grammar.learned.includes(id)).length} total={session.grammarIds.length} note="N5 + N4 path" to="/grammar" preview={`${session.grammarIds.length} patterns`} />
        <DailyCard icon={BookOpenText} color="blue" title="Reading" count={Object.keys(progress.reading.completed).length} total={content.reading.length} note="Original N4 drills" to="/reading" preview="Choose your next passage" />
      </section>

      <section className="split-section">
        <div className="section-block">
          <div className="section-heading"><div><p className="eyebrow">OFFICIAL PACE</p><h2>Finish estimates</h2></div><Clock3 /></div>
          <div className="estimate-list">
            <EstimateRow label="Kanji" value={finishEstimate(content.kanji.length - progress.kanji.official.length, progress.settings.kanjiDaily)} />
            <EstimateRow label="Vocabulary" value={finishEstimate(content.vocabulary.length - progress.vocabulary.learned.length, progress.settings.vocabularyDaily)} />
            <EstimateRow label="Grammar" value={finishEstimate(content.grammar.length - progress.grammar.learned.length, progress.settings.grammarDaily)} />
          </div>
          <p className="fine-print">Extra kanji appear in reviews but never shorten the official estimate.</p>
        </div>

        <div className="section-block">
          <div className="section-heading"><div><p className="eyebrow">RECALL</p><h2>Overall progress</h2></div><CheckCircle2 /></div>
          <ProgressBar label="Kanji" value={progress.kanji.official.length} max={content.kanji.length} />
          <ProgressBar label="Vocabulary" value={progress.vocabulary.learned.length} max={content.vocabulary.length} />
          <ProgressBar label="Grammar" value={progress.grammar.learned.length} max={content.grammar.length} />
          <div className="accuracy-row"><span>Quiz accuracy</span><strong>{accuracy}%</strong></div>
          <Link className="text-link" to="/test">Start a mixed test <ArrowRight /></Link>
        </div>
      </section>
    </div>
  );
}

function DailyCard({ icon: Icon, color, title, count, total, note, to, preview }) {
  const done = total > 0 && count === total;
  return (
    <Link className={`daily-card ${color}`} to={to}>
      <div className="daily-card-head"><span className="feature-icon"><Icon /></span>{done && <CheckCircle2 className="done-icon" />}</div>
      <p className="eyebrow">{note}</p>
      <h2>{title}</h2>
      <p className="daily-preview">{preview}</p>
      <div className="daily-foot"><span>{count}/{total}</span><ArrowRight /></div>
    </Link>
  );
}

function EstimateRow({ label, value }) {
  return <div className="estimate-row"><span>{label}</span><strong>{value}</strong></div>;
}
