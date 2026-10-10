import { errorResponse } from '@/server/errors';
import { rateLimit, sameOrigin } from '@/server/security';
import { normalize, readUpload } from '@/server/video';
export const maxDuration = 60;
let active = 0;
export async function POST(request: Request) {
  try {
    sameOrigin(request); rateLimit(request, 'normalize', 8);
    if (active >= 3) return Response.json({ error: 'Video processing is busy. Try again shortly.' }, { status: 429 });
    active++;
    try {
      const video = await normalize(await readUpload(request));
      return new Response(new Uint8Array(video.bytes), { headers: {
        'Content-Type': 'video/mp4', 'Cache-Control': 'no-store',
        'X-Video-Width': String(video.width), 'X-Video-Height': String(video.height),
        'X-Video-Duration': String(video.duration), 'X-Input-Duration': String(video.inputDuration),
      } });
    } finally { active--; }
  } catch (error) { return errorResponse(error, 'normalize'); }
}
