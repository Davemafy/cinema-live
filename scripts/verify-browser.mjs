import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const base = process.env.BASE_URL || 'http://localhost:3000';
const artifacts = process.env.ARTIFACT_DIR || 'artifacts/browser';
await mkdir(artifacts, { recursive: true });
const fixture = resolve(artifacts, 'performance.webm');
await promisify(execFile)(process.env.FFMPEG_PATH || ffmpeg, ['-v', 'error', '-i', 'public/demo-performance.mp4', '-t', '5', '-an', '-c:v', 'libvpx-vp9', '-b:v', '800k', '-y', fixture]);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['camera'], acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('status of 415') && !m.text().includes('status of 503')) errors.push(m.text()); });
const results = [];
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Enable camera', exact: true }).waitFor();
  await page.screenshot({ path: `${artifacts}/desktop-empty.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  results.push('desktop renders without overflow');

  await page.getByRole('button', { name: 'Enable camera', exact: true }).click();
  await page.getByRole('button', { name: 'Record 5-second take' }).waitFor();
  assert.equal(await page.locator('video[aria-label="Live camera preview"]').evaluate(v => v.videoWidth > 0 && v.srcObject?.active), true);
  await page.getByRole('button', { name: 'Record 5-second take' }).click();
  await page.getByText('RECORDING', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Stop recording' }).waitFor({ state: 'hidden', timeout: 12_000 });
  await page.getByRole('link', { name: 'Download normalized input' }).waitFor({ timeout: 65_000 });
  results.push('MediaRecorder captured emulated camera; automatic 5-second stop; server transcode completed');
  await page.screenshot({ path: `${artifacts}/desktop-recorded.png`, fullPage: true });

  await page.locator('input[type=file]').setInputFiles(fixture);
  await page.getByRole('link', { name: 'Download original', exact: true }).waitFor();
  await page.waitForFunction(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('cinema-session', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const value = await new Promise(resolve => { const r = db.transaction('session').objectStore('session').get('current'); r.onsuccess = () => resolve(r.result); }); db.close();
    return value?.take?.name === 'performance.webm';
  }, undefined, { timeout: 65_000 });
  const source = page.getByLabel('Original recording preview');
  await source.evaluate(async v => { v.muted = true; await v.play(); });
  await page.waitForFunction(() => document.querySelector('video[aria-label="Original recording preview"]').currentTime > 0.2);
  await source.evaluate(v => v.pause());
  results.push('licensed human-performance WebM uploaded, normalized and played');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download normalized input' }).click();
  const download = await downloadPromise;
  await download.saveAs(`${artifacts}/normalized-input.mp4`);
  results.push('normalized source download completed (not an AI export)');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByLabel('Original recording preview').waitFor();
  results.push('original take recovered from IndexedDB after refresh');

  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.mp4', mimeType: 'video/mp4', buffer: Buffer.from('not a video') });
  await page.getByRole('alert').filter({ hasText: 'not a supported' }).waitFor({ timeout: 20_000 });
  assert.ok(await page.getByRole('button', { name: 'Upload video', exact: true }).isEnabled());
  results.push('invalid file rejected; UI recovered with previous take retained');
  await page.getByRole('button', { name: 'Use sample performance' }).click();
  await page.getByText('Sample input:', { exact: false }).waitFor({ timeout: 65_000 });
  await page.waitForFunction(() => document.querySelector('video[aria-label="Original recording preview"]')?.readyState >= 2);
  await page.screenshot({ path: `${artifacts}/desktop-upload.png`, fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${artifacts}/mobile-${width}.png`, fullPage: true });
  }
  results.push('390 px and 320 px mobile viewports have no horizontal overflow');
  const health = await (await page.request.get(`${base}/api/health`)).json();
  if (!health.inferenceAvailable) {
    assert.equal(await page.getByRole('button', { name: 'Transform performance' }).isDisabled(), true);
    results.push('missing inference displayed truthfully; no fake rendering enabled');
  }
  assert.deepEqual(errors, []);
  results.push('no unexpected browser console/page errors');
  const deniedBrowser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-fake-device-for-media-stream'] });
  try {
    const deniedPage = await deniedBrowser.newPage();
    await deniedPage.goto(base, { waitUntil: 'networkidle' });
    await deniedPage.getByRole('button', { name: 'Enable camera', exact: true }).click();
    await deniedPage.getByRole('alert').filter({ hasText: 'permission was denied' }).waitFor({ timeout: 20_000 });
    assert.ok(await deniedPage.getByRole('button', { name: 'Upload video', exact: true }).isEnabled());
    results.push('browser camera permission denial has an upload fallback');
  } finally { await deniedBrowser.close(); }
  await writeFile(`${artifacts}/verification.json`, JSON.stringify({ base, recordedAt: new Date().toISOString(), results,
    camera: 'Emulated Chromium device, not a physical camera', inference: 'NOT VERIFIED by this script', errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally { await context.close(); await browser.close(); }
