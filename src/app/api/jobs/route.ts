import { errorResponse } from '@/server/errors';
import { requireInference, submitVideo } from '@/server/inference';
import { rateLimit, sameOrigin } from '@/server/security';
import { normalize, readUpload } from '@/server/video';
import { TREATMENTS } from '@/lib/contracts';
import { AppError } from '@/server/errors';
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    sameOrigin(request); rateLimit(request, 'create-job', 2);
    const treatment = new URL(request.url).searchParams.get('treatment') || '';
    if (!TREATMENTS.some(t => t.id === treatment)) throw new AppError(400, 'Choose a supported treatment.');
    requireInference(request, treatment);
    const job = await submitVideo(await normalize(await readUpload(request), treatment === 'subject-aware'), treatment);
    return Response.json(job, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error, 'submit'); }
}
