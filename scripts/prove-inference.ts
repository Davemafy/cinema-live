import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { normalize } from '../src/server/video';
import { requireInference, submitVideo, getJob } from '../src/server/inference';
import { trustedMediaUrl } from '../src/server/security';

try {
  const env = await readFile('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch { /* Production environment variables can be supplied directly. */ }
requireInference();
const [file, destination] = process.argv.slice(2);
if (!file || !destination) throw new Error('Usage: prove-inference.ts source.mp4 output-directory');
await mkdir(destination, { recursive: true });
const started = Date.now();
const input = await normalize(new File([new Uint8Array(await readFile(file))], 'performance.mp4', { type: 'video/mp4' }));
await writeFile(join(destination, 'source.mp4'), input.bytes);
let job = await submitVideo(input, 'noir');
const token = job.token;
await writeFile(join(destination, 'job-capability.json'), JSON.stringify({ token }), { mode: 0o600 });
while (job.state !== 'succeeded' && job.state !== 'failed') {
  if (Date.now() - started > 20 * 60_000) throw new Error('Polling paused after 20 minutes. Provider job may still run. Recover using saved capability; do not resubmit automatically.');
  await new Promise(resolve => setTimeout(resolve, 4000));
  job = await getJob(token);
  console.log(JSON.stringify({ id: job.id, state: job.state, elapsedSeconds: Math.round((Date.now() - started) / 1000) }));
}
if (job.state === 'failed') throw new Error(job.error);
const response = await fetch(trustedMediaUrl(job.videoUrl!), { redirect: 'error', signal: AbortSignal.timeout(90_000) });
if (!response.ok) throw new Error(`Output download failed (${response.status})`);
const output = join(destination, 'result.mp4');
await writeFile(output, Buffer.from(await response.arrayBuffer()));
const run = promisify(execFile);
const { stdout } = await run(process.env.FFPROBE_PATH || '/usr/bin/ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output]);
const probe = JSON.parse(stdout);
if (!probe.streams.some((s: { codec_type: string }) => s.codec_type === 'video')) throw new Error('Output contains no video stream');
await run(process.env.FFMPEG_PATH || '/usr/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', output, '-f', 'null', '-']);
await run(process.env.FFMPEG_PATH || '/usr/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', output, '-vf', 'fps=1,scale=320:-1,tile=5x1', '-frames:v', '1', '-y', join(destination, 'result-contact-sheet.jpg')]);
const { token: _token, exportToken: _exportToken, sourceUrl: _sourceUrl, videoUrl: _videoUrl, ...metadata } = job;
await writeFile(join(destination, 'verification.json'), JSON.stringify({ ...metadata, completedAt: new Date().toISOString(), actualElapsedSeconds: (Date.now() - started) / 1000, decoded: true, probe, performancePreservation: 'REQUIRES VISUAL REVIEW' }, null, 2));
console.log('Real output downloaded and decoded. Inspect the film for motion/identity fidelity, then verify the deployed browser journey.');
