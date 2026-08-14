import { readingRomaji } from './readingRomaji.generated.js';
import { additionalReadings } from './additionalReadings.js';
import { n3Readings } from './n3Readings.js';

const names = [
  ['田中さん', 'Tanaka'], ['山田さん', 'Yamada'], ['木村さん', 'Kimura'], ['佐藤さん', 'Sato'],
  ['高橋さん', 'Takahashi'], ['中村さん', 'Nakamura'], ['小林さん', 'Kobayashi'], ['森さん', 'Mori'],
];

const places = [
  ['京都', 'Kyoto'], ['大阪', 'Osaka'], ['東京', 'Tokyo'], ['横浜', 'Yokohama'],
  ['神戸', 'Kobe'], ['奈良', 'Nara'], ['名古屋', 'Nagoya'], ['広島', 'Hiroshima'],
];

const times = [
  ['九時', '9:00'], ['九時半', '9:30'], ['十時', '10:00'], ['十一時', '11:00'],
  ['一時', '1:00'], ['二時', '2:00'], ['三時半', '3:30'], ['五時', '5:00'],
];

const makeQuestion = (prompt, options, answer, explanation) => ({
  prompt,
  options,
  answer,
  explanation,
});

const workPassages = names.map(([name, englishName], index) => {
  const [time, englishTime] = times[index];
  const tomorrow = index % 2 === 0 ? '明日' : '土曜日';
  const reason = index % 2 === 0 ? '病院へ行く' : '学校の試験を受ける';
  const englishReason = index % 2 === 0 ? 'go to the hospital' : 'take a school exam';
  return {
    id: `r-work-${index + 1}`,
    title: `${name}のアルバイト`,
    type: 'Email / work',
    difficulty: index < 3 ? 'Easy' : 'Standard',
    minutes: 2,
    japanese: `${name}へ\n${tomorrow}のアルバイトは${time}からですが、私は${reason}ので、少し遅れます。その三十分後に店に着く予定です。店長にはもう連絡しました。先に店を開けておいてください。`,
    translation: `To ${englishName}: The part-time shift ${tomorrow === '明日' ? 'tomorrow' : 'on Saturday'} starts at ${englishTime}, but I will be a little late because I have to ${englishReason}. I plan to reach the shop about thirty minutes later. I have already contacted the manager. Please open the shop first.`,
    grammar: ['ので', '予定', 'ておく', 'てください'],
    vocabulary: ['アルバイト', '遅れる', '店長', '連絡'],
    questions: [
      makeQuestion(
        '書いた人は何を頼んでいますか。',
        ['先に店を開けること', '病院へ一緒に行くこと', '店長に初めて電話すること', 'アルバイトを休むこと'],
        0,
        'The final sentence asks the reader to open the shop before the writer arrives.',
      ),
      makeQuestion(
        '書いた人はどうして遅れますか。',
        [`${reason}から`, '電車が止まったから', '店がまだ開いていないから', '時間を間違えたから'],
        0,
        `The reason appears before ので: the writer must ${englishReason}.`,
      ),
    ],
  };
});

const trainPassages = places.map(([place, englishPlace], index) => {
  const [time, englishTime] = times[(index + 2) % times.length];
  const platform = (index % 4) + 3;
  return {
    id: `r-train-${index + 1}`,
    title: `${place}行きのお知らせ`,
    type: 'Station notice',
    difficulty: index < 2 ? 'Easy' : 'Standard',
    minutes: 2,
    japanese: `駅からのお知らせ\n${time}発、${place}行きの急行は、強い雨のため十五分遅れています。普通電車は時間どおりに二番線を出ます。お急ぎの方は、${platform}番線ではなく二番線の電車をご利用ください。`,
    translation: `Station notice: The ${englishTime} express for ${englishPlace} is fifteen minutes late because of heavy rain. The local train will leave platform 2 on time. Passengers in a hurry should use the train on platform 2, not platform ${platform}.`,
    grammar: ['ため', 'どおりに', 'ではなく', 'てください'],
    vocabulary: ['急行', '遅れる', '利用', '強い'],
    questions: [
      makeQuestion(
        '急いでいる人はどうすればいいですか。',
        ['二番線の普通電車に乗る', `${platform}番線で急行を待つ`, '駅員に切符を返す', '十五分後に駅へ来る'],
        0,
        'The notice directly tells passengers in a hurry to use the local train on platform 2.',
      ),
      makeQuestion(
        '急行が遅れている理由は何ですか。',
        ['強い雨', '事故', '工事', '人が多いこと'],
        0,
        '強い雨のため gives the cause of the delay.',
      ),
    ],
  };
});

