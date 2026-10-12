import { backendSelected, backendConnection, backendCall, assertJobOrigin, validatedOrigin } from './backend';
import { AppError } from './errors';
import { sign, trustedMediaUrl } from './security';
import type { Job, TreatmentId } from '@/lib/contracts';
import type { NormalizedVideo } from './video';
import { createHash } from 'node:crypto';

export const CINEMATOGRAPHY_MODEL = 'cinema/ic-light-person-aware-v1';
export function cinematographyConnection() {
  if (backendSelected()) return backendConnection();
  const raw = process.env.CINEMA_CINEMATOGRAPHY_URL;
  if (!raw) throw new AppError(503, 'The subject-aware engine is not connected. This treatment cannot use the LTX fallback.');
  let url: URL;
  try { url = new URL(raw); } catch { throw new AppError(503, 'Subject-aware engine URL is invalid.'); }
  const token = decodeURIComponent(url.username);
  if (url.password || token.length < 32) throw new AppError(503, 'Invalid legacy subject-aware connection.');
  url.username = '';
  validatedOrigin(url.href, true);
  return { origin: url.origin, token };
}
export function cinematographyReady() {
  try { cinematographyConnection(); return true; } catch { return false; }
}
async function call(path: string, init: RequestInit = {}) {
  return backendCall(cinematographyConnection(), path, init);
}
export async function submitCinematography(video: NormalizedVideo): Promise<Job> {
  const { origin } = cinematographyConnection();
  const engine = await call('/health') as { ok?: boolean; model?: string; mode?: string; ltxFallback?: boolean };
  if (engine.ok !== true || engine.model !== CINEMATOGRAPHY_MODEL || engine.mode !== 'subject-aware' || engine.ltxFallback !== false) {
    throw new AppError(503, 'This endpoint is not the subject-aware engine. No LTX job was submitted.');
  }
  const body = new FormData();
  body.set('video', new File([new Uint8Array(video.bytes)], 'performance.mp4', { type: 'video/mp4' }));
  body.set('treatment', 'subject-aware');
  const data = await call('/v1/jobs', { method: 'POST', body }) as { id?: string };
  if (!data.id || !/^[0-9a-f]{24}$/.test(data.id)) throw new AppError(502, 'Invalid subject-aware job identifier.');
  const job: Omit<Job, 'token'> = { id: data.id, state: 'queued', createdAt: Date.now(), treatment: 'subject-aware' as TreatmentId,
    model: CINEMATOGRAPHY_MODEL, sourceUrl: '', config: { mode: 'subject-aware', backendOrigin: origin, sourceWidth: video.width,
      sourceHeight: video.height, sourceConditioning: 'per-input IC-Light reference + automatic person masks',
      sourceSha256: createHash('sha256').update(video.bytes).digest('hex'),
      physicalRelighting: false, ltxFallbackUsed: false } };
  return { ...job, token: sign({ ...job, kind: 'job' }) };
}
export async function getCinematographyJob(claims: Job, token: string): Promise<Job> {
  if (!/^[0-9a-f]{24}$/.test(claims.id)) throw new AppError(400, 'Invalid subject-aware job identifier.');
  const { origin } = cinematographyConnection();
  assertJobOrigin(claims.config, origin);
  const data = await call('/v1/jobs/' + claims.id) as { state?: string; error?: string; videoUrl?: string;
    inferenceSeconds?: number; config?: Record<string, unknown> };
  const job = { ...claims, token };
  if (data.state === 'failed') return { ...job, state: 'failed', error: data.error || 'Subject-aware processing failed.' };
  if (data.state === 'queued' || data.state === 'rendering') return { ...job, state: data.state };
  if (data.state !== 'succeeded' || !data.videoUrl) throw new AppError(502, 'Invalid subject-aware worker status.');
  const imageAi = data.config?.imageAi as { imageAiExecuted?: boolean } | undefined;
  const expectedSourceHash = claims.config.sourceSha256;
  const sourceMatches = typeof expectedSourceHash === 'string' && data.config?.sourceSha256 === expectedSourceHash;
  if (data.config?.mode !== 'subject-aware' || data.config?.ltxFallbackUsed !== false || imageAi?.imageAiExecuted !== true
      || !sourceMatches) {
    throw new AppError(502, 'The worker result does not verify a new AI reference for this input.');
  }
  const videoUrl = trustedMediaUrl(data.videoUrl, origin, claims.id);
  return { ...job, state: 'succeeded', videoUrl, config: { ...job.config, ...data.config },
    inferenceSeconds: data.inferenceSeconds, durationSeconds: Math.round((Date.now() - claims.createdAt) / 1000),
    exportToken: sign({ kind: 'export', url: videoUrl, id: claims.id, backendOrigin: origin }) };
}
