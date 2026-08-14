import { chromium as playwrightChromium } from 'playwright';
import Chromium from '@sparticuz/chromium';
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, mkdir, stat } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import { createBrotliDecompress } from 'node:zlib';

const executablePath = '/tmp/jft-headless-chromium';
const exec = promisify(execFile);
const unpackTarBrotli = async (source, tarPath, destination) => {
  await mkdir(destination, { recursive: true });
  await pipeline(createReadStream(source), createBrotliDecompress(), createWriteStream(tarPath));
  await exec('tar', ['--no-same-owner', '-xf', tarPath, '-C', destination]);
};

if (await stat(executablePath).then((item) => item.size).catch(() => 0) < 10_000_000) {
  await pipeline(createReadStream('node_modules/@sparticuz/chromium/bin/chromium.br'), createBrotliDecompress(), createWriteStream(executablePath));
  await chmod(executablePath, 0o700);
}
if (!await stat('/tmp/libGLESv2.so').then((item) => item.size).catch(() => 0)) {
  await unpackTarBrotli('node_modules/@sparticuz/chromium/bin/swiftshader.tar.br', '/tmp/jft-swiftshader.tar', '/tmp');
}
if (!await stat('/tmp/jft-fonts/fonts.conf').then((item) => item.size).catch(() => 0)) {
  await unpackTarBrotli('node_modules/@sparticuz/chromium/bin/fonts.tar.br', '/tmp/jft-fonts.tar', '/tmp/jft-fonts');
}
process.env.FONTCONFIG_PATH = '/etc/fonts';
process.env.FONTCONFIG_FILE = '/etc/fonts/fonts.conf';
process.env.XDG_CACHE_HOME = '/tmp/jft-cache';
process.env.HOME = '/tmp';

