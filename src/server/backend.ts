import { isIP } from 'node:net';
import { AppError } from './errors';

// Only connection validation/transport is shared. Engine payloads stay in their adapters.
export function backendSelected() {
  return Boolean(process.env.CINEMA_BACKEND_URL?.trim() || process.env.CINEMA_BACKEND_TOKEN?.trim());
}
export function validatedOrigin(raw: string, allowLocal = false) {
  let u: URL;
  try { u = new URL(raw); } catch { throw new AppError(503, 'Backend URL must be a valid HTTPS origin.'); }
  const local = allowLocal && process.env.NODE_ENV !== 'production' && process.env.CINEMA_ALLOW_LOCAL_ENGINE === 'true'
    && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  if (u.username || u.password || u.pathname !== '/' || u.search || u.hash
      || (u.protocol !== 'https:' && !(local && u.protocol === 'http:'))
      || (!local && (isIP(u.hostname.replace(/^\[|\]$/g, '')) || !u.hostname.includes('.')
        || /(?:^|\.)(?:localhost|local|internal)$/.test(u.hostname)))) {
    throw new AppError(503, 'Use a public HTTPS backend origin without credentials, a path, query or fragment.');
  }
  return u.origin;
}
export function backendConnection() {
  const raw = process.env.CINEMA_BACKEND_URL?.trim();
  const token = process.env.CINEMA_BACKEND_TOKEN?.trim();
  if (!raw || !token || token.length < 32 || /[\r\n\s]/.test(token)) {
    throw new AppError(503, 'Configure CINEMA_BACKEND_URL and a private CINEMA_BACKEND_TOKEN of at least 32 characters.');
  }
  // New public connection is HTTPS-only, including development. Legacy loopback
  // remains available for local tests; explicit HTTPS localhost uses the dev flag.
  const origin = validatedOrigin(raw, true);
  if (!origin.startsWith('https://')) throw new AppError(503, 'CINEMA_BACKEND_URL must use HTTPS.');
  return { origin, token };
}
export async function backendCall(connection: { origin: string; token: string }, path: string, init: RequestInit = {}, timeout = 30_000) {
  let response: Response;
  try {
    response = await fetch(connection.origin + path, { ...init,
      headers: { ...init.headers, Authorization: `Bearer ${connection.token}` }, redirect: 'error',
      cache: 'no-store', signal: AbortSignal.timeout(timeout) });
  } catch { throw new AppError(503, 'The inference worker is unreachable. Your source remains available.'); }
  if (!response.ok) throw new AppError(response.status === 429 ? 429 : response.status === 404 ? 410 : 503,
    response.status === 404 ? 'This job is missing on the worker. Session restarts and provider changes do not migrate jobs.'
      : 'The inference worker rejected this request. Check authentication and its job logs before retrying.');
  try { return await response.json(); }
  catch { throw new AppError(502, 'The inference worker returned invalid JSON.'); }
}
export function assertJobOrigin(config: Record<string, unknown>, origin: string) {
  if ((config.backendOrigin && config.backendOrigin !== origin) || (backendSelected() && !config.backendOrigin)) {
    throw new AppError(410, 'This job belongs to a previous worker connection. Switching providers does not migrate jobs.');
  }
}
export function configuredWorkerConnections() {
  if (backendSelected()) {
    try { return [backendConnection()]; } catch { return []; }
  }
  const connections: { origin: string; token: string }[] = [];
  for (const [raw, override] of [[process.env.CINEMA_KAGGLE_URL, process.env.CINEMA_KAGGLE_TOKEN], [process.env.CINEMA_CINEMATOGRAPHY_URL, undefined]]) {
    if (!raw) continue;
    try {
      const u = new URL(raw); const token = override?.trim() || decodeURIComponent(u.username);
      if (u.password || token.length < 32) continue;
      u.username = '';
      connections.push({ origin: validatedOrigin(u.href, true), token });
    } catch { /* invalid legacy origin */ }
  }
  return connections;
}
export function configuredWorkerOrigins() { return configuredWorkerConnections().map(c => c.origin); }
