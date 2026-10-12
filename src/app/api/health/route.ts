import { readiness } from '@/server/inference';
import { CINEMATOGRAPHY_MODEL, cinematographyConnection } from '@/server/cinematography';

export const dynamic = 'force-dynamic';

// A configured URL is not evidence that a temporary Kaggle notebook is alive.
// Probe the worker so the browser never advertises an unverified live treatment.
export async function GET() {
  const status = readiness();
  const treatment = status.treatments['subject-aware'];
  if (treatment.available) {
    try {
      const { origin, token } = cinematographyConnection();
      const response = await fetch(origin + '/health', {
        headers: { Authorization: 'Bearer ' + token },
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      });
      const data = response.ok ? await response.json() as {
        model?: string; mode?: string; ltxFallback?: boolean; ok?: boolean;
      } : {};
      if (!response.ok || data.ok === false || data.model !== CINEMATOGRAPHY_MODEL
        || data.mode !== 'subject-aware' || data.ltxFallback !== false) {
        treatment.available = false;
        treatment.reason = 'The connected GPU worker is not ready for Directed light. Check the Kaggle notebook and tunnel.';
      }
    } catch {
      treatment.available = false;
      treatment.reason = 'The temporary GPU worker is offline. Start Kaggle and reconnect.';
    }
  }
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