const invitationPassages = names.map(([name, englishName], index) => {
  const [place, englishPlace] = places[(index + 3) % places.length];
  const [time, englishTime] = times[(index + 4) % times.length];
  const activity = index % 2 === 0 ? '美術館を見た後で、近くの店で昼ご飯を食べ' : '公園で花見をしてから、駅前で買い物をし';
  const englishActivity = index % 2 === 0 ? 'visit the art museum and then eat lunch nearby' : 'view the blossoms in the park and then shop near the station';
  return {
    id: `r-invite-${index + 1}`,
    title: `${name}からのメッセージ`,
    type: 'Message / invitation',
    difficulty: 'Easy',
    minutes: 2,
    japanese: `${name}です。来週の日曜日、いっしょに${place}へ行きませんか。${activity}たいと思っています。${time}に駅の北口で会いましょう。行けるかどうか、金曜日までに教えてください。`,
    translation: `This is ${englishName}. Would you like to go to ${englishPlace} together next Sunday? I am thinking of going there to ${englishActivity}. Let us meet at the station's north exit at ${englishTime}. Please tell me by Friday whether you can go.`,
    grammar: ['ませんか', 'た後で', 'てから', 'たいと思う', 'かどうか', 'までに'],
    vocabulary: ['美術館', '花見', '北口', '連絡'],
    questions: [
      makeQuestion('返事はいつまでにしなければなりませんか。', ['金曜日まで', '日曜日まで', '今日中', '駅に着いた後'], 0, 'The final sentence sets Friday as the response deadline.'),
      makeQuestion('二人はどこで会いますか。', ['駅の北口', '美術館の中', '公園の入口', '近くの店'], 0, 'The message says to meet at the north exit of the station.'),
    ],
  };
});

const weatherPassages = places.map(([place, englishPlace], index) => {
  const temperature = 12 + index * 2;
  const plan = index % 2 === 0 ? '海へ行く' : '山を歩く';
  const englishPlan = index % 2 === 0 ? 'go to the sea' : 'walk in the mountains';
  return {
    id: `r-weather-${index + 1}`,
    title: `${place}の週末`,
    type: 'Forecast / plans',
    difficulty: 'Standard',
    minutes: 3,
    japanese: `${place}は土曜日の朝から雨が降るでしょう。昼の気温は${temperature}度ぐらいで、風も強くなりそうです。日曜日は晴れますが、朝は寒いので、${plan}人は暖かい服を持って行ったほうがいいでしょう。`,
    translation: `In ${englishPlace}, rain is expected from Saturday morning. The daytime temperature will be around ${temperature} degrees, and the wind also looks likely to grow strong. Sunday will be sunny, but mornings are cold, so people who ${englishPlan} should take warm clothes.`,
    grammar: ['でしょう', 'そうだ', 'ので', 'たほうがいい'],
    vocabulary: ['天気予報', '気温', '暖かい', '強い'],
    questions: [
      makeQuestion('日曜日に何を持って行ったほうがいいですか。', ['暖かい服', '大きい傘だけ', '水着', '新しい靴だけ'], 0, 'The final clause recommends taking warm clothes because Sunday morning will be cold.'),
      makeQuestion('土曜日の天気はどうなりそうですか。', ['雨で風が強い', '一日中晴れる', '雪がたくさん降る', '暑くて風がない'], 0, 'The passage predicts rain and strengthening wind on Saturday.'),
    ],
  };
});

