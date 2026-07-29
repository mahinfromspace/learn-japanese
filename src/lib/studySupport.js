import { toHiragana, toRomaji } from 'wanakana';
import { studySupport } from '../data/studySupport.generated';

const KANJI = /[\u3400-\u9fff々〆ヵヶ]/u;
const KANA = /[ぁ-んァ-ヶ]/u;

export const containsKanji = (value = '') => KANJI.test(value);

export const normalizeToHiragana = (value = '') => toHiragana(String(value), { passRomaji: true });

export const resolveStudySupport = ({
  japanese = '',
  hiragana = '',
  romaji = '',
  meaning,
} = {}) => {
  const generated = studySupport[String(japanese)] || [];
  const kanaFallback = !containsKanji(String(japanese)) && KANA.test(String(japanese))
    ? normalizeToHiragana(japanese)
    : '';
  const resolvedHiragana = normalizeToHiragana(hiragana || generated[0] || kanaFallback);
  const resolvedRomaji = String(romaji || generated[1] || (
    resolvedHiragana ? toRomaji(resolvedHiragana) : ''
  )).trim();

  return {
    hiragana: resolvedHiragana.trim(),
    romaji: resolvedRomaji,
    meaning: String(meaning == null ? generated[2] || '' : meaning).trim(),
  };
};

export const kanjiReadingSupport = (item) => {
  const on = item.onyomi && item.onyomi !== 'なし' ? normalizeToHiragana(item.onyomi) : '—';
  const kun = item.kunyomi && item.kunyomi !== 'なし' ? normalizeToHiragana(item.kunyomi) : '—';
  return {
    hiragana: `On: ${on} · Kun: ${kun}`,
    romaji: `On: ${on === '—' ? '—' : toRomaji(on)} · Kun: ${kun === '—' ? '—' : toRomaji(kun)}`,
    meaning: item.meaning,
  };
};
