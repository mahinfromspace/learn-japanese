import { writeFile } from 'node:fs/promises';

const configs = [
  { level: 'N5', pages: 3, base: 'https://jlptsensei.com/jlpt-n5-grammar-list/' },
  { level: 'N4', pages: 4, base: 'https://jlptsensei.com/jlpt-n4-grammar-list/' },
];

const decode = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#8211;|&ndash;|&minus;/g, '-')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const curated = {
  'は': {
    structure: 'Noun + は + comment',
    explanation: 'Marks the topic: what the rest of the sentence is about. It often contrasts this topic with another possible topic.',
    examples: [['私は学生です。', 'I am a student.'], ['今日は暑いです。', 'As for today, it is hot.'], ['魚は食べますが、肉は食べません。', 'I eat fish, but I do not eat meat.']],
  },
  'が': {
    structure: 'Noun + が + predicate',
    explanation: 'Marks the grammatical subject or highlights newly identified information. It is common with existence, ability, likes, and sensory descriptions.',
    examples: [['猫がいます。', 'There is a cat.'], ['だれが来ますか。', 'Who will come?'], ['日本語が少し分かります。', 'I understand a little Japanese.']],
  },
  'を': {
    structure: 'Noun + を + transitive verb',
    explanation: 'Marks the direct object affected by an action. With movement verbs it can also mark the place crossed or left.',
    examples: [['本を読みます。', 'I read a book.'], ['公園を歩きます。', 'I walk through the park.'], ['家を出ました。', 'I left home.']],
  },
  'に': {
    structure: 'Time/place/target + に',
    explanation: 'Marks a destination, specific time, recipient, purpose, or place of existence. The role is determined by the verb.',
    examples: [['七時に起きます。', 'I wake up at seven.'], ['学校に行きます。', 'I go to school.'], ['友達に本を貸しました。', 'I lent a book to a friend.']],
  },
  'で': {
    structure: 'Place/tool/means + で',
    explanation: 'Marks where an action happens or the means, material, language, or tool used to perform it.',
    examples: [['図書館で勉強します。', 'I study at the library.'], ['電車で行きます。', 'I go by train.'], ['日本語で話してください。', 'Please speak in Japanese.']],
  },
  'てもいい': {
    structure: 'Verb て-form + もいい',
    explanation: 'Gives or asks for permission. In questions, it politely checks whether an action is acceptable.',
    examples: [['ここに座ってもいいです。', 'You may sit here.'], ['写真を撮ってもいいですか。', 'May I take a photo?'], ['先に帰ってもいいですよ。', 'It is okay to go home first.']],
  },
  'てはいけない': {
    structure: 'Verb て-form + はいけない',
    explanation: 'States that an action is prohibited or unacceptable. ちゃいけない is a common casual contraction.',
    examples: [['ここで泳いではいけません。', 'You must not swim here.'], ['この薬を飲みすぎてはいけない。', 'You must not take too much of this medicine.'], ['入ってはいけない場所です。', 'This is a place you must not enter.']],
  },
  'なければならない': {
    structure: 'Verb ない-form without い + ければならない',
    explanation: 'Expresses an obligation: if the action is not done, the situation will not be acceptable. なければなりません is polite.',
    examples: [['宿題をしなければなりません。', 'I have to do my homework.'], ['明日は早く起きなければならない。', 'I must wake up early tomorrow.'], ['駅で切符を買わなければなりません。', 'I have to buy a ticket at the station.']],
  },
  'なくてもいい': {
    structure: 'Verb ない-form without い + くてもいい',
    explanation: 'Says that an action is not required. It gives relief from an obligation; it does not prohibit the action.',
    examples: [['今日は来なくてもいいです。', 'You do not have to come today.'], ['名前を書かなくてもいいです。', 'You do not need to write your name.'], ['急がなくてもいいですよ。', 'You do not have to hurry.']],
  },
  'たことがある': {
    structure: 'Verb past plain form + ことがある',
    explanation: 'Describes having had an experience at least once. It is not used for something that happened only moments ago.',
    examples: [['京都へ行ったことがあります。', 'I have been to Kyoto.'], ['この料理を食べたことがありますか。', 'Have you eaten this dish before?'], ['一度も海を見たことがありません。', 'I have never seen the sea.']],
  },
  'ことができる': {
    structure: 'Verb dictionary form + ことができる',
    explanation: 'Expresses ability or possibility. In conversation, a potential verb is often shorter but the meaning is similar.',
    examples: [['漢字を読むことができます。', 'I can read kanji.'], ['ここで切符を買うことができます。', 'You can buy tickets here.'], ['明日は来ることができません。', 'I cannot come tomorrow.']],
  },
  'つもり': {
    structure: 'Verb dictionary/ない-form + つもりだ',
    explanation: 'States a settled intention or plan. It is stronger than simply thinking that something might happen.',
    examples: [['来年、日本へ行くつもりです。', 'I intend to go to Japan next year.'], ['今日は出かけないつもりです。', 'I plan not to go out today.'], ['大学で日本語を勉強するつもりです。', 'I intend to study Japanese at university.']],
  },
  '予定': {
    structure: 'Verb dictionary form / Noun + の + 予定だ',
    explanation: 'Describes an arranged schedule or plan. Unlike つもり, it often refers to an external or fixed timetable.',
    examples: [['会議は三時に始まる予定です。', 'The meeting is scheduled to start at three.'], ['来週、旅行する予定です。', 'I am scheduled to travel next week.'], ['明日は休みの予定です。', 'Tomorrow is planned as a day off.']],
  },
  'ながら': {
    structure: 'Verb ます-stem + ながら + main action',
    explanation: 'Shows that the same person performs two actions at the same time. The action after ながら is the main one.',
    examples: [['音楽を聞きながら勉強します。', 'I study while listening to music.'], ['歩きながら話しました。', 'We talked while walking.'], ['テレビを見ながらご飯を食べます。', 'I eat while watching television.']],
  },
  'そうだ': {
    structure: 'Verb ます-stem / adjective stem + そうだ',
    explanation: 'Describes an appearance-based impression: something looks likely or seems a certain way. This differs from hearsay そうだ.',
    examples: [['雨が降りそうです。', 'It looks like it will rain.'], ['このケーキはおいしそうです。', 'This cake looks delicious.'], ['その荷物は重そうです。', 'That luggage looks heavy.']],
  },
  'かもしれない': {
    structure: 'Plain form + かもしれない',
    explanation: 'Expresses a possibility the speaker considers uncertain. かもしれません is the polite form.',
    examples: [['明日は雪かもしれません。', 'It may snow tomorrow.'], ['電車が遅れるかもしれない。', 'The train might be late.'], ['彼はもう帰ったかもしれません。', 'He may have already gone home.']],
  },
  'と思う': {
    structure: 'Plain form + と思う',
    explanation: 'Reports the speaker’s thought, opinion, or prediction. A quoted noun or な-adjective normally uses だ before と.',
    examples: [['明日は晴れると思います。', 'I think it will be sunny tomorrow.'], ['この本は面白いと思います。', 'I think this book is interesting.'], ['田中さんは来ないと思います。', 'I do not think Tanaka will come.']],
  },
  'たり～たり': {
    structure: 'Verb past stem + り、Verb past stem + りする',
    explanation: 'Lists representative actions without claiming the list is complete. Tense and politeness appear on the final する.',
    examples: [['日曜日は本を読んだり、映画を見たりします。', 'On Sundays I do things like read books and watch movies.'], ['夏休みに泳いだり、山に登ったりしました。', 'During summer vacation I swam and climbed mountains, among other things.'], ['部屋を掃除したり、料理したりする予定です。', 'I plan to clean and cook, among other things.']],
  },
  '前に': {
    structure: 'Verb dictionary form / Noun + の + 前に',
    explanation: 'Places one event before another. The verb before 前に stays in dictionary form even when the whole sentence is past.',
    examples: [['寝る前に歯をみがきます。', 'I brush my teeth before sleeping.'], ['食事の前に手を洗いました。', 'I washed my hands before the meal.'], ['駅へ行く前に電話してください。', 'Please call before going to the station.']],
  },
  '後で': {
    structure: 'Verb past form / Noun + の + 後で',
    explanation: 'Places one event after another. The first action is completed before the action in the main clause.',
    examples: [['仕事が終わった後で、買い物します。', 'I will shop after work finishes.'], ['食事の後で薬を飲んでください。', 'Please take the medicine after the meal.'], ['映画を見た後で話しましょう。', 'Let us talk after watching the movie.']],
  },
};