const waitForServer = async (url) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await fetch(url).then((response) => response.ok).catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start: ${url}`);
};

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173'], {
  env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await waitForServer('http://127.0.0.1:4173/');
const browser = await playwrightChromium.launch({ executablePath, args: Chromium.args, headless: true });
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  const assertFits = async (label) => {
    const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
    if (size.width > size.viewport) throw new Error(`${label} overflows: ${size.width}px in ${size.viewport}px`);
  };

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Your name').fill('Browser Test');
  await page.getByRole('button', { name: 'Continue on this device' }).click();
  await page.getByRole('heading', { name: /Your next small wins|Daily set complete/i }).waitFor();
  if (await page.locator('.gate-backdrop').count()) throw new Error('A blocking quiz appeared after login.');
  await assertFits('Mobile dashboard');

  await page.locator('.topbar .level-switch').getByRole('button', { name: 'N3', exact: true }).click();
  if (await page.locator('.topbar .level-switch button.active').textContent() !== 'N3') throw new Error('N3 course switch did not activate.');
  await page.goto('http://127.0.0.1:4173/kanji', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Today’s \d+ kanji/i }).waitFor();
  if (await page.locator('.preview-card > span').first().textContent() !== '政') throw new Error('The user-provided N3 kanji order is not active.');
  await page.locator('.preview-card').first().click();
  await page.locator('.detail-heading .study-aids').waitFor();
  const kanjiLabels = await page.locator('.detail-heading .study-aids dt').allTextContents();
  if (!kanjiLabels.includes('Hiragana')) throw new Error('Kanji reading is not openly visible.');
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.getByRole('heading', { name: /Today’s \d+ kanji/i }).waitFor();

  await page.goto('http://127.0.0.1:4173/library?tab=vocabulary', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Search vocabulary').fill('明かり');
  await page.getByRole('link', { name: /Open detail/i }).first().click();
  await page.locator('.detail-heading h1').waitFor();
  const vocabularyAidLabels = await page.locator('.detail-heading .study-aids dt').allTextContents();
  if (!['Hiragana', 'Romaji', 'Meaning'].every((label) => vocabularyAidLabels.includes(label))) {
    throw new Error(`Vocabulary aids are incomplete: ${vocabularyAidLabels.join(', ')}`);
  }
  await assertFits('Vocabulary detail');

  const quizRegression = await page.evaluate(async () => {
    const [{ buildQuestions }, { vocabulary }] = await Promise.all([
      import('/src/components/QuizRunner.jsx'),
      import('/src/data/vocabulary.js'),
    ]);
    const readingQuestions = [];
    let visibleReading = false;
    for (const item of vocabulary.slice(0, 80)) {
      for (let seed = 0; seed < 6; seed += 1) {
        const [question] = buildQuestions('vocabulary', [item], vocabulary, `vocab-${item.id}-${seed}`, 1);
        if (question.id.endsWith('-reading')) readingQuestions.push(question.id);
        if (question.alwaysAid && question.focusAid?.hiragana) visibleReading = true;
        if (question.showOptionAids && question.options.some((option) => option.aid?.hiragana)) visibleReading = true;
      }
    }
    return { readingQuestions, visibleReading };
  });
  if (quizRegression.readingQuestions.length) throw new Error('Vocabulary reading/kanji questions still exist.');
  if (!quizRegression.visibleReading) throw new Error('Vocabulary quizzes do not keep hiragana visible.');

  await page.goto('http://127.0.0.1:4173/test?area=vocabulary', { waitUntil: 'networkidle' });
  await page.locator('.quiz-panel').waitFor();
  await page.locator('.quiz-panel .study-aids').first().waitFor();
  if (!await page.locator('.quiz-panel .study-aids').first().getByText('Hiragana', { exact: true }).isVisible()) throw new Error('Vocabulary quiz reading is hidden.');
  await assertFits('Vocabulary quiz');

  await page.goto('http://127.0.0.1:4173/custom-study', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/jft-custom-mobile.png', fullPage: false });
  await page.locator('.custom-picker > button').nth(0).click();
  await page.locator('.custom-picker > button').nth(1).click();
  await page.getByRole('button', { name: /Study selected/i }).click();
  await page.locator('.flash-front .study-aids').waitFor();
  await assertFits('Custom study card');

  await page.goto('http://127.0.0.1:4173/reading/r-n3-residence-renewal', { waitUntil: 'networkidle' });
  await page.locator('.passage-reveal').getByRole('button', { name: 'Reveal hiragana, romaji & meaning', exact: true }).click();
  await page.locator('.passage-reveal .study-aids').waitFor();
  if (await page.locator('.reading-question').count() !== 3) throw new Error('N3 exam-style reading questions are incomplete.');
  await assertFits('N3 reading detail');

  await page.goto('http://127.0.0.1:4173/profile', { waitUntil: 'networkidle' });
  await page.getByText('Overall score', { exact: true }).waitFor();
  await page.locator('.score-breakdown .score-row').first().waitFor();
  await assertFits('Profile score');
  await page.screenshot({ path: '/tmp/jft-profile-mobile.png', fullPage: false });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('http://127.0.0.1:4173/custom-study', { waitUntil: 'networkidle' });
  const desktopWidth = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (desktopWidth.width > desktopWidth.viewport) throw new Error(`Desktop custom study overflows: ${desktopWidth.width}px`);
  await page.screenshot({ path: '/tmp/jft-custom-desktop.png', fullPage: false });

  const authServer = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174'], {
    env: { ...process.env, VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'browser-check-publishable-key' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await waitForServer('http://127.0.0.1:4174/');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    const passwordInput = page.getByPlaceholder('At least 6 characters');
    if (await passwordInput.getAttribute('type') !== 'password') throw new Error('Password is not hidden initially.');
    await page.getByRole('button', { name: 'Show password' }).click();
    if (await passwordInput.getAttribute('type') !== 'text') throw new Error('Password eye did not reveal the password.');
    await page.getByRole('button', { name: 'Hide password' }).click();
    if (await passwordInput.getAttribute('type') !== 'password') throw new Error('Password eye did not hide the password again.');
  } finally {
    authServer.kill('SIGTERM');
  }

  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Browser check passed: N3 switching, custom sessions, open word readings, no login quiz, profile score, password eye, back navigation, and responsive layouts.');
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
