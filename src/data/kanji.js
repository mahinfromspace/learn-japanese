import { n3Kanji } from './n3Kanji.generated.js';

const raw = `
会|カイ|あう|meeting; meet|会う|あう|to meet
同|ドウ|おなじ|same; equal|同じ|おなじ|same
事|ジ|こと|matter; thing; fact|仕事|しごと|work
自|ジ、シ|みずから|oneself|自分|じぶん|oneself
社|シャ|やしろ|company; shrine|会社|かいしゃ|company
発|ハツ、ホツ|なし|departure; start; emit|出発|しゅっぱつ|departure
者|シャ|もの|person; someone|医者|いしゃ|doctor
地|チ、ジ|なし|ground; earth|地図|ちず|map
業|ギョウ|わざ|business; vocation|授業|じゅぎょう|class
方|ホウ|かた|direction; person; way|夕方|ゆうがた|evening
新|シン|あたらしい、あらた|new|新しい|あたらしい|new
場|ジョウ|ば|place; location|場所|ばしょ|place
員|イン|なし|member; employee|会社員|かいしゃいん|company employee
立|リツ|たつ|stand; rise|立つ|たつ|to stand
開|カイ|ひらく、あける|open; unfold|開ける|あける|to open
手|シュ|て|hand|上手|じょうず|skillful
力|リョク、リキ|ちから|power; strength|力|ちから|strength
問|モン|とう|question; ask|問題|もんだい|problem
代|ダイ|かわり|substitute; period|時代|じだい|era
明|メイ、ミョウ|あかるい|bright; light|明るい|あかるい|bright
動|ドウ|うごく|move; motion|動く|うごく|to move
京|キョウ、ケイ、キン|みやこ|capital|東京|とうきょう|Tokyo
目|モク、ボク|め|eye; look|目|め|eye
通|ツウ|とおる、かよう|pass through; commute|通る|とおる|to pass through
言|ゲン、ゴン|いう、こと|say; word|言う|いう|to say
理|リ|なし|reason; logic|料理|りょうり|cooking
体|タイ|からだ|body; substance|体|からだ|body
田|デン|た|rice field|田んぼ|たんぼ|rice field
主|シュ|ぬし、おも|master; main|主人|しゅじん|husband; master
題|ダイ|なし|topic; subject|宿題|しゅくだい|homework
意|イ|なし|idea; mind; thought|意味|いみ|meaning
不|フ、ブ|なし|not; non-; bad|不便|ふべん|inconvenient
作|サク、サ|つくる|make; produce|作る|つくる|to make
用|ヨウ|もちいる|use; business|用事|ようじ|errand
度|ド、タク|たび|degree; occurrence|一度|いちど|once
強|キョウ、ゴウ|つよい|strong|強い|つよい|strong
公|コウ|なし|public; official|公園|こうえん|park
持|ジ|もつ|hold; have|持つ|もつ|to hold
野|ヤ|の|field; plains|野菜|やさい|vegetables
以|イ|もって|by means of; compared with|以上|いじょう|at least; more than
思|シ|おもう|think|思う|おもう|to think
家|カ|いえ、や、うち|house; family|家族|かぞく|family
世|セイ、セ|よ|world; generation|世界|せかい|world
多|タ|おおい|many; much|多い|おおい|many
正|セイ、ショウ|ただしい、まさに|correct; justice|正しい|ただしい|correct
安|アン|やすい|safe; peaceful; cheap|安い|やすい|cheap
院|イン|なし|institution; school|病院|びょういん|hospital
心|シン|こころ|heart; mind|心配|しんぱい|worry
界|カイ|なし|world; boundary|世界|せかい|world
教|キョウ|おしえる、おそわる|teach; doctrine|教える|おしえる|to teach
文|ブン、モン|ふみ|sentence; literature|文章|ぶんしょう|writing; text
元|ゲン、ガン|もと|origin; former|元気|げんき|healthy; energetic
重|ジュウ、チョウ|おもい、かさねる|heavy; important|重い|おもい|heavy
近|キン|ちかい|near|近い|ちかい|near
考|コウ|かんがえる|consider; think|考える|かんがえる|to think
画|ガ、カク|なし|picture; stroke|映画|えいが|movie
海|カイ|うみ|sea; ocean|海|うみ|sea
売|バイ|うる|sell|売る|うる|to sell
知|チ|しる|know; wisdom|知る|しる|to know
道|ドウ|みち|road; way|道|みち|road
集|シュウ|あつめる、あつまる|gather; collect|集める|あつめる|to collect
別|ベツ|わかれる、わける|separate; different|別れる|わかれる|to part
物|ブツ、モツ|もの|thing; object|食べ物|たべもの|food
使|シ|つかう|use; messenger|使う|つかう|to use
品|ヒン|しな|goods; article|品物|しなもの|goods
計|ケイ|はかる|measure; plan|時計|とけい|clock; watch
死|シ|しぬ|death; die|死ぬ|しぬ|to die
特|トク|なし|special|特別|とくべつ|special
私|シ|わたくし、わたし|private; I; me|私|わたし|I; me
始|シ|はじめる、はじまる|begin; start|始める|はじめる|to begin
朝|チョウ|あさ|morning|朝|あさ|morning
運|ウン|はこぶ|carry; luck|運転|うんてん|driving
終|シュウ|おわる、おえる|end; finish|終わる|おわる|to finish
台|ダイ、タイ|うてな|stand; machine counter|台所|だいどころ|kitchen
広|コウ|ひろい|wide; spacious|広い|ひろい|wide
住|ジュウ、チュウ|すむ|live; reside|住む|すむ|to live
無|ム、ブ|ない|nothing; without|無理|むり|impossible
真|シン|ま、まこと|true; reality|写真|しゃしん|photograph
有|ユウ、ウ|ある|have; exist|有名|ゆうめい|famous
口|コウ、ク|くち|mouth; opening|入口|いりぐち|entrance
少|ショウ|すくない、すこし|few; little|少し|すこし|a little
町|チョウ|まち|town; block|町|まち|town
料|リョウ|なし|fee; materials|料理|りょうり|cooking
工|コウ、ク、グ|なし|craft; construction|工場|こうじょう|factory
建|ケン、コン|たてる、たつ|build|建物|たてもの|building
空|クウ|そら、から、あく、すく|sky; empty|空|そら|sky
急|キュウ|いそぐ|hurry; sudden|急ぐ|いそぐ|to hurry
止|シ|とまる、とめる、やめる|stop; halt|止まる|とまる|to stop
送|ソウ|おくる|send; escort|送る|おくる|to send
切|セツ、サイ|きる|cut; sharp|切る|きる|to cut
転|テン|ころがる、ころぶ|turn; revolve|自転車|じてんしゃ|bicycle
研|ケン|とぐ|polish; research|研究|けんきゅう|research
足|ソク|あし、たりる|foot; sufficient|足|あし|foot; leg
究|キュウ|きわめる|research; study|研究|けんきゅう|research
楽|ガク、ラク|たのしい|music; comfort; fun|楽しい|たのしい|fun
起|キ|おきる、おこす|wake; rise|起きる|おきる|to wake up
着|チャク|きる、つく|arrive; wear|着く|つく|to arrive
店|テン|みせ|store; shop|店|みせ|shop
病|ビョウ|やむ|ill; sick|病気|びょうき|illness
質|シツ、シチ|たち、ただす|quality; matter|質問|しつもん|question
待|タイ|まつ|wait; depend on|待つ|まつ|to wait
試|シ|こころみる、ためす|test; try|試験|しけん|exam
族|ゾク|なし|family; tribe|家族|かぞく|family
銀|ギン|しろがね|silver|銀行|ぎんこう|bank
早|ソウ、サッ|はやい|early; fast|早い|はやい|early
映|エイ|うつる、うつす、はえる|reflect; project|映画|えいが|movie
親|シン|おや、したしい|parent; intimate|親|おや|parent
験|ケン|なし|test; verification|試験|しけん|exam
英|エイ|なし|England; English; outstanding|英語|えいご|English language
医|イ|なし|doctor; medicine|医者|いしゃ|doctor
仕|シ|つかえる|serve; doing|仕事|しごと|work
去|キョ、コ|さる|past; leave|去年|きょねん|last year
味|ミ|あじ、あじわう|taste; flavor|意味|いみ|meaning
写|シャ|うつる、うつす|copy; photograph|写真|しゃしん|photograph
字|ジ|あざ|character; letter|漢字|かんじ|kanji
答|トウ|こたえる、こたえ|answer; solution|答える|こたえる|to answer
夜|ヤ|よ、よる|night; evening|夜|よる|night
音|オン、イン|おと、ね|sound; noise|音楽|おんがく|music
注|チュウ|そそぐ、さす|pour; concentrate|注意|ちゅうい|caution
帰|キ|かえる、かえす|return; homecoming|帰る|かえる|to return home
古|コ|ふるい|old|古い|ふるい|old
歌|カ|うた、うたう|song; sing|歌う|うたう|to sing
買|バイ|かう|buy|買う|かう|to buy
悪|アク、オ|わるい|bad; evil|悪い|わるい|bad
図|ズ、ト|はかる|map; drawing; plan|地図|ちず|map
週|シュウ|なし|week|今週|こんしゅう|this week
室|シツ|むろ|room; chamber|教室|きょうしつ|classroom
歩|ホ、ブ|あるく、あゆむ|walk; step|歩く|あるく|to walk
風|フウ、フ|かぜ、かざ|wind; style|風|かぜ|wind
紙|シ|かみ|paper|手紙|てがみ|letter
黒|コク|くろ、くろい|black|黒い|くろい|black
花|カ、ケ|はな|flower|花|はな|flower
春|シュン|はる|spring|春|はる|spring
赤|セキ、シャク|あか、あかい|red|赤い|あかい|red
青|セイ、ショウ|あお、あおい|blue; green|青い|あおい|blue
館|カン|やかた|large building; hall|図書館|としょかん|library
屋|オク|や|roof; shop; room|部屋|へや|room
色|ショク、シキ|いろ|color|色|いろ|color
走|ソウ|はしる|run|走る|はしる|to run
秋|シュウ|あき|autumn|秋|あき|autumn
夏|カ、ゲ|なつ|summer|夏|なつ|summer
習|シュウ|ならう|learn|習う|ならう|to learn
駅|エキ|なし|station|駅|えき|station
洋|ヨウ|なし|ocean; Western style|洋服|ようふく|Western-style clothes
旅|リョ|たび|trip; travel|旅行|りょこう|travel
服|フク|なし|clothing; obey|服|ふく|clothes
夕|なし|ゆう|evening|夕方|ゆうがた|evening
借|シャク|かりる|borrow; rent|借りる|かりる|to borrow
曜|ヨウ|なし|weekday|曜日|ようび|day of the week
飲|イン|のむ|drink|飲む|のむ|to drink
肉|ニク|しし|meat|肉|にく|meat
貸|タイ|かす、かし|lend|貸す|かす|to lend
堂|ドウ|なし|hall; public chamber|食堂|しょくどう|dining hall
鳥|チョウ|とり|bird; chicken|鳥|とり|bird
飯|ハン|めし|meal; cooked rice|ご飯|ごはん|meal; rice
勉|ベン|つとめる|effort; exertion|勉強|べんきょう|study
冬|トウ|ふゆ|winter|冬|ふゆ|winter
昼|チュウ|ひる|daytime; noon|昼ご飯|ひるごはん|lunch
茶|チャ、サ|なし|tea|お茶|おちゃ|tea
弟|テイ、ダイ、デ|おとうと|younger brother|弟|おとうと|younger brother
牛|ギュウ|うし|cow|牛乳|ぎゅうにゅう|milk
魚|ギョ|うお、さかな|fish|魚|さかな|fish
兄|キョウ、ケイ|あに|elder brother|兄|あに|elder brother
犬|ケン|いぬ|dog|犬|いぬ|dog
妹|マイ|いもうと|younger sister|妹|いもうと|younger sister
姉|シ|あね|elder sister|姉|あね|elder sister
漢|カン|なし|China; Chinese|漢字|かんじ|kanji
`

const n4Kanji = raw.trim().split('\n').map((line, index) => {
  const [character, onyomi, kunyomi, meaning, word, wordReading, wordMeaning] = line.split('|')
  return {
    id: `k-${String(index + 1).padStart(3, '0')}`,
    slug: `${index + 1}-${character}`,
    character,
    onyomi,
    kunyomi,
    meaning,
    word,
    wordReading,
    wordMeaning,
    level: 'N4',
    order: index + 1,
  }
})

export const kanji = [...n4Kanji, ...n3Kanji];

export const kanjiList = kanji
export const kanjiById = Object.fromEntries(kanji.map((item) => [item.id, item]))
export const kanjiByCharacter = Object.fromEntries(kanji.map((item) => [item.character, item]))

export const findKanji = (character, level) => (
  kanji.find((item) => item.character === character && item.level === level)
  || kanji.find((item) => item.character === character)
);
