import { connectedReadiness } from '@/server/inference';
export const dynamic = 'force-dynamic';
export async function GET() { return Response.json(await connectedReadiness(), { headers: { 'Cache-Control': 'no-store' } }); }