const schoolPassages = names.map(([name, englishName], index) => {
  const room = 201 + index;
  const [time, englishTime] = times[(index + 1) % times.length];
  return {
    id: `r-school-${index + 1}`,
    title: `日本語クラスの変更`,
    type: 'School notice',
    difficulty: 'Standard',
    minutes: 3,
    japanese: `${name}先生の日本語クラスのみなさんへ\n明日の授業は、いつもの三〇一教室ではなく、${room}教室で行います。時間は${time}からです。教科書のほかに、先週書いた作文も持って来てください。作文をまだ出していない人は、授業が始まる前に先生の机に置いてください。`,
    translation: `To everyone in ${englishName}'s Japanese class: Tomorrow's class will be held in room ${room}, not the usual room 301. It starts at ${englishTime}. In addition to the textbook, please bring the composition you wrote last week. Anyone who has not submitted it should put it on the teacher's desk before class starts.`,
    grammar: ['ではなく', 'ほかに', 'てください', '前に', 'ていない'],
    vocabulary: ['授業', '教室', '作文', '教科書'],
    questions: [
      makeQuestion('明日の授業はどこでありますか。', [`${room}教室`, '三〇一教室', '先生の研究室', '図書館'], 0, `The notice changes the location from room 301 to room ${room}.`),
      makeQuestion('作文を出していない人はどうしますか。', ['授業の前に先生の机に置く', '来週持って来る', '家で読み直す', '友達に渡す'], 0, 'The final sentence gives this instruction.'),
    ],
  };
});

const shoppingPassages = Array.from({ length: 8 }, (_, index) => {
  const discount = 10 + index * 5;
  const floor = (index % 3) + 1;
  const item = index % 2 === 0 ? '夏の服' : '旅行用のかばん';
  const englishItem = index % 2 === 0 ? 'summer clothes' : 'travel bags';
  return {
    id: `r-shop-${index + 1}`,
    title: `駅前デパートのセール`,
    type: 'Advertisement / information retrieval',
    difficulty: index < 3 ? 'Easy' : 'Challenge',
    minutes: 3,
    japanese: `駅前デパート 夏のセール\n今週の金曜日から日曜日まで、${floor}階の${item}が${discount}％安くなります。会員カードを持っている方は、土曜日だけさらに五％安く買えます。ただし、午後八時以降に買った食料品とセール品は、返品することができません。`,
    translation: `Station-front department store summer sale: From Friday through Sunday, ${englishItem} on floor ${floor} are ${discount}% off. Customers with a membership card can get an additional 5% off on Saturday only. However, food and sale items purchased after 8 p.m. cannot be returned.`,
    grammar: ['から～まで', 'ている', 'さらに', 'ただし', 'ことができない'],
    vocabulary: ['売り場', '会員', '食料品', '返品'],
    questions: [
      makeQuestion('会員カードがある人が一番安く買えるのはいつですか。', ['土曜日', '金曜日', '日曜日', '月曜日'], 0, 'The regular sale runs three days, but the extra member discount applies only Saturday.'),
      makeQuestion('返品できないものはどれですか。', ['午後八時半に買ったセール品', '午前中に買った普通のかばん', '木曜日に買った服', '会員カードで買った本'], 0, 'Sale items bought after 8 p.m. cannot be returned.'),
    ],
  };
});

