import kuromoji from 'kuromoji';
import { toHiragana, toRomaji } from 'wanakana';
import { writeFile } from 'node:fs/promises';
import { readings } from '../src/data/readings.js';

const tokenizer = await new Promise((resolve, reject) => {
  kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((error, built) => {
    if (error) reject(error);
    else resolve(built);
  });
});

const romanize = (text) => text.split('\n').map((line) => tokenizer.tokenize(line).map((token) => {
  if (!token.reading) return token.surface_form;
  return toRomaji(toHiragana(token.reading));
}).join(' ')).join('\n');

const result = Object.fromEntries(readings.map((passage) => [passage.id, romanize(passage.japanese)]));

await writeFile(
  new URL('../src/data/readingRomaji.generated.js', import.meta.url),
  `export const readingRomaji = ${JSON.stringify(result, null, 2)}\n`,
);

console.log(`Wrote pronunciation aids for ${readings.length} passages.`);
