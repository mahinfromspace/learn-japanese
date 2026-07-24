import { ArrowRight, Brain, Languages, Shapes } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudy } from '../state/StudyContext';

export function LearnHub() {
  const { progress, content } = useStudy();
  const areas = [
    { to: '/kanji', icon: Shapes, title: 'Kanji', description: 'Daily five, optional extras, linked words, and swipe review.', stat: `${progress.kanji.official.length}/${content.kanji.length} official`, color: 'green' },
    { to: '/vocabulary', icon: Languages, title: 'Vocabulary', description: 'Twenty words a day with readings, real-life contexts, and examples.', stat: `${progress.vocabulary.learned.length}/${content.vocabulary.length} learned`, color: 'red' },
    { to: '/grammar', icon: Brain, title: 'Grammar', description: 'N5 foundations and N4 patterns with structure, nuance, and examples.', stat: `${progress.grammar.learned.length}/${content.grammar.length} learned`, color: 'gold' },
  ];
  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">LEARN</p><h1>Three connected paths.</h1><p>Study one area and the linked kanji remain one tap away.</p></header>
      <div className="learn-grid">
        {areas.map(({ to, icon: Icon, title, description, stat, color }) => (
          <Link className={`learn-card ${color}`} to={to} key={to}>
            <span className="feature-icon"><Icon /></span><div><h2>{title}</h2><p>{description}</p><strong>{stat}</strong></div><ArrowRight />
          </Link>
        ))}
      </div>
    </div>
  );
}

