import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { kanjiByCharacter } from '../data/kanji';
import { useStudy } from '../state/StudyContext';

export function LinkedJapanese({ children, className = '' }) {
  const [selected, setSelected] = useState(null);
  const { content } = useStudy();
  const text = String(children ?? '');
  const current = selected && (content.kanji.find((item) => item.character === selected) || kanjiByCharacter[selected]);

  return (
    <>
      <span className={className}>
        {[...text].map((character, index) => {
          const linked = kanjiByCharacter[character];
          return linked ? (
            <span
              className="kanji-inline"
              key={`${character}-${index}`}
              onClick={(event) => { event.stopPropagation(); setSelected(character); }}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); setSelected(character); } }}
              role="button"
              tabIndex={0}
              aria-label={`Preview ${character}`}
            >
              {character}
            </span>
          ) : <span key={`${character}-${index}`}>{character}</span>;
        })}
      </span>
      {current && createPortal(
        <div className="sheet-backdrop" onClick={() => setSelected(null)} role="presentation">
          <section className="quick-sheet" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
            <button className="icon-button sheet-close" type="button" onClick={() => setSelected(null)} aria-label="Close preview"><X /></button>
            <div className="quick-kanji">{current.character}</div>
            <div>
              <p className="eyebrow">N4 KANJI QUICK LOOK</p>
              <h2>{current.meaning}</h2>
              <p><strong>On:</strong> {current.onyomi} <span className="dot">·</span> <strong>Kun:</strong> {current.kunyomi}</p>
              <p className="quick-word">{current.word} <span>{current.wordReading}</span> · {current.wordMeaning}</p>
              <Link className="button primary" to={`/kanji/${current.id}`} onClick={() => setSelected(null)}>
                Full kanji page <ArrowUpRight size={17} />
              </Link>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
