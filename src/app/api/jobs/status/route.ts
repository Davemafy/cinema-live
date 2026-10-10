import { errorResponse, AppError } from '@/server/errors';
import { getJob } from '@/server/inference';
import { rateLimit } from '@/server/security';
export const maxDuration = 30;
export async function GET(request: Request) {
  try {
    rateLimit(request, 'status', 40);
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
    if (!token) throw new AppError(400, 'A job link is required.');
    return Response.json(await getJob(token), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error, 'status'); }
}