const normalPattern = (pattern) => pattern.replace(/（[^）]*）/g, '').replace(/【[^】]*】/g, '').trim();

const enrich = (entry) => {
  const key = normalPattern(entry.pattern).replace(/^～|～$/g, '');
  const exact = curated[key];
  const structure = exact?.structure || `Plain-form phrase + ${key}`;
  const explanation = exact?.explanation || `Use ${entry.pattern} to express “${entry.meaning.replace(/~+/g, '').trim()}.” The form before it depends on whether the phrase ends in a verb, adjective, or noun.`;
  const examples = exact?.examples || [
    [`この文では「${entry.pattern}」を使います。`, `This sentence uses ${entry.pattern}.`],
    [`先生は「${entry.pattern}」の使い方を説明しました。`, `The teacher explained how to use ${entry.pattern}.`],
    [`「${entry.pattern}」を使って、文を一つ書いてください。`, `Please write one sentence using ${entry.pattern}.`],
  ];
  return {
    ...entry,
    structure,
    explanation,
    register: /ございます|なさる|くださる|いらっしゃる|お～になる/.test(entry.pattern) ? 'Formal / respectful' : 'Neutral; check the sentence ending for politeness',
    commonMistake: `Do not attach ${entry.pattern} mechanically. Check the required verb, adjective, or noun form shown in the structure first.`,
    comparison: `Compare the speaker's certainty, time relationship, and level of formality with grammar points that have a similar English translation.`,
    examples: examples.map(([japanese, english]) => ({ japanese, english })),
  };
};

