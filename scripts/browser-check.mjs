import { chromium as playwrightChromium } from 'playwright';
import Chromium from '@sparticuz/chromium';
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, mkdir, stat } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import { createBrotliDecompress } from 'node:zlib';

const executablePath = '/tmp/n4-headless-chromium';
const exec = promisify(execFile);
const unpackTarBrotli = async (source, tarPath, destination) => {
  await mkdir(destination, { recursive: true });
  await pipeline(createReadStream(source), createBrotliDecompress(), createWriteStream(tarPath));
  await exec('tar', ['--no-same-owner', '-xf', tarPath, '-C', destination]);
};
const currentSize = await stat(executablePath).then((item) => item.size).catch(() => 0);
if (currentSize < 10_000_000) {
  await pipeline(
    createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'),
    createBrotliDecompress(),
    createWriteStream(executablePath),
  );
  await chmod(executablePath, 0o700);
}
const glesSize = await stat('/tmp/libGLESv2.so').then((item) => item.size).catch(() => 0);
if (!glesSize) await unpackTarBrotli('node_modules/@sparticuz/chromium/bin/swiftshader.tar.br', '/tmp/n4-swiftshader.tar', '/tmp');
const fontsReady = await stat('/tmp/n4-fonts/fonts.conf').then((item) => item.size).catch(() => 0);
if (!fontsReady) await unpackTarBrotli('node_modules/@sparticuz/chromium/bin/fonts.tar.br', '/tmp/n4-fonts.tar', '/tmp/n4-fonts');
process.env.FONTCONFIG_PATH = '/etc/fonts';
process.env.FONTCONFIG_FILE = '/etc/fonts/fonts.conf';
process.env.XDG_CACHE_HOME = '/tmp/n4-cache';
process.env.HOME = '/tmp';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (let attempt = 0; attempt < 40; attempt += 1) {
  const ready = await fetch('http://127.0.0.1:4173/').then((response) => response.ok).catch(() => false);
  if (ready) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const browser = await playwrightChromium.launch({
  executablePath,
  args: Chromium.args,
  headless: true,
});

const errors = [];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

const assertFits = async (label) => {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (dimensions.width > dimensions.viewport) throw new Error(`${label} overflows: ${dimensions.width}px in ${dimensions.viewport}px`);
};

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
if (await page.getByRole('heading', { name: 'Start studying' }).isVisible().catch(() => false)) {
  await page.getByPlaceholder('Your name').fill('Browser Test');
  await page.getByRole('button', { name: 'Continue on this device' }).click();
}
await page.getByRole('heading', { name: /Your next small wins/i }).waitFor();
await assertFits('Mobile dashboard');
await page.screenshot({ path: '/tmp/n4-mobile-dashboard.png', fullPage: true });

await page.goto('http://127.0.0.1:4173/kanji', { waitUntil: 'networkidle' });
const firstTodayCharacter = await page.locator('.preview-card > span').first().textContent();
await page.locator('.preview-card').nth(1).click();
await page.getByRole('button', { name: /Back/i }).click();
await page.getByRole('heading', { name: 'Today’s five.' }).waitFor();
const returnedCharacter = await page.locator('.preview-card > span').first().textContent();
if (firstTodayCharacter !== returnedCharacter) throw new Error('Kanji detail Back did not return to the same daily five.');
await page.getByRole('button', { name: /Study today’s five/i }).click();
await page.locator('.flashcard').click();
await page.locator('.flashcard.is-flipped').waitFor();
await page.waitForTimeout(600);
await assertFits('Mobile flashcard');
await page.screenshot({ path: '/tmp/n4-mobile-card.png', fullPage: false });
await page.locator('.flash-back .kanji-inline').first().click();
await page.locator('.quick-sheet').waitFor();
await page.screenshot({ path: '/tmp/n4-mobile-preview.png', fullPage: false });
await page.getByRole('button', { name: 'Close preview' }).click();

await page.goto('http://127.0.0.1:4173/library?tab=vocabulary', { waitUntil: 'networkidle' });
await page.getByPlaceholder('Search vocabulary').fill('安心');
await page.getByRole('link', { name: /Open detail/i }).first().click();
await page.waitForURL(/\/vocabulary\/v-/);
await page.locator('.detail-heading h1').waitFor();
await page.locator('.detail-heading').getByRole('button', { name: 'Reveal reading & meaning' }).click();
await page.locator('.detail-heading .study-aids').waitFor();
const vocabularyAidLabels = await page.locator('.detail-heading .study-aids dt').allTextContents();
if (!['Hiragana', 'Romaji', 'Meaning'].every((label) => vocabularyAidLabels.includes(label))) {
  throw new Error(`Vocabulary reveal is incomplete: ${vocabularyAidLabels.join(', ')}`);
}
await assertFits('Vocabulary detail');

const quizRegression = await page.evaluate(async () => {
  const [{ buildQuestions }, { vocabulary }, { kanji }] = await Promise.all([
    import('/src/components/QuizRunner.jsx'),
    import('/src/data/vocabulary.js'),
    import('/src/data/kanji.js'),
  ]);
  const containsKanji = (value) => /[\u3400-\u9fff々〆ヵヶ]/u.test(value);
  const kanaOnly = vocabulary.filter((item) => !containsKanji(item.word));
  const trivial = [];
  for (const item of kanaOnly) {
    for (let seed = 0; seed < 12; seed += 1) {
      const [question] = buildQuestions('vocabulary', [item], vocabulary, `kana-${item.id}-${seed}`, 1);
      if (question.id.endsWith('-reading')) trivial.push(item.word);
    }
  }
  let kanjiWordReading = null;
  for (let seed = 0; seed < 30 && !kanjiWordReading; seed += 1) {
    const [question] = buildQuestions('kanji', [kanji[0]], kanji, `kanji-word-${seed}`, 1);
    if (question.id.endsWith('-reading')) kanjiWordReading = question;
  }
  return {
    trivial: [...new Set(trivial)],
    kanjiWordReading: kanjiWordReading && {
      prompt: kanjiWordReading.prompt,
      focus: kanjiWordReading.focus,
      answer: kanjiWordReading.answer,
    },
  };
});
if (quizRegression.trivial.length) throw new Error(`Kana-only reading questions remain: ${quizRegression.trivial.join(', ')}`);
if (!quizRegression.kanjiWordReading?.focus || !/[\u3400-\u9fff々〆ヵヶ]/u.test(quizRegression.kanjiWordReading.focus)) {
  throw new Error('Kanji reading questions do not use a kanji word.');
}
if (!/^[ぁ-んー・]+$/u.test(quizRegression.kanjiWordReading.answer)) {
  throw new Error(`Kanji reading answer is not hiragana: ${quizRegression.kanjiWordReading.answer}`);
}

await page.goto('http://127.0.0.1:4173/test?area=vocabulary', { waitUntil: 'networkidle' });
await page.locator('.quiz-panel').waitFor();
await page.locator('.quiz-panel .quiz-study-toggle').click();
const quizAidLabels = await page.locator('.quiz-panel .study-aids b, .quiz-panel .study-aids dt').allTextContents();
if (!['Hiragana', 'Romaji', 'Meaning'].every((label) => quizAidLabels.includes(label))) {
  throw new Error(`Vocabulary quiz reveal is incomplete: ${quizAidLabels.join(', ')}`);
}
await assertFits('Vocabulary quiz reveal');
await page.screenshot({ path: '/tmp/n4-mobile-vocabulary-quiz.png', fullPage: false });

await page.goto('http://127.0.0.1:4173/reading/r-train-1', { waitUntil: 'networkidle' });
await page.locator('.passage-reveal').getByRole('button', { name: 'Reveal hiragana, romaji & meaning', exact: true }).click();
await page.locator('.passage-reveal .study-aids').waitFor();
const passageAidLabels = await page.locator('.passage-reveal .study-aids dt').allTextContents();
if (!['Hiragana', 'Romaji', 'Meaning'].every((label) => passageAidLabels.includes(label))) {
  throw new Error(`Passage reveal is incomplete: ${passageAidLabels.join(', ')}`);
}
await page.screenshot({ path: '/tmp/n4-mobile-reading-reveal.png', fullPage: false });
await page.locator('.reading-question').first().getByRole('button', { name: 'Reveal hiragana, romaji & meaning' }).click();
const questionAidLabels = await page.locator('.reading-question').first().locator('.reading-question-aids dt').allTextContents();
if (!['Hiragana', 'Romaji', 'Meaning'].every((label) => questionAidLabels.includes(label))) {
  throw new Error(`Reading question reveal is incomplete: ${questionAidLabels.join(', ')}`);
}
await page.locator('.reading-question').nth(0).locator('.quiz-options > button').first().click();
await page.locator('.reading-question').nth(1).locator('.quiz-options > button').first().click();
await page.getByRole('button', { name: 'Check answers' }).click();
await page.getByText(/Excellent comprehension|Read once more/).waitFor();
await assertFits('Reading detail');

const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 } });
desktop.on('pageerror', (error) => errors.push(`desktop page: ${error.message}`));
await desktop.goto('http://127.0.0.1:4173/library?tab=grammar', { waitUntil: 'networkidle' });
const desktopWidth = await desktop.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
if (desktopWidth.width > desktopWidth.viewport) throw new Error(`Desktop library overflows: ${desktopWidth.width}px`);
await desktop.screenshot({ path: '/tmp/n4-desktop-library.png', fullPage: false });

