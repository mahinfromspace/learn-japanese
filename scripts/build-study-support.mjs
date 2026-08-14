import kuromoji from 'kuromoji';
import { toHiragana, toRomaji } from 'wanakana';
import { readFile, writeFile } from 'node:fs/promises';
import { kanji } from '../src/data/kanji.js';
import { buildKanjiExamples } from '../src/data/kanjiExamples.js';
import { vocabularyExampleOverrides } from '../src/data/vocabularyExamples.js';
import { readings } from '../src/data/readings.js';

const rawVocabulary = [
  ...JSON.parse(await readFile(new URL('../src/data/vocabulary.generated.json', import.meta.url))),
  ...JSON.parse(await readFile(new URL('../src/data/n3Vocabulary.generated.json', import.meta.url))),
];
const vocabulary = rawVocabulary.map((item) => ({
  ...item,
  examples: vocabularyExampleOverrides[item.word]?.map(([japanese, english]) => ({ japanese, english })) || item.examples,
}));
const grammar = JSON.parse(await readFile(new URL('../src/data/grammar.generated.json', import.meta.url)));

const tokenizer = await new Promise((resolve, reject) => {
  kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((error, built) => {
    if (error) reject(error);
    else resolve(built);
  });
});

const cleanRomajiLine = (value) => value
  .replace(/\s+([、。！？：,.!?％%））」』])/g, '$1')
  .replace(/([（「『])\s+/g, '$1')
  .trim();

const tokenizeLine = (line) => {
  const tokens = tokenizer.tokenize(line);
  const hiragana = tokens.map((token) => (
    token.reading ? toHiragana(token.reading) : toHiragana(token.surface_form, { passRomaji: true })
  )).join('');
  const romaji = cleanRomajiLine(toRomaji(hiragana));
  return [hiragana, romaji];
};

const pronunciation = (text, explicitReading = '') => {
  if (explicitReading) {
    const hiragana = toHiragana(explicitReading, { passRomaji: true });
    return [hiragana, toRomaji(hiragana)];
  }
  const lines = text.split('\n').map(tokenizeLine);
  return [
    lines.map(([hiragana]) => hiragana).join('\n'),
    lines.map(([, romaji]) => romaji).join('\n'),
  ];
};

const glossary = new Map();
const addGloss = (japanese, english) => {
  if (!japanese || !english || glossary.has(japanese)) return;
  glossary.set(japanese, String(english).split(';')[0].trim());
};

const coreGlosses = {
  人: 'person', 何: 'what', いる: 'to be / exist', 行く: 'to go', 後: 'after', 一: 'one',
  十: 'ten', 中: 'inside / during', どう: 'how', 時: 'time / hour', する: 'to do', 日曜日: 'Sunday',
  分: 'minute / part', どこ: 'where', カード: 'card', 二: 'two', 会員: 'member', 証: 'ID / certificate',
  本: 'book', いい: 'good', 来る: 'to come', 日: 'day', 前: 'before', 電話: 'telephone / call',
  雨: 'rain', 時半: 'half past', 電車: 'train', 土曜日: 'Saturday', 書く: 'to write',
  金曜日: 'Friday', 先生: 'teacher', 番線: 'platform number', 切符: 'ticket', 明日: 'tomorrow',
  三: 'three', 受け取る: 'to receive', 時間: 'time', 学校: 'school', 五: 'five',
  ある: 'to exist / have', いつ: 'when', 靴: 'shoes', 階: 'floor', できる: 'can / be able to',
  もの: 'thing', どれ: 'which', 八: 'eight', 必要: 'necessary', 円: 'yen', 大きい: 'big',
  置く: 'to put / place', 月曜日: 'Monday', 午後: 'afternoon / p.m.', 乗る: 'to ride',
  返す: 'to return', ほう: 'direction / option', 降る: 'to fall (rain or snow)', ない: 'not / none',
  木曜日: 'Thursday', 九: 'nine', ため: 'because / for', 六: 'six', 頼む: 'to ask / request',
  初めて: 'for the first time', 休む: 'to rest / close', 工事: 'construction', 今日: 'today',
  天気: 'weather', 出す: 'to put out / submit', 机: 'desk', 一番: 'number one / most',
  教科書: 'textbook', 番号: 'number', 財布: 'wallet', 先: 'first / ahead', 一緒: 'together',
  店長: 'store manager', 駅員: 'station staff', 近く: 'nearby', 北口: 'north exit',
  暖かい: 'warm', 傘: 'umbrella', 水着: 'swimsuit', そう: 'it seems', 晴れる: 'to clear up',
  雪: 'snow', たくさん: 'many / a lot', 暑い: 'hot', 作文: 'composition', 来週: 'next week',
  読み直す: 'to reread', 友達: 'friend', 渡す: 'to hand over', 買える: 'can buy',
  返品: 'return / refund', 午前: 'morning / a.m.', かばん: 'bag', セール: 'sale',
  保険: 'insurance', 何時: 'what time', 学生: 'student', 免許: 'license', 交番: 'police box',
  千: 'thousand', 回: 'times', 百: 'hundred', セット: 'set', どちら: 'which of two',
  食べる: 'to eat', 入れる: 'to put in', 水曜日: 'Wednesday', 七: 'seven', バス: 'bus',
  荷物: 'luggage / package', 参加: 'to participate', もう一度: 'once more', 四: 'four',
  行ける: 'can go', 待合室: 'waiting room', 車: 'car', 八月: 'August', 箱: 'box',
  全部: 'all', 働く: 'to work', 高い: 'high / expensive', 無料: 'free of charge',
  冷蔵庫: 'refrigerator', 費: 'fee', 水: 'water', 普通: 'ordinary / local', プール: 'pool',
  薬: 'medicine', 朝食: 'breakfast', 名前: 'name', 外: 'outside', 読む: 'to read',
};
for (const [japanese, english] of Object.entries(coreGlosses)) addGloss(japanese, english);

