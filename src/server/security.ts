import { createHmac, timingSafeEqual } from 'node:crypto';
import { configuredWorkerConnections, backendSelected } from './backend';
import { AppError } from './errors';

const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(request: Request, kind: string, limit: number) {
  const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local';
  const key = `${kind}:${ip.split(',')[0]}`;
  const now = Date.now();
  if (buckets.size > 2000) for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const b = buckets.get(key);
  if (b && b.until > now) {
    if (b.count >= limit) throw new AppError(429, 'Too many requests. Wait a minute before trying again.');
    b.count++;
  } else buckets.set(key, { count: 1, until: now + 60_000 });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const host = request.headers.get('host') || new URL(request.url).host;
  let originUrl: URL;
  try { originUrl = new URL(origin); } catch { throw new AppError(403, 'Please submit from the CINEMA application.'); }
  // Next can reconstruct request.url with the internal bind address (0.0.0.0).
  // The host header preserves the actual browser-facing origin.
  if (!['http:', 'https:'].includes(originUrl.protocol) || originUrl.host !== host) throw new AppError(403, 'Please submit from the CINEMA application.');
}
function key() {
  const configured = process.env.JOB_SIGNING_SECRET;
  if (configured && configured.length >= 32) return configured;

  throw new AppError(503, 'Job security is not configured on this deployment.');
}

export function sign<T extends object>(data: T): string {
  const body = Buffer.from(JSON.stringify({ ...data, expires: Date.now() + 24 * 3600_000 })).toString('base64url');
  return `${body}.${createHmac('sha256', key()).update(body).digest('base64url')}`;
}
export function verify<T extends { expires: number }>(token: string): T {
  if (token.length > 16_000) throw new AppError(400, 'Invalid job link.');
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra) throw new AppError(400, 'Invalid job link.');
  const expected = createHmac('sha256', key()).update(body).digest();
  const supplied = Buffer.from(sig, 'base64url');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new AppError(403, 'Invalid job link.');
  let data: T;
  try { data = JSON.parse(Buffer.from(body, 'base64url').toString()); }
  catch { throw new AppError(400, 'Invalid job link.'); }
  if (!Number.isFinite(data.expires) || data.expires < Date.now()) throw new AppError(410, 'This job link expired after 24 hours. Record or upload a new take.');
  return data;
}
export function trustedMediaUrl(value: string, expectedOrigin?: string, expectedId?: string) {
  let u: URL;
  try { u = new URL(value); } catch { throw new AppError(502, 'The inference provider returned an invalid media address.'); }
  const workerOrigin = expectedOrigin || configuredWorkerConnections().find(c => c.origin === u.origin)?.origin;
  const match = u.pathname.match(/^\/v1\/jobs\/([0-9a-f]{24})\/video$/);
  const expires = u.searchParams.get('e') || '';
  const workerAllowed = Boolean(workerOrigin && u.origin === workerOrigin && match
    && (!expectedId || match[1] === expectedId) && /^\d{9,12}$/.test(expires)
    && /^[0-9a-f]{64}$/.test(u.searchParams.get('s') || '')
    && [...u.searchParams.keys()].length === 2 && u.searchParams.getAll('e').length === 1
    && u.searchParams.getAll('s').length === 1);
  if (workerAllowed) {
    const connection = configuredWorkerConnections().find(c => c.origin === workerOrigin);
    const now = Math.floor(Date.now() / 1000);
    if (!connection || Number(expires) <= now || Number(expires) > now + 14460) throw new AppError(502, 'The worker media link is expired or invalid.');
    const expected = createHmac('sha256', connection.token).update(`${match![1]}:${expires}`).digest();
    const supplied = Buffer.from(u.searchParams.get('s')!, 'hex');
    if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) throw new AppError(502, 'The worker media signature is invalid.');
  }
  const falAllowed = !expectedOrigin && !backendSelected() && (u.hostname === 'fal.media' || u.hostname.endsWith('.fal.media'));
  const local = process.env.NODE_ENV !== 'production' && process.env.CINEMA_ALLOW_LOCAL_ENGINE === 'true'
    && ['127.0.0.1', 'localhost'].includes(u.hostname) && u.protocol === 'http:' && workerAllowed;
  if ((!local && u.protocol !== 'https:') || u.username || u.password || u.hash
      || !(falAllowed || workerAllowed) || (falAllowed && u.port)) {
    throw new AppError(502, 'The inference provider returned an unsupported media address.');
  }
  return u.href;
}
