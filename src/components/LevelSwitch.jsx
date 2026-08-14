import { useStudy } from '../state/StudyContext';

export function LevelSwitch({ compact = false }) {
  const { activeLevel, setActiveLevel } = useStudy();
  return (
    <div className={`level-switch ${compact ? 'compact' : ''}`} aria-label="Study level">
      {['N4', 'N3'].map((level) => (
        <button
          className={activeLevel === level ? 'active' : ''}
          type="button"
          key={level}
          aria-pressed={activeLevel === level}
          onClick={() => setActiveLevel(level)}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
