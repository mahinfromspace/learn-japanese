import { writeFile } from 'node:fs/promises';
import { toRomaji } from 'wanakana';

const BASE = 'https://jlptsensei.com/jlpt-n3-vocabulary-list/';
const pages = [BASE, `${BASE}page/2/`];

const decode = (value = '') => value
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
  if (/train|station|airport|travel|hotel|trip|ticket|traffic|car|ship|旅|駅|空港|電車|運転/.test(text)) return 'Travel changes, public announcements, maps, tickets, and schedules';
  if (/school|student|teacher|study|exam|class|university|学|校|試験|研究|文法/.test(text)) return 'Classes, exams, applications, textbooks, and academic notices';
  if (/company|office|work|business|job|会議|会社|仕事|工場|部長|課長/.test(text)) return 'Workplaces, formal messages, meetings, and schedules';
  if (/hospital|doctor|medicine|health|sick|ill|injur|病|医|薬|熱|具合/.test(text)) return 'Clinics, medicine instructions, health forms, and emergencies';
  if (/shop|store|buy|sell|price|money|pay|restaurant|food|meal|店|買|売|料理|飯/.test(text)) return 'Purchases, products, receipts, services, and consumer information';
  if (/noun/i.test(type)) return 'Everyday explanations, news, forms, messages, and JLPT-style texts';
  if (/verb/i.test(type)) return 'Natural actions, instructions, reports, plans, and requests';
  return 'Everyday conversation, public information, articles, and exam-style sentences';
};

const examplesFor = ({ word, meaning, type }) => {
  const gloss = meaning.split(';')[0].replace(/^to /i, '').trim();
  if (/Verb/i.test(type)) return [
    { japanese: `会話の中で「${word}」という動詞が使われました。`, english: `The verb “${word}” (${gloss}) was used in the conversation.` },
    { japanese: `この場面で、なぜ「${word}」のか考えてください。`, english: `Consider why someone would ${gloss} in this situation.` },
  ];
  if (/Adjective/i.test(type)) return [
    { japanese: `説明を読んで、どんな時に「${word}」と言えるか考えました。`, english: `I read the explanation and considered when ${word} can be used.` },
    { japanese: `写真の様子を「${word}」という言葉で説明しました。`, english: `I described the scene in the photo with the word ${word}.` },
  ];
  return [
    { japanese: `ニュースで「${word}」についての記事を読みました。`, english: `I read a news article about ${gloss}.` },
    { japanese: `「${word}」の意味を、前後の文から考えてください。`, english: `Work out the meaning of ${word} from the surrounding sentences.` },
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
      id: `v-n3-${String(order).padStart(3, '0')}`,
      order,
      word,
      reading,
      romaji: sourceRomaji || toRomaji(reading),
      meaning,
      level: 'N3',
      type,
      commonUsage: `Use ${word} when the context expresses ${meaning.split(';')[0].toLowerCase()}.`,
      realLife: contextFor(word, meaning, type),
    };
    entry.examples = examplesFor(entry);
    rows.push(entry);
  }
}

rows.sort((a, b) => a.order - b.order);
if (rows.length !== 192) throw new Error(`Expected 192 N3 vocabulary entries, found ${rows.length}`);

await writeFile(
  new URL('../src/data/n3Vocabulary.generated.json', import.meta.url),
  `${JSON.stringify(rows, null, 2)}\n`,
);

console.log(`Wrote ${rows.length} N3 vocabulary entries.`);
