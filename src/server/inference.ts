import { KAGGLE_MODEL, kaggleSelected, kaggleReady, submitKaggle, getKaggleJob } from './kaggle';
import { fal } from '@fal-ai/client';
import { randomInt } from 'node:crypto';
import { MODEL, TREATMENTS, type Job, type TreatmentId } from '@/lib/contracts';
import { AppError } from './errors';
import { sign, trustedMediaUrl, verify } from './security';
import type { NormalizedVideo } from './video';

export function readiness() {
  const isKaggle = kaggleSelected();
  const providerReady = isKaggle ? kaggleReady() : Boolean(process.env.FAL_KEY);
  const secretConfigured = Boolean(process.env.JOB_SIGNING_SECRET && process.env.JOB_SIGNING_SECRET.length >= 32);
  const reason = !providerReady
    ? (isKaggle ? 'Set CINEMA_KAGGLE_URL to the private token@tunnel URL.' : 'The inference provider is not connected yet.')
    : !secretConfigured && !isKaggle ? 'Job security is not configured.'
    : process.env.INFERENCE_ENABLED !== 'true' && !isKaggle
      ? 'AI rendering is disabled until a compute budget is authorized.' : undefined;
  // Kaggle is a free, temporary demo worker. A configured URL alone enables
  // inference; no paid provider flag or separate signing secret is needed.
  return { inferenceAvailable: !reason, model: isKaggle ? KAGGLE_MODEL : MODEL, reason, renderCodeRequired: Boolean(process.env.CINEMA_RENDER_CODE) };
}
export function requireInference(request?: Request) {
  const health = readiness();
  if (!health.inferenceAvailable) throw new AppError(503, health.reason!);
  if (request && process.env.CINEMA_RENDER_CODE && request.headers.get('x-cinema-render-code') !== process.env.CINEMA_RENDER_CODE) {
    throw new AppError(403, 'Enter the render access code supplied by the project owner.');
  }
  if (!kaggleSelected()) fal.config({ credentials: process.env.FAL_KEY, retry: { maxRetries: 0 } });
}
type JobClaims = Job & { kind: 'job'; expires: number };
type ExportClaims = { kind: 'export'; url: string; id: string; expires: number };
export async function submitVideo(video: NormalizedVideo, treatmentId: string): Promise<Job> {
  const treatment = TREATMENTS.find(t => t.id === treatmentId);
  if (!treatment) throw new AppError(400, 'Choose a supported cinematic treatment.');
  if (kaggleSelected()) return submitKaggle(video, treatmentId);
  const sourceUrl = trustedMediaUrl(await fal.storage.upload(new File([new Uint8Array(video.bytes)], 'performance.mp4', { type: 'video/mp4' })));
  const config = {
    prompt: treatment.prompt, video_url: sourceUrl, video_strength: 0.7,
    match_video_length: true, match_input_fps: true, generate_audio: false,
    video_size: { width: video.width, height: video.height },
    enable_prompt_expansion: false, enable_safety_checker: true,
    video_output_type: 'X264 (.mp4)', seed: randomInt(1, 2_147_483_647),
  };
  const createdAt = Date.now();
  // Queue submit is intentionally never automatically retried: a lost response may
  // represent a paid job already accepted by the provider.
  // The SDK retries queue submissions internally. Use one bounded HTTP request
  // here to prevent a network retry from creating a second paid render.
  const response = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: 'POST', headers: { Authorization: `Key ${process.env.FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(config), signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new AppError(response.status === 401 ? 503 : 502, 'The inference provider rejected submission. Check credentials, credit and model availability before retrying.');
  const queued = await response.json() as { request_id: string };
  if (!queued.request_id) throw new AppError(502, 'The provider returned no job identifier. Check its request history before submitting again.');
  const job: Omit<Job, 'token'> = { id: queued.request_id, state: 'queued', createdAt, sourceUrl,
    treatment: treatmentId as TreatmentId, model: MODEL, config };
  console.info(JSON.stringify({ event: 'job_submitted', id: job.id, model: MODEL, width: video.width, height: video.height }));
  return { ...job, token: sign({ ...job, kind: 'job' }) };
}
export async function getJob(token: string): Promise<Job> {
  const claims = verify<JobClaims>(token);
  if (claims.kind !== 'job' || (claims.model !== MODEL && claims.model !== KAGGLE_MODEL) || !claims.id) throw new AppError(400, 'Invalid job link.');
  if (claims.model === KAGGLE_MODEL) return getKaggleJob(claims, token);
  // Status and export remain accessible if creation is subsequently disabled.
  if (!process.env.FAL_KEY) throw new AppError(503, 'The inference provider is not connected.');
  fal.config({ credentials: process.env.FAL_KEY });
  const job: Job = { ...claims, token };
  const status = await fal.queue.status(MODEL, { requestId: claims.id, logs: false, abortSignal: AbortSignal.timeout(20_000) });
  if (status.status === 'IN_QUEUE') return { ...job, state: 'queued' };
  if (status.status === 'IN_PROGRESS') return { ...job, state: 'rendering' };
  try {
    const result = await fal.queue.result(MODEL, { requestId: claims.id, abortSignal: AbortSignal.timeout(20_000) });
    const data = result.data as { video: { url: string }; seed?: number };
    const videoUrl = trustedMediaUrl(data.video.url);
    const durationSeconds = Math.round((Date.now() - claims.createdAt) / 1000);
    return { ...job, state: 'succeeded', videoUrl, durationSeconds, inferenceSeconds: status.metrics?.inference_time ?? undefined, seed: data.seed,
      exportToken: sign({ kind: 'export', url: videoUrl, id: claims.id }) };
  } catch (error) {
    const statusCode = (error as { status?: number }).status;
    if (statusCode === 422 || statusCode === 400) {
      return { ...job, state: 'failed', error: 'The model could not render this take. It may have rejected the content or format. Try a different take; no automatic paid retries were made.' };
    }
    throw error;
  }
}
export function exportMedia(token: string) {
  const claims = verify<ExportClaims>(token);
  if (claims.kind !== 'export' || !claims.id) throw new AppError(400, 'Invalid export link.');
  return { url: trustedMediaUrl(claims.url), filename: `cinema-${claims.id.replace(/[^a-zA-Z0-9-]/g, '')}.mp4` };
}
