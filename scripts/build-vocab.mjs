import { writeFile } from 'node:fs/promises';
import { toRomaji } from 'wanakana';

const BASE = 'https://jlptsensei.com/jlpt-n4-vocabulary-list/';
const pages = Array.from({ length: 6 }, (_, index) =>
  index === 0 ? BASE : `${BASE}page/${index + 1}/`,
);

const decode = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const contextFor = (word, meaning, type) => {
  const text = `${word} ${meaning}`.toLowerCase();
  if (/train|station|airport|travel|hotel|trip|ticket|traffic|car|ship|旅|駅|空港|電車|運転/.test(text)) return 'Stations, tickets, travel plans, maps, and announcements';
  if (/school|student|teacher|study|exam|class|university|学|校|試験|研究|文法/.test(text)) return 'Classes, textbooks, school notices, and study conversations';
  if (/company|office|work|business|job|会議|会社|仕事|工場|部長|課長/.test(text)) return 'Workplaces, schedules, email, and office conversations';
  if (/hospital|doctor|medicine|health|sick|ill|injur|病|医|薬|熱|具合/.test(text)) return 'Clinics, pharmacies, health forms, and conversations about how someone feels';
  if (/shop|store|buy|sell|price|money|pay|restaurant|food|meal|店|買|売|料理|飯/.test(text)) return 'Shops, menus, receipts, price labels, and service conversations';
  if (/weather|rain|snow|wind|season|summer|winter|天気|雨|雪|風|季節/.test(text)) return 'Weather reports, forecasts, plans, and seasonal notices';
  if (/family|mother|father|son|daughter|wife|husband|家族|息子|娘|妻|夫/.test(text)) return 'Family conversations, profiles, letters, and everyday plans';
  if (/noun/i.test(type)) return 'Everyday labels, messages, conversations, and short notices';
  if (/verb/i.test(type)) return 'Everyday spoken instructions, plans, requests, and descriptions';
  return 'Everyday conversation, messages, and JLPT-style sentences';
};

const examplesFor = (entry) => {
  const { word, meaning, type } = entry;
  if (/Expression|Conjunction|Pronoun|Prefix|Suffix|Particle|Interjection/i.test(type)) {
    return [
      { japanese: `友達は「${word}」と言いました。`, english: `My friend used “${word}” (${meaning}).` },
      { japanese: `会話の中で「${word}」という表現を聞きました。`, english: `I heard the expression “${word}” in a conversation.` },
    ];
  }
  if (/Verb/i.test(type)) {
    return [
      { japanese: `今日は「${word}」ことにしました。`, english: `Today I decided to ${meaning.replace(/^to /, '')}.` },
      { japanese: `必要なら「${word}」ことができます。`, english: `If necessary, it is possible to ${meaning.replace(/^to /, '')}.` },
    ];
  }
  if (/Adjective/i.test(type)) {
    return [
      { japanese: `これは思ったより「${word}」です。`, english: `This is more ${meaning} than I expected.` },
      { japanese: `「${word}」物を一つ選んでください。`, english: `Please choose one thing that is ${meaning}.` },
    ];
  }
  if (/Adverb/i.test(type)) {
    return [
      { japanese: `先生は「${word}」という言葉を使いました。`, english: `The teacher used the adverb “${word}” (${meaning}).` },
      { japanese: `会話の中で「${word}」と聞こえました。`, english: `I heard “${word}” in the conversation.` },
    ];
  }
  return [
    { japanese: `今日、「${word}」について先生に質問しました。`, english: `Today I asked the teacher about ${meaning}.` },
    { japanese: `新聞で「${word}」についての記事を読みました。`, english: `I read a newspaper article about ${meaning}.` },
  ];
};

const rows = [];
for (const url of pages) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
  const html = await response.text();
  const chunks = html.match(/<tr class=jl-row>[\s\S]*?(?=<tr class=jl-row>|<\/table>)/g) || [];
  for (const chunk of chunks) {
    const cells = chunk.match(/<td[^>]*>[\s\S]*?(?=<td|$)/g) || [];
    if (cells.length < 5) continue;
    const order = Number(decode(cells[0]));
    const word = decode(cells[1]);
    const readingCell = cells[2];
    const kanaMatch = readingCell.match(/<p[^>]*>(.*?)<\/p>/);
    const reading = decode(kanaMatch?.[1]) || word;
    const sourceRomaji = decode(readingCell.replace(/<p[\s\S]*?<\/p>/, ''));
    const type = decode(cells[3]);
    const meaning = decode(cells[4]);
    if (!order || !word || !meaning) continue;
    const entry = {
      id: `v-${String(order).padStart(3, '0')}`,
      order,
      word,
      reading,
      romaji: sourceRomaji || toRomaji(reading),
      meaning,
      level: 'N4',
      type,
      commonUsage: `Use ${word} when talking about ${meaning.split(';')[0].toLowerCase()}.`,
      realLife: contextFor(word, meaning, type),
    };
    entry.examples = examplesFor(entry);
    rows.push(entry);
  }
}

rows.sort((a, b) => a.order - b.order);
if (rows.length !== 571) throw new Error(`Expected 571 vocabulary entries, found ${rows.length}`);

await writeFile(
  new URL('../src/data/vocabulary.generated.json', import.meta.url),
  `${JSON.stringify(rows, null, 2)}\n`,
);

console.log(`Wrote ${rows.length} vocabulary entries.`);
