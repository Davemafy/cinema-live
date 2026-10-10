import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { normalize, readUpload } from '../src/server/video';
const run = promisify(execFile);
process.env.FFMPEG_PATH = '/usr/bin/ffmpeg';
process.env.FFPROBE_PATH = '/usr/bin/ffprobe';

test('real FFmpeg pipeline normalizes a portrait WebM, trims duration and preserves audio', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cinema-test-'));
  try {
    const input = join(dir, 'portrait.webm');
    // Generated test chart validates codecs, dimensions and duration only.
    // It is never displayed as a product result or evidence of AI quality.
    await run('/usr/bin/ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=480x854:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '6', '-c:v', 'libvpx-vp9', '-b:v', '500k', '-c:a', 'libopus', '-y', input]);
    const video = await normalize(new File([new Uint8Array(await readFile(input))], 'test.webm', { type: 'video/webm' }));
    assert.ok(video.height > video.width);
    assert.equal(video.width % 32, 0); assert.equal(video.height % 32, 0);
    assert.ok(video.duration >= 4.9 && video.duration <= 5.1);
    assert.ok(video.inputDuration > 5.5); assert.equal(video.fps, 24);
    assert.equal(video.bytes.subarray(4, 8).toString(), 'ftyp');
    const output = join(dir, 'normalized.mp4');
    await writeFile(output, video.bytes);
    const { stdout } = await run('/usr/bin/ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', output]);
    assert.ok(JSON.parse(stdout).streams.some((s: { codec_name: string }) => s.codec_name === 'aac'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('HTML, playlists and corrupted files are rejected before decoding', async () => {
  for (const content of ['<html>video</html>', '#EXTM3U\nfile:///etc/passwd', 'not a video']) {
    await assert.rejects(() => normalize(new File([content], 'fake.mp4', { type: 'video/mp4' })), /not a supported/);
  }
});
test('oversized upload is rejected from length before parsing', async () => {
  await assert.rejects(() => readUpload(new Request('https://cinema.test/api/normalize', { method: 'POST', headers: { 'content-length': '9000000' } })), /smaller than 4 MB/);
});
