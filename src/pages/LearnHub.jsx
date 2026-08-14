import { ArrowRight, Brain, Languages, Shapes, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudy } from '../state/StudyContext';

export function LearnHub() {
  const { progress, levelContent, activeLevel } = useStudy();
  const areas = [
    { to: '/kanji', icon: Shapes, title: 'Kanji', description: 'Adjustable daily sets, optional extras, linked words, and swipe review.', stat: `${levelContent.kanji.filter((item) => progress.kanji.official.includes(item.id)).length}/${levelContent.kanji.length} ${activeLevel} official`, color: 'green' },
    { to: '/vocabulary', icon: Languages, title: 'Vocabulary', description: 'Visible hiragana, real-life contexts, meanings, and examples.', stat: `${levelContent.vocabulary.filter((item) => progress.vocabulary.learned.includes(item.id)).length}/${levelContent.vocabulary.length} learned`, color: 'red' },
    { to: '/grammar', icon: Brain, title: 'Grammar', description: activeLevel === 'N3' ? 'The complete N3 grammar path with structure and examples.' : 'N5 foundations and N4 patterns with structure and examples.', stat: `${levelContent.grammar.filter((item) => progress.grammar.learned.includes(item.id)).length}/${levelContent.grammar.length} learned`, color: 'gold' },
    { to: '/custom-study', icon: SlidersHorizontal, title: 'Custom study', description: 'Hand-pick any learned or unlearned kanji, word, or grammar point.', stat: 'No selection limit', color: 'blue' },
  ];
  return (
    <div className="page">
      <header className="page-heading"><p className="eyebrow">LEARN · {activeLevel}</p><h1>Choose your path.</h1><p>Follow the daily plan or build a custom session from anything in the catalog.</p></header>
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
