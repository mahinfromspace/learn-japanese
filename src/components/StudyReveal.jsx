import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LinkedJapanese } from './LinkedJapanese';
import { resolveStudySupport } from '../lib/studySupport';

export function StudyAidLines({
  japanese,
  hiragana,
  romaji,
  meaning,
  compact = false,
  className = '',
}) {
  const support = resolveStudySupport({ japanese, hiragana, romaji, meaning });
  const hasMeaning = Boolean(support.meaning);
  if (!support.hiragana && !support.romaji && !hasMeaning) return null;

  if (compact) {
    return (
      <span className={`study-aids compact ${className}`.trim()}>
        {support.hiragana && <span><b>Hiragana</b>{support.hiragana}</span>}
        {support.romaji && <span><b>Romaji</b>{support.romaji}</span>}
        {hasMeaning && <span><b>Meaning</b>{support.meaning}</span>}
      </span>
    );
  }

  return (
    <dl className={`study-aids ${className}`.trim()}>
      {support.hiragana && <div><dt>Hiragana</dt><dd>{support.hiragana}</dd></div>}
      {support.romaji && <div><dt>Romaji</dt><dd>{support.romaji}</dd></div>}
      {hasMeaning && <div><dt>Meaning</dt><dd>{support.meaning}</dd></div>}
    </dl>
  );
}

export function RevealStudyAids({
  japanese,
  hiragana,
  romaji,
  meaning,
  children,
  showJapanese = true,
  compact = false,
  className = '',
  label = 'Reveal reading & meaning',
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const support = resolveStudySupport({ japanese, hiragana, romaji, meaning });
  const available = support.hiragana || support.romaji || support.meaning;

  return (
    <div className={`study-reveal ${compact ? 'compact' : ''} ${className}`.trim()}>
      {showJapanese && (
        <div className="study-japanese">
          {children || <LinkedJapanese>{japanese}</LinkedJapanese>}
        </div>
      )}
      {available && (
        <>
          <button
            className="study-reveal-button"
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Hide reading and meaning' : label}
            title={open ? 'Hide reading and meaning' : label}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((value) => !value);
            }}
          >
            {open ? <EyeOff /> : <Eye />}
            <span>{open ? 'Hide' : compact ? 'Reveal' : label}</span>
          </button>
          {open && (
            <StudyAidLines
              className="study-reveal-panel"
              japanese={japanese}
              hiragana={hiragana}
              romaji={romaji}
              meaning={meaning}
              compact={compact}
            />
          )}
        </>
      )}
    </div>
  );
}
