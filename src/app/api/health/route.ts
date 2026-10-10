import { readiness } from '@/server/inference';
export const dynamic = 'force-dynamic';
export function GET() { return Response.json(readiness(), { headers: { 'Cache-Control': 'no-store' } }); }