const grammar = [];
for (const config of configs) {
  for (let page = 1; page <= config.pages; page += 1) {
    const url = page === 1 ? config.base : `${config.base}page/${page}/`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
    const html = await response.text();
    const chunks = html.match(/<tr class=jl-row>[\s\S]*?(?=<tr class=jl-row>|<\/table>)/g) || [];
    for (const chunk of chunks) {
      const cells = chunk.match(/<td[^>]*>[\s\S]*?(?=<td|$)/g) || [];
      if (cells.length < 4) continue;
      const order = Number(decode(cells[0]));
      const romaji = decode(cells[1]);
      const pattern = decode(cells[2]);
      const meaning = decode(cells[3]);
      if (!order || !pattern || !meaning) continue;
      grammar.push(enrich({
        id: `g-${config.level.toLowerCase()}-${String(order).padStart(3, '0')}`,
        order,
        level: config.level,
        pattern,
        romaji,
        meaning,
      }));
    }
  }
}

const counts = Object.groupBy(grammar, (item) => item.level);
if ((counts.N4?.length || 0) < 120 || (counts.N5?.length || 0) < 70) {
  throw new Error(`Incomplete grammar data: N5 ${counts.N5?.length}, N4 ${counts.N4?.length}`);
}

await writeFile(
  new URL('../src/data/grammar.generated.json', import.meta.url),
  `${JSON.stringify(grammar, null, 2)}\n`,
);

console.log(`Wrote ${counts.N5.length} N5 and ${counts.N4.length} N4 grammar points.`);
