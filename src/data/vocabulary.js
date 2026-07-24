import rawVocabulary from './vocabulary.generated.json';
import { kanjiByCharacter } from './kanji';
import { vocabularyExampleOverrides } from './vocabularyExamples';

const unique = (items) => [...new Set(items)];

export const vocabulary = rawVocabulary.map((item) => ({
  ...item,
  examples: vocabularyExampleOverrides[item.word]?.map(([japanese, english]) => ({ japanese, english })) || item.examples,
  linkedKanji: unique([...item.word].filter((character) => kanjiByCharacter[character])).map(
    (character) => kanjiByCharacter[character].id,
  ),
}));

export const vocabularyById = Object.fromEntries(vocabulary.map((item) => [item.id, item]));

export const vocabularyByKanji = Object.fromEntries(
  Object.keys(kanjiByCharacter).map((character) => [
    character,
    vocabulary.filter((item) => item.word.includes(character)),
  ]),
);