const clinicPassages = names.map(([name, englishName], index) => {
  const [time, englishTime] = times[(index + 5) % times.length];
  const symptom = index % 2 === 0 ? '熱があって、のども痛い' : '昨日からおなかが痛い';
  const englishSymptom = index % 2 === 0 ? 'a fever and a sore throat' : 'a stomachache since yesterday';
  return {
    id: `r-clinic-${index + 1}`,
    title: `${name}の病院予約`,
    type: 'Conversation / clinic',
    difficulty: 'Standard',
    minutes: 3,
    japanese: `受付：はい、中央病院です。\n${name}：${symptom}ので、今日先生に見ていただきたいんですが。\n受付：では、${time}はいかがですか。保険証を持って、予約時間の十分前までに来てください。\n${name}：分かりました。`,
    translation: `Reception: Central Hospital. ${englishName}: I have ${englishSymptom}, so I would like the doctor to see me today. Reception: Then how about ${englishTime}? Bring your insurance card and arrive at least ten minutes before the appointment. ${englishName}: Understood.`,
    grammar: ['ので', 'ていただきたい', 'んですが', 'いかが', 'までに'],
    vocabulary: ['受付', '予約', '保険証', '具合'],
    questions: [
      makeQuestion('病院へ何を持って行きますか。', ['保険証', '教科書', '会員カード', '旅行の切符'], 0, 'The receptionist explicitly asks the patient to bring an insurance card.'),
      makeQuestion('何時までに病院へ行きますか。', [`${time}の十分前`, `${time}の十分後`, '昼休みの後', '明日の朝'], 0, 'The patient must arrive ten minutes before the appointment time.'),
    ],
  };
});

const lostPassages = Array.from({ length: 8 }, (_, index) => {
  const object = index % 2 === 0 ? '黒い財布' : '青い手袋';
  const englishObject = index % 2 === 0 ? 'black wallet' : 'blue gloves';
  const location = index % 3 === 0 ? '図書館' : index % 3 === 1 ? '駅の待合室' : '大学の食堂';
  const englishLocation = index % 3 === 0 ? 'library' : index % 3 === 1 ? 'station waiting room' : 'university cafeteria';
  return {
    id: `r-lost-${index + 1}`,
    title: `忘れ物のお知らせ`,
    type: 'Public notice',
    difficulty: 'Easy',
    minutes: 2,
    japanese: `忘れ物のお知らせ\n昨日、${location}で${object}が見つかりました。中には名前が書いてある紙が入っています。心当たりのある方は、一階の受付で学生証か運転免許証を見せてください。電話だけではお返しできません。`,
    translation: `Lost property notice: Yesterday, ${englishObject} was found in the ${englishLocation}. Inside is a piece of paper with a name written on it. Anyone who thinks it may be theirs should show a student ID or driver's license at the first-floor reception desk. It cannot be returned based only on a phone call.`,
    grammar: ['てある', '心当たり', 'か', 'だけでは', 'てください'],
    vocabulary: ['忘れ物', '見つかる', '受付', '運転免許証'],
    questions: [
      makeQuestion('忘れ物を受け取るために何が必要ですか。', ['学生証か運転免許証', '電話番号だけ', '新しい財布', '図書館の本'], 0, 'The notice requires one of two forms of identification.'),
      makeQuestion('忘れ物はどこで受け取りますか。', ['一階の受付', location, '駅の交番', '学校の教室'], 0, 'The owner must go to the first-floor reception desk.'),
    ],
  };
});

const rotateAnswers = (question, seed) => {
  const shift = seed % question.options.length;
  if (!shift) return question;
  return {
    ...question,
    options: [...question.options.slice(shift), ...question.options.slice(0, shift)],
    answer: (question.answer - shift + question.options.length) % question.options.length,
  };
};

const n4Readings = [
  ...workPassages,
  ...trainPassages,
  ...invitationPassages,
  ...weatherPassages,
  ...schoolPassages,
  ...shoppingPassages,
  ...clinicPassages,
  ...lostPassages,
  ...additionalReadings,
].map((passage, index) => ({
  ...passage,
  questions: passage.questions.map((question, questionIndex) => rotateAnswers(question, index + questionIndex)),
  order: index + 1,
  level: 'N4',
  romaji: readingRomaji[passage.id] || '',
}));

export const readings = [
  ...n4Readings,
  ...n3Readings.map((passage, index) => ({
    ...passage,
    questions: passage.questions.map((question, questionIndex) => rotateAnswers(question, index + questionIndex + 97)),
    order: index + 1,
    level: 'N3',
    romaji: readingRomaji[passage.id] || passage.romaji || '',
  })),
];

export const readingById = Object.fromEntries(readings.map((passage) => [passage.id, passage]));
