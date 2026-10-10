import { errorResponse, AppError } from '@/server/errors';
import { exportMedia } from '@/server/inference';
import { rateLimit } from '@/server/security';
export const maxDuration = 120;
export async function GET(request: Request) {
  try {
    rateLimit(request, 'export', 8);
    const token = new URL(request.url).searchParams.get('token');
    if (!token) throw new AppError(400, 'An export link is required.');
    const media = exportMedia(token);
    const video = await fetch(media.url, { redirect: 'error', signal: AbortSignal.timeout(90_000) });
    if (!video.ok || !video.body) throw new AppError(502, 'The video download is unavailable. Refresh the job status and retry.');
    // Stream instead of buffering: export may exceed the request/body cap.
    return new Response(video.body, { headers: {
      'Content-Type': 'video/mp4', 'Content-Disposition': `attachment; filename="${media.filename}"`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) { return errorResponse(error, 'export'); }
}
