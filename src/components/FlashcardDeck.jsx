import { useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { LinkedJapanese } from './LinkedJapanese';

export function FlashcardDeck({ items, area, onRate, onComplete, renderFront, renderBack }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState(0);
  const startX = useRef(0);

  const current = items[index];
  const rate = (known) => {
    if (!current) return;
    onRate(current, known);
    setFlipped(false);
    setDrag(known ? 180 : -180);
    window.setTimeout(() => {
      setDrag(0);
      if (index + 1 >= items.length) onComplete?.();
      else setIndex((value) => value + 1);
    }, 180);
  };

  if (!current) return <div className="empty-state"><Check /><h3>Nothing waiting here</h3><p>Your next set will appear when more material is available.</p></div>;

  return (
    <section className="deck" aria-label={`${area} flashcards`}>
      <div className="deck-count">{index + 1} / {items.length}</div>
      <div
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
        onClick={(event) => { if (!event.target.closest('a, button, .kanji-inline')) setFlipped((value) => !value); }}
        onPointerDown={(event) => {
          if (event.target.closest('a, button, .kanji-inline')) return;
          startX.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setDrag(event.clientX - startX.current); }}
        onPointerUp={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (Math.abs(drag) > 85) rate(drag > 0);
          else setDrag(0);
        }}
      >
        <div className="flashcard-inner">
          <div className="flash-face flash-front">
            {renderFront ? renderFront(current) : <LinkedJapanese>{current.character || current.word || current.pattern}</LinkedJapanese>}
            <span className="tap-hint"><RotateCcw size={15} /> Tap to reveal</span>
          </div>
          <div className="flash-face flash-back">
            {renderBack ? renderBack(current) : <p>{current.meaning}</p>}
            <span className="tap-hint"><RotateCcw size={15} /> Tap to turn back</span>
          </div>
        </div>
      </div>
      <div className="swipe-labels"><span>Swipe left: study again</span><span>Swipe right: know it</span></div>
      <div className="rating-actions">
        <button className="button danger" type="button" onClick={() => rate(false)}><X /> Again</button>
        <button className="button success" type="button" onClick={() => rate(true)}><Check /> Know it</button>
      </div>
    </section>
  );
}
