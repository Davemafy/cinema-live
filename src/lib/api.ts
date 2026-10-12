import type { Health, Job } from './contracts';
import { MAX_UPLOAD_BYTES } from './contracts';
import type { Take } from './storage';
async function check(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${response.status}). Please retry.`);
  }
  return response;
}
export async function health(): Promise<Health> {
  return (await check(await fetch('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(15_000) }))).json();
}
export async function prepareVideo(blob: Blob, name: string): Promise<Take> {
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('This video exceeds 4 MB. Export a shorter or lower-bitrate clip.');
  const form = new FormData(); form.set('video', blob, name);
  const response = await check(await fetch('/api/normalize', { method: 'POST', body: form, signal: AbortSignal.timeout(65_000) }));
  return { original: blob, normalized: await response.blob(), name,
    duration: Number(response.headers.get('x-video-duration')),
    width: Number(response.headers.get('x-video-width')), height: Number(response.headers.get('x-video-height')),
    trimmed: Number(response.headers.get('x-input-duration')) > 5.1 };
}
export async function createJob(take: Take, treatment: string, code: string): Promise<Job> {
  const form = new FormData(); form.set('video', treatment === 'subject-aware' ? take.original : take.normalized, treatment === 'subject-aware' ? take.name : 'performance.mp4');
  return (await check(await fetch(`/api/jobs?treatment=${encodeURIComponent(treatment)}`, {
    method: 'POST', body: form, headers: { 'x-cinema-render-code': code }, signal: AbortSignal.timeout(125_000),
  }))).json();
}
export async function jobStatus(token: string): Promise<Job> {
  return (await check(await fetch('/api/jobs/status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(35_000) }))).json();
}