const authServer = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174'], {
  env: {
    ...process.env,
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'browser-check-publishable-key',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (let attempt = 0; attempt < 40; attempt += 1) {
  const ready = await fetch('http://127.0.0.1:4174/').then((response) => response.ok).catch(() => false);
  if (ready) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const authContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const authPage = await authContext.newPage();
authPage.on('pageerror', (error) => errors.push(`auth page: ${error.message}`));
await authPage.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
await authPage.getByRole('heading', { name: 'Welcome back' }).waitFor();
const passwordInput = authPage.getByPlaceholder('At least 6 characters');
if (await passwordInput.getAttribute('type') !== 'password') throw new Error('Password is not hidden initially.');
await authPage.getByRole('button', { name: 'Show password' }).click();
if (await passwordInput.getAttribute('type') !== 'text') throw new Error('Password eye did not reveal the password.');
await authPage.getByRole('button', { name: 'Hide password' }).click();
if (await passwordInput.getAttribute('type') !== 'password') throw new Error('Password eye did not hide the password again.');
authServer.kill('SIGTERM');

await browser.close();
server.kill('SIGTERM');
if (errors.length) throw new Error(errors.join('\n'));
console.log('Browser check passed: reveals, non-trivial quizzes, password eye, existing navigation, and responsive layouts.');
