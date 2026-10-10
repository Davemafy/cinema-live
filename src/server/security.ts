import { createHmac, timingSafeEqual } from 'node:crypto';
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
  const value = process.env.JOB_SIGNING_SECRET;
  if (!value || value.length < 32) throw new AppError(503, 'Job security is not configured on this deployment.');
  return value;
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
export function trustedMediaUrl(value: string) {
  const u = new URL(value);
  const falAllowed = u.hostname === 'fal.media' || u.hostname.endsWith('.fal.media');
  let kaggleAllowed = false;
  try {
    const configured = process.env.CINEMA_KAGGLE_URL;
    if (configured) {
      const backend = new URL(configured);
      kaggleAllowed =
        u.origin === backend.origin &&
        /^\/v1\/jobs\/[0-9a-f]{24}\/video$/.test(u.pathname) &&
        /^\d{9,12}$/.test(u.searchParams.get('e') || '') &&
        /^[0-9a-f]{64}$/.test(u.searchParams.get('s') || '');
    }
  } catch { /* Invalid configuration must never open another host. */ }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || !(falAllowed || kaggleAllowed)) {
    throw new AppError(502, 'The inference provider returned an unsupported media address.');
  }
  return u.href;
}
