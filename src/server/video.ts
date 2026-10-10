import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { CLIP_SECONDS, MAX_UPLOAD_BYTES } from '@/lib/contracts';
import { AppError } from './errors';

const run = promisify(execFile);
export type NormalizedVideo = { bytes: Buffer; width: number; height: number; duration: number; inputDuration: number; fps: number };
export async function readUpload(request: Request): Promise<File> {
  const length = Number(request.headers.get('content-length'));
  if (length > MAX_UPLOAD_BYTES + 100_000) throw new AppError(413, 'Choose a video smaller than 4 MB.');
  let form: FormData;
  try { form = await request.formData(); } catch { throw new AppError(400, 'Send a video file using the upload control.'); }
  const file = form.get('video');
  if (!(file instanceof File) || !file.size) throw new AppError(400, 'Choose a non-empty video file.');
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError(413, 'Choose a video smaller than 4 MB.');
  if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/ogg', 'application/octet-stream'].includes(file.type)) {
    throw new AppError(415, 'Use an MP4, WebM or MOV video.');
  }
  return file;
}
export async function normalize(file: File): Promise<NormalizedVideo> {
  const dir = await mkdtemp(join(tmpdir(), 'cinema-'));
  const input = join(dir, 'input');
  const output = join(dir, 'normalized.mp4');
  try {
    const inputBytes = Buffer.from(await file.arrayBuffer());
    const ebml = inputBytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    const mp4 = inputBytes.subarray(4, 8).toString() === 'ftyp';
    const ogg = inputBytes.subarray(0, 4).toString() === 'OggS';
    if (!ebml && !mp4 && !ogg) throw new AppError(415, 'This file is not a supported MP4, WebM or MOV container.');
    await writeFile(input, inputBytes);
    const probePath = process.env.FFPROBE_PATH || ffprobeStatic.path;
    const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic;
    if (!ffmpegPath) throw new AppError(503, 'Video preprocessing is not configured.');
    let probe;
    try {
      const { stdout } = await run(probePath, ['-v', 'error', '-protocol_whitelist', 'file', '-show_streams', '-show_format', '-of', 'json', input], { timeout: 10_000, maxBuffer: 1024 * 1024 });
      probe = JSON.parse(stdout);
    } catch { throw new AppError(415, 'This file could not be read as a video. Try an MP4 or WebM recording.'); }
    const stream = probe.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
    if (!stream || !stream.width || !stream.height || stream.width > 4096 || stream.height > 4096) throw new AppError(415, 'Use a video with dimensions up to 4096 pixels.');
    const inputDuration = Number(probe.format?.duration || stream.duration);
    // MediaRecorder WebM can have no duration metadata. Bound decode with -t instead.
    if (Number.isFinite(inputDuration) && inputDuration < 0.35) throw new AppError(400, 'Record at least half a second of performance.');
    try {
      await run(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-protocol_whitelist', 'file', '-i', input,
        '-t', String(CLIP_SECONDS), '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', 'scale=w=768:h=768:force_original_aspect_ratio=decrease:force_divisible_by=32,setsar=1,fps=24',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-maxrate', '2000k', '-bufsize', '4000k', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-threads', '2', '-y', output], { timeout: 40_000, maxBuffer: 1024 * 1024 });
    } catch { throw new AppError(422, 'Video preprocessing failed. Try recording again or uploading a different clip.'); }
    const { stdout } = await run(probePath, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output], { timeout: 5000 });
    const normalized = JSON.parse(stdout);
    const v = normalized.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
    const bytes = await readFile(output);
    const duration = Number(normalized.format.duration);
    if (!bytes.length || duration < 0.35 || bytes.length > MAX_UPLOAD_BYTES) throw new AppError(422, 'Unable to create a compatible short clip. Try a simpler recording.');
    console.info(JSON.stringify({ event: 'video_normalized', width: v.width, height: v.height, duration, bytes: bytes.length }));
    return { bytes, width: v.width, height: v.height, duration, inputDuration: Number.isFinite(inputDuration) ? inputDuration : duration, fps: 24 };
  } finally { await rm(dir, { recursive: true, force: true }); }
}
