import { TREATMENTS, type Job, type TreatmentId } from '@/lib/contracts';
import { AppError } from './errors';
import { sign, trustedMediaUrl } from './security';
import type { NormalizedVideo } from './video';

export const KAGGLE_MODEL = 'kaggle/ltx-video-conditioned-2b';

function connection() {
  // One private Vercel URL is enough for the demo:
  // https://KAGGLE_BEARER_TOKEN@random.trycloudflare.com
  // Never make this a NEXT_PUBLIC_ variable or copy it into a browser URL.
  const raw = process.env.CINEMA_KAGGLE_URL?.trim();
  if (!raw) throw new AppError(503, 'Kaggle backend URL is not configured.');
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new AppError(503, 'Kaggle backend URL is invalid.'); }
  const token = process.env.CINEMA_KAGGLE_TOKEN?.trim() || decodeURIComponent(url.username);
  if (!token || token.length < 32) {
    throw new AppError(503, 'Use https://YOUR_KAGGLE_API_TOKEN@YOUR_TUNNEL.trycloudflare.com as the private server-side URL.');
  }
  if (url.protocol !== 'https:' || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new AppError(503, 'Kaggle URL must be a secure HTTPS origin with its token in the username.');
  }
  if (!url.hostname.endsWith('.trycloudflare.com')) {
    throw new AppError(503, 'The demo worker must be hosted on its Cloudflare Quick Tunnel address.');
  }
  return { origin: url.origin, token };
}

export function kaggleSelected() {
  return Boolean(process.env.CINEMA_KAGGLE_URL);
}
export function kaggleReady() {
  try { connection(); return true; } catch { return false; }
}

function promptFor(treatmentId: string): string {
  // LTX 2B now conditions on sampled frames from the supplied source video.
  // Motion fidelity is not guaranteed at this small model/compute budget.
  if (treatmentId === 'noir') {
    return 'Restyle this supplied performance as a single continuous 1940s film-noir shot. Black-and-white monochrome. Preserve the original subject, camera framing, position, movement direction, and action timing. Sculpted side lighting, deep detailed shadows, crisp chiaroscuro, soft film grain, natural faces and hands. No additional people, no new actions, no scene cuts, no morphing, no text.';
  }
  const item = TREATMENTS.find(t => t.id === treatmentId);
  if (!item) throw new AppError(400, 'Unknown treatment.');
  return item.prompt;
}

export async function submitKaggle(video: NormalizedVideo, treatmentId: string): Promise<Job> {
  const { origin, token } = connection();
  const prompt = promptFor(treatmentId);
  const data = new FormData();
  data.set('prompt', prompt);
  data.set('video', new File([new Uint8Array(video.bytes)], 'cinema-source.mp4', { type: 'video/mp4' }));
  let response: Response;
  try {
    response = await fetch(origin + '/v1/jobs', {
      method: 'POST',
      body: data,
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(45_000),
      cache: 'no-store',
    });
  } catch {
    throw new AppError(503, 'Kaggle worker is unreachable. The notebook or tunnel may have stopped.');
  }
  if (!response.ok) {
    throw new AppError(response.status === 429 ? 429 : 503, 'Kaggle did not accept the job. Check its notebook logs and tunnel before retrying.');
  }
  const queued = await response.json() as { id?: string };
  if (!queued.id || !/^[0-9a-f]{24}$/.test(queued.id)) throw new AppError(502, 'Kaggle returned an invalid job identifier.');
  const createdAt = Date.now();
  const config: Record<string, unknown> = {
    provider: 'kaggle', conditioning: 'source-video-frames', width: 384, height: 256,
    num_frames: 49, prompt, sample_steps: 20, denoise_strength: 0.58,
  };
  const job: Omit<Job, 'token'> = {
    id: queued.id, state: 'queued', createdAt, treatment: treatmentId as TreatmentId,
    model: KAGGLE_MODEL, sourceUrl: '', config,
  };
  return { ...job, token: sign({ ...job, kind: 'job' }) };
}

type SignedJob = Job & { kind: 'job'; expires: number };
export async function getKaggleJob(claims: SignedJob, token: string): Promise<Job> {
  const { origin, token: apiToken } = connection();
  let response: Response;
  try {
    response = await fetch(origin + '/v1/jobs/' + encodeURIComponent(claims.id), {
      headers: { Authorization: 'Bearer ' + apiToken }, cache: 'no-store', signal: AbortSignal.timeout(20_000),
    });
  } catch { throw new AppError(503, 'Kaggle worker disconnected. Restart the notebook and check its public tunnel URL.'); }
  if (!response.ok) {
    throw new AppError(503, response.status === 404
      ? 'This job was lost when the temporary Kaggle session restarted.'
      : 'The Kaggle worker could not report job status.');
  }
  const data = await response.json() as {
    state?: string; error?: string; videoUrl?: string; inferenceSeconds?: number;
  };
  const job: Job = { ...claims, token };
  if (data.state === 'queued') return { ...job, state: 'queued' };
  if (data.state === 'rendering') return { ...job, state: 'rendering' };
  if (data.state === 'failed') return { ...job, state: 'failed', error: data.error || 'Inference failed on the Kaggle worker.' };
  if (data.state !== 'succeeded' || !data.videoUrl) {
    throw new AppError(502, 'Unexpected response from Kaggle worker.');
  }
  const videoUrl = trustedMediaUrl(data.videoUrl);
  return {
    ...job, state: 'succeeded', videoUrl,
    durationSeconds: Math.round((Date.now() - claims.createdAt) / 1000),
    inferenceSeconds: data.inferenceSeconds,
    exportToken: sign({ kind: 'export', url: videoUrl, id: claims.id }),
  };
}
