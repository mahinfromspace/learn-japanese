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
await assertFits('Vocabulary detail');

await page.goto('http://127.0.0.1:4173/reading/r-train-1', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Romaji' }).click();
await page.locator('.romaji-panel').waitFor();
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

await browser.close();
server.kill('SIGTERM');
if (errors.length) throw new Error(errors.join('\n'));
console.log('Browser check passed: dashboard, cards, preview, details, reading quiz, and desktop library.');
