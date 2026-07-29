import { readFile } from 'node:fs/promises';
import { kanji } from '../src/data/kanji.js';
import { buildKanjiExamples } from '../src/data/kanjiExamples.js';
import { readings } from '../src/data/readings.js';
import { studySupport } from '../src/data/studySupport.generated.js';
import { vocabularyExampleOverrides } from '../src/data/vocabularyExamples.js';

const rawVocabulary = JSON.parse(await readFile(new URL('../src/data/vocabulary.generated.json', import.meta.url)));
const vocabulary = rawVocabulary.map((item) => ({
  ...item,
  examples: vocabularyExampleOverrides[item.word]?.map(([japanese, english]) => ({ japanese, english })) || item.examples,
}));
const grammar = JSON.parse(await readFile(new URL('../src/data/grammar.generated.json', import.meta.url)));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const uniqueIds = (items, label) => {
  const ids = new Set(items.map((item) => item.id));
  assert(ids.size === items.length, `${label} has duplicate IDs`);
};

const assertStudySupport = (text, label) => {
  const support = studySupport[text];
  assert(support?.[0] && support?.[1] && support?.[2], `Missing hiragana/romaji/meaning support for ${label}: ${text}`);
};

assert(kanji.length === 167, `Expected 167 kanji, found ${kanji.length}`);
assert(vocabulary.length === 571, `Expected 571 vocabulary entries, found ${vocabulary.length}`);
assert(grammar.filter((item) => item.level === 'N5').length === 84, 'N5 grammar count changed');
assert(grammar.filter((item) => item.level === 'N4').length === 132, 'N4 grammar count changed');
assert(readings.length === 81, `Expected 81 readings, found ${readings.length}`);

uniqueIds(kanji, 'Kanji');
uniqueIds(vocabulary, 'Vocabulary');
uniqueIds(grammar, 'Grammar');
uniqueIds(readings, 'Reading');

for (const item of vocabulary) {
  assert(item.word && item.reading && item.meaning, `Incomplete vocabulary: ${item.id}`);
  assert(item.examples?.length >= 2, `Vocabulary lacks examples: ${item.id}`);
  assertStudySupport(item.word, `vocabulary ${item.id}`);
  for (const example of item.examples) assertStudySupport(example.japanese, `vocabulary example ${item.id}`);
}

for (const item of kanji) {
  const linkedWords = vocabulary.filter((word) => word.word.includes(item.character));
  const examples = buildKanjiExamples(item, linkedWords);
  assert(examples.length >= 10, `Kanji lacks 10 examples: ${item.character}`);
  assert(examples.every((example) => example.japanese && example.english && example.readingType), `Incomplete kanji example: ${item.character}`);
  assertStudySupport(item.word, `kanji word ${item.character}`);
  for (const example of examples) {
    assertStudySupport(example.word, `kanji example word ${item.character}`);
    assertStudySupport(example.japanese, `kanji example sentence ${item.character}`);
  }
}

for (const item of grammar) {
  assert(item.pattern && item.structure && item.explanation, `Incomplete grammar: ${item.id}`);
  assert(item.examples?.length >= 3, `Grammar lacks examples: ${item.id}`);
  assertStudySupport(item.pattern, `grammar pattern ${item.id}`);
  assertStudySupport(item.structure, `grammar structure ${item.id}`);
  for (const example of item.examples) assertStudySupport(example.japanese, `grammar example ${item.id}`);
}

for (const passage of readings) {
  assert(passage.japanese && passage.translation, `Incomplete reading: ${passage.id}`);
  assert(passage.questions.length >= 2, `Reading lacks questions: ${passage.id}`);
  assertStudySupport(passage.title, `reading title ${passage.id}`);
  assertStudySupport(passage.japanese, `reading passage ${passage.id}`);
  for (const question of passage.questions) {
    assert(question.answer >= 0 && question.answer < question.options.length, `Invalid answer in ${passage.id}`);
    assertStudySupport(question.prompt, `reading question ${passage.id}`);
    for (const option of question.options) assertStudySupport(option, `reading option ${passage.id}`);
  }
}

assert(studySupport.アフリカ?.[0] === 'あふりか', 'Katakana vocabulary must reveal a hiragana form');

console.log('Validated all catalogs plus hidden hiragana/romaji support for built-in Japanese study content.');
