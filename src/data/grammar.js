import rawGrammar from './grammar.generated.json';
import { kanjiByCharacter } from './kanji';

const unique = (items) => [...new Set(items)];

export const grammar = rawGrammar.map((item) => ({
  ...item,
  linkedKanji: unique(
    [...`${item.pattern}${item.examples.map((example) => example.japanese).join('')}`].filter(
      (character) => kanjiByCharacter[character],
    ),
  ).map((character) => kanjiByCharacter[character].id),
}));

export const grammarById = Object.fromEntries(grammar.map((item) => [item.id, item]));