for (const item of vocabulary) addGloss(item.word, item.meaning);
for (const item of kanji) {
  addGloss(item.character, item.meaning);
  addGloss(item.word, item.wordMeaning);
}
for (const item of grammar) addGloss(item.pattern, item.meaning);

const ignoredParts = new Set(['助詞', '助動詞', '記号']);
const fallbackGloss = (text) => {
  const glosses = [];
  for (const token of tokenizer.tokenize(text)) {
    if (ignoredParts.has(token.pos)) continue;
    const direct = glossary.get(token.surface_form) || glossary.get(token.basic_form);
    const characterGloss = !direct && [...token.surface_form]
      .map((character) => glossary.get(character))
      .filter(Boolean)
      .join(' / ');
    const gloss = direct || characterGloss;
    if (gloss && gloss !== glosses.at(-1)) glosses.push(gloss);
  }
  return glosses.length
    ? `Word-by-word: ${glosses.join(' · ')}`
    : 'Contextual meaning: use the surrounding lesson for the full sense.';
};

const support = new Map();
const add = (text, explicitReading = '', meaning = '') => {
  if (typeof text !== 'string' || !text.trim() || !/[ぁ-んァ-ヶ一-龯々〆ヵヶ]/u.test(text)) return;
  const existing = support.get(text) || [];
  const generated = pronunciation(text, explicitReading);
  support.set(text, [
    explicitReading ? generated[0] : existing[0] || generated[0],
    explicitReading ? generated[1] : existing[1] || generated[1],
    meaning || existing[2] || '',
  ]);
};

for (const item of vocabulary) {
  add(item.word, item.reading, item.meaning);
  for (const example of item.examples || []) add(example.japanese, '', example.english);
}

for (const item of kanji) {
  add(item.word, item.wordReading, item.wordMeaning);
  const words = vocabulary.filter((word) => word.word.includes(item.character));
  for (const example of buildKanjiExamples(item, words)) {
    add(example.word, example.reading, glossary.get(example.word));
    add(example.japanese, '', example.english);
  }
}

for (const item of grammar) {
  add(item.pattern, '', item.meaning);
  add(item.structure, '', item.meaning);
  for (const example of item.examples || []) add(example.japanese, '', example.english);
}

const vocabularyReading = new Map(vocabulary.map((item) => [item.word, item.reading]));
for (const passage of readings) {
  add(passage.title);
  add(passage.japanese, '', passage.translation);
  for (const label of passage.grammar || []) add(label);
  for (const label of passage.vocabulary || []) add(label, vocabularyReading.get(label), glossary.get(label));
  for (const question of passage.questions || []) {
    add(question.prompt, '', `Question help: ${question.explanation}`);
    for (const option of question.options || []) add(option);
  }
}

for (const [text, value] of support) {
  if (!value[2]) value[2] = fallbackGloss(text);
}

const sorted = Object.fromEntries([...support.entries()].sort(([left], [right]) => left.localeCompare(right, 'ja')));
await writeFile(
  new URL('../src/data/studySupport.generated.js', import.meta.url),
  `// Generated by scripts/build-study-support.mjs. Do not edit by hand.\nexport const studySupport = ${JSON.stringify(sorted, null, 2)};\n`,
);

console.log(`Wrote hiragana and romaji support for ${support.size} Japanese study strings.`);
