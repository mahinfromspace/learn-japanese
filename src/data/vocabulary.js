import rawVocabulary from './vocabulary.generated.json';
import n3Vocabulary from './n3Vocabulary.generated.json';
import { findKanji, kanji } from './kanji';
import { vocabularyExampleOverrides } from './vocabularyExamples';

const unique = (items) => [...new Set(items)];

export const vocabulary = [...rawVocabulary, ...n3Vocabulary].map((item) => ({
  ...item,
  examples: vocabularyExampleOverrides[item.word]?.map(([japanese, english]) => ({ japanese, english })) || item.examples,
  linkedKanji: unique([...item.word])
    .map((character) => findKanji(character, item.level))
    .filter(Boolean)
    .map((entry) => entry.id),
}));

export const vocabularyById = Object.fromEntries(vocabulary.map((item) => [item.id, item]));

export const vocabularyByKanji = Object.fromEntries(
  kanji.map((entry) => [
    entry.id,
    vocabulary.filter((item) => item.word.includes(entry.character)),
  ]),
);
