import rawGrammar from './grammar.generated.json';
import { findKanji } from './kanji';

const unique = (items) => [...new Set(items)];

export const grammar = rawGrammar.map((item) => ({
  ...item,
  linkedKanji: unique(
    [...`${item.pattern}${item.examples.map((example) => example.japanese).join('')}`]
      .map((character) => findKanji(character, item.level === 'N3' ? 'N3' : 'N4'))
      .filter(Boolean)
      .map((entry) => entry.id),
  ),
}));

export const grammarById = Object.fromEntries(grammar.map((item) => [item.id, item]));
